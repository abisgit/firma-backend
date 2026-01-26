
import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from '../../middleware/auth.middleware';
import prisma from '../../config/db';
import { z } from 'zod';

const letterSchema = z.object({
  subject: z.string(),
  content: z.string(),
  letterType: z.enum(['HIERARCHICAL', 'CROSS_STRUCTURE', 'STAFF', 'C_STAFF', 'HEAD_OFFICE', 'GUEST']),
  classification: z.enum(['PUBLIC', 'INTERNAL', 'CONFIDENTIAL']),
  recipientOrgId: z.string().optional(),
  recipientUserId: z.string().optional(),
  templateId: z.string().optional(),
  stampId: z.number().optional(),
  stampX: z.number().optional(),
  stampY: z.number().optional(),
  headerImage: z.string().optional(),
});

const generateReferenceNumber = async (orgCode: string) => {
  const year = new Date().getFullYear();
  const count = await prisma.letter.count({
    where: {
      senderOrg: { code: orgCode },
      letterDate: {
        gte: new Date(`${year}-01-01`),
        lt: new Date(`${year + 1}-01-01`),
      }
    }
  });
  const seq = (count + 1).toString().padStart(3, '0');
  return `${orgCode}/${year}/${seq}`;
};

export const createLetter = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const data = letterSchema.parse(req.body);
    const { userId, organizationId } = req.user!;
    // For APPLICANT role, handle specially
    if (req.user?.role === 'APPLICANT') {
      const year = new Date().getFullYear();
      const count = await prisma.letter.count({
        where: {
          createdById: userId,
          referenceNumber: { startsWith: `APP/${year}/` }
        }
      });
      const seq = (count + 1).toString().padStart(4, '0');
      const referenceNumber = `APP/${year}/${seq}`;

      const letter = await prisma.letter.create({
        data: {
          ...data,
          referenceNumber,
          createdById: userId,
          letterType: 'GUEST' as any,
          status: 'SENT' as any,
        } as any,
      });
      return res.status(201).json(letter);
    }

    if (!organizationId) {
      return res.status(400).json({ message: 'User must belong to an organization' });
    }

    const senderOrg = await prisma.organization.findUnique({
      where: { id: organizationId }
    });
    if (!senderOrg) {
      return res.status(400).json({ message: 'Organization not found' });
    }

    const year = new Date().getFullYear();
    const prefix = `${senderOrg.code}/${year}/`;

    // Retry loop to handle concurrent race conditions
    let retries = 5;
    while (retries > 0) {
      try {
        const letter = await prisma.$transaction(async (tx) => {
          // 1. Get raw max sequence from DB string sort
          const lastLetter = await tx.letter.findFirst({
            where: {
              senderOrgId: organizationId,
              referenceNumber: { startsWith: prefix }
            },
            orderBy: { referenceNumber: 'desc' }
          });

          let maxSeq = 0;
          if (lastLetter) {
            try {
              const parts = lastLetter.referenceNumber.split('/');
              const lastSeqNum = parseInt(parts[parts.length - 1], 10);
              if (!isNaN(lastSeqNum)) maxSeq = lastSeqNum;
            } catch (err) { /* ignore parse error */ }
          }

          // 2. Get counter value (might be ahead or behind)
          const counter = await tx.letterCounter.findUnique({
            where: { orgId_year: { orgId: organizationId, year } }
          });
          if (counter && counter.value > maxSeq) {
            maxSeq = counter.value;
          }

          // 3. Find the next specific available slot (Brute force safety check)
          let nextSeq = maxSeq;
          let candidateRef = '';

          let attempts = 0;
          while (attempts < 100) {
            nextSeq++;
            candidateRef = `${prefix}${String(nextSeq).padStart(3, '0')}`;

            // Checks availability explicitly
            const existing = await tx.letter.findUnique({
              where: { referenceNumber: candidateRef }
            });

            if (!existing) {
              break; // Found a valid slot!
            }
            attempts++;
          }

          // 4. Update the counter to this new high water mark
          await tx.letterCounter.upsert({
            where: { orgId_year: { orgId: organizationId, year } },
            update: { value: nextSeq },
            create: { orgId: organizationId, year, value: nextSeq }
          });

          // 5. Resolve recipientOrgId if provided as Code
          let resolvedRecipientOrgId = data.recipientOrgId;
          if (data.recipientOrgId) {
            const org = await tx.organization.findFirst({
              where: {
                OR: [
                  { id: data.recipientOrgId },
                  { code: data.recipientOrgId }
                ]
              }
            });
            if (org) {
              resolvedRecipientOrgId = org.id;
            } else {
              // If not found, we might want to throw or handle. For now, let's keep it if it's already a UUID or null
            }
          }

          // 6. Create letter
          return tx.letter.create({
            data: {
              ...data,
              recipientOrgId: resolvedRecipientOrgId,
              referenceNumber: candidateRef,
              senderOrgId: organizationId,
              createdById: userId
            }
          });
        });

        return res.status(201).json(letter);

      } catch (err: any) {
        if (err.code === 'P2002') {
          console.warn(`[CreateLetter] Race condition collision. Retrying... (${retries})`);
          retries--;
          if (retries === 0) throw new Error('System busy, please try again.');
          await new Promise(resolve => setTimeout(resolve, 50 + Math.random() * 100));
          continue;
        }
        throw err;
      }
    }
  } catch (error) {
    next(error);
  }
};








// export const createLetter = async (req: AuthRequest, res: Response, next: NextFunction) => {
//   try {
//     const data = letterSchema.parse(req.body);
//     const { userId, organizationId } = req.user!;

//     if (!organizationId) {
//       return res.status(400).json({ message: 'User must belong to an organization' });
//     }

//     const senderOrg = await prisma.organization.findUnique({
//       where: { id: organizationId }
//     });
//     if (!senderOrg) {
//       return res.status(400).json({ message: 'Organization not found' });
//     }

//     const letter = await prisma.$transaction(async (tx) => {
//       const year = new Date().getFullYear();

//       // 1️⃣ Get the highest existing sequence for this org + year
//       const lastLetter = await tx.letter.findFirst({
//         where: {
//           senderOrgId: organizationId,
//           letterDate: {
//             gte: new Date(`${year}-01-01`),
//             lt: new Date(`${year + 1}-01-01`)
//           }
//         },
//         orderBy: { createdAt: 'desc' }
//       });

//       let nextSeq = 1;
//       if (lastLetter) {
//         const parts = lastLetter.referenceNumber.split('/');
//         const seqNum = parseInt(parts[2], 10);
//         if (!isNaN(seqNum)) nextSeq = seqNum + 1;
//       }

//       // 2️⃣ Upsert counter to match this nextSeq
//       await tx.letterCounter.upsert({
//         where: {
//           orgId_year: { orgId: organizationId, year }
//         },
//         update: { value: nextSeq },
//         create: { orgId: organizationId, year, value: nextSeq }
//       });

//       const referenceNumber = `${senderOrg.code}/${year}/${String(nextSeq).padStart(3, '0')}`;

//       // 3️⃣ Create the letter
//       return tx.letter.create({
//         data: {
//           ...data,
//           referenceNumber,
//           senderOrgId: organizationId,
//           createdById: userId
//         }
//       });
//     });

//     res.status(201).json(letter);
//   } catch (error) {
//     next(error);
//   }
// };



// export const createLetter = async (
//   req: AuthRequest,
//   res: Response,
//   next: NextFunction
// ) => {
//   try {
//     const data = letterSchema.parse(req.body);
//     const { userId, organizationId } = req.user!;

//     if (!organizationId) {
//       return res.status(400).json({ message: 'User must belong to an organization' });
//     }

//     const senderOrg = await prisma.organization.findUnique({
//       where: { id: organizationId }
//     });
//     if (!senderOrg) {
//       return res.status(400).json({ message: 'Organization not found' });
//     }

//     const letter = await prisma.$transaction(async (tx) => {
//       const year = new Date().getFullYear();

//       // 🔒 Atomic increment (NO race condition)
//       const counter = await tx.letterCounter.upsert({
//         where: {
//           orgId_year: {
//             orgId: organizationId,
//             year
//           }
//         },
//         update: {
//           value: { increment: 1 }
//         },
//         create: {
//           orgId: organizationId,
//           year,
//           value: 1
//         }
//       });

//       const seq = String(counter.value).padStart(3, '0');
//       const referenceNumber = `${senderOrg.code}/${year}/${seq}`;

//       return tx.letter.create({
//         data: {
//           ...data,
//           referenceNumber,
//           senderOrgId: organizationId,
//           createdById: userId
//         }
//       });
//     });

//     res.status(201).json(letter);
//   } catch (error) {
//     next(error);
//   }
// };


// export const createLetter = async (req: AuthRequest, res: Response, next: NextFunction) => {
//   try {
//     const data = letterSchema.parse(req.body);
//     const { userId, organizationId } = req.user!;

//     if (!organizationId) {
//       return res.status(400).json({ message: 'User must belong to an organization' });
//     }

//     const senderOrg = await prisma.organization.findUnique({
//       where: { id: organizationId }
//     });
//     if (!senderOrg) {
//       return res.status(400).json({ message: 'Organization not found' });
//     }

//     const letter = await prisma.$transaction(async (tx) => {
//       const year = new Date().getFullYear();

//       const count = await tx.letter.count({
//         where: {
//           senderOrgId: organizationId,
//           createdAt: {
//             gte: new Date(`${year}-01-01`),
//             lt: new Date(`${year + 1}-01-01`),
//           }
//         }
//       });

//       const seq = String(count + 1).padStart(3, '0');
//       const referenceNumber = `${senderOrg.code}/${year}/${seq}`;

//       return tx.letter.create({
//         data: {
//           ...data,
//           referenceNumber,
//           senderOrgId: organizationId,
//           createdById: userId,
//         }
//       });
//     });

//     res.status(201).json(letter);
//   } catch (error) {
//     next(error);
//   }
// };


// export const createLetter = async (req: AuthRequest, res: Response, next: NextFunction) => {
//     try {
//         const data = letterSchema.parse(req.body);
//         const { userId, organizationId } = req.user!;

//         if (!organizationId) {
//             return res.status(400).json({ message: 'User must belong to an organization' });
//         }

//         const senderOrg = await prisma.organization.findUnique({
//             where: { id: organizationId }
//         });
//         if (!senderOrg) return res.status(400).json({ message: 'Organization not found' });

//         const referenceNumber = await generateReferenceNumber(senderOrg.code);

//         const letter = await prisma.letter.create({
//             data: {
//                 ...data,
//                 referenceNumber,
//                 senderOrgId: organizationId,
//                 createdById: userId,
//             },
//         });
//         res.status(201).json(letter);
//     } catch (error) {
//         next(error);
//     }
// };

export const getLetterByRef = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const org = Array.isArray(req.params.org) ? req.params.org[0] : req.params.org;
    const year = Array.isArray(req.params.year) ? req.params.year[0] : req.params.year;
    const seq = Array.isArray(req.params.seq) ? req.params.seq[0] : req.params.seq;
    const referenceNumber = `${org}/${year}/${seq}`;

    const letter = await prisma.letter.findUnique({
      where: { referenceNumber },
      include: {
        senderOrg: true,
        recipientOrg: true,
        recipientUser: true,
        createdBy: true,
        template: true,
        stamp: true, // Include stamp
        attachments: true,
        ccRecipients: { include: { organization: true } }
      }
    });

    if (!letter) {
      return res.status(404).json({ message: 'Letter not found' });
    }
    res.json(letter);
  } catch (error) {
    next(error);
  }
};

export const getLetterById = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    // const { id } = req.params;
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

    const letter = await prisma.letter.findUnique({
      where: { id },
      include: {
        senderOrg: true,
        recipientOrg: true,
        recipientUser: true,
        createdBy: true,
        template: true,
        stamp: true,
        attachments: true,
        ccRecipients: { include: { organization: true } }
      }
    });
    if (!letter) return res.status(404).json({ message: 'Letter not found' });
    res.json(letter);
  } catch (error) {
    next(error);
  }
};

export const updateStampPosition = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    // const { id } = req.params;
    const id = (Array.isArray(req.params.id) ? req.params.id[0] : req.params.id) as string;

    const { stampId, stampX, stampY } = req.body;

    const letter = await prisma.letter.update({
      where: { id },
      data: {
        stampId,
        stampX,
        stampY
      },
      include: { stamp: true }
    });

    res.json(letter);
  } catch (error) {
    next(error);
  }
};

export const getLetters = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { organizationId, userId, role } = req.user!;

    let where: any = {};

    if (role === 'APPLICANT') {
      where = { createdById: userId };
    } else if (role !== 'SUPER_ADMIN') {
      if (!organizationId) {
        return res.status(400).json({ message: 'User must belong to an organization' });
      }
      where = {
        OR: [
          { senderOrgId: organizationId },
          { recipientOrgId: organizationId },
          { recipientUserId: userId }
        ]
      };
    }

    const letters = await prisma.letter.findMany({
      where,
      include: {
        senderOrg: true,
        recipientOrg: true,
        recipientUser: true,
        createdBy: true
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json(letters);
  } catch (error) {
    next(error);
  }
};

export const getPublicLetter = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = (Array.isArray(req.params.id) ? req.params.id[0] : req.params.id) as string;
    const letter = await prisma.letter.findUnique({
      where: { id },
      include: {
        senderOrg: true,
        recipientOrg: true,
        recipientUser: {
          select: { fullName: true, position: true }
        },
        createdBy: {
          select: { fullName: true, position: true }
        },
        stamp: true
      }
    });

    if (!letter) {
      return res.status(404).json({ message: 'Letter not found' });
    }

    res.json(letter);
  } catch (error) {
    next(error);
  }
};
export const updateApplicationStatus = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const id = (Array.isArray(req.params.id) ? req.params.id[0] : req.params.id) as string;
    const { status } = req.body; // status is of type ApplicationStatus enum

    const letter = await prisma.letter.update({
      where: { id: id as string },
      data: { applicationStatus: status }
    });

    res.json(letter);
  } catch (error) {
    next(error);
  }
};
