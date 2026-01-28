import { Response, NextFunction } from 'express';
import prisma from '../../config/db';
import { AuthRequest } from '../../middleware/auth.middleware';
import { z } from 'zod';

const docSchema = z.object({
    title: z.string(),
    referenceNumber: z.string(),
    classification: z.enum(['PUBLIC', 'INTERNAL', 'CONFIDENTIAL']).optional().default('INTERNAL'),
    type: z.enum(['PERSONAL', 'TRAINING', 'NATIONAL_ID', 'CONTRACT', 'REVIEW', 'PAYROLL', 'OTHER']).optional().default('OTHER'),
    fileUrl: z.string().optional(),
    fileName: z.string(),
    fileSize: z.number(),
    description: z.string().optional(),
    ownerId: z.string().optional(),
});

export const getDocuments = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const { role, organizationId } = req.user!;

        let where: any = {};
        if (role !== 'SUPER_ADMIN') {
            where.organizationId = organizationId;
        }

        // If checking for a specific owner (e.g. "My Documents")
        if (req.query.ownerId) {
            where.ownerId = req.query.ownerId;
        }

        const docs = await prisma.document.findMany({
            where,
            include: {
                createdBy: {
                    select: { fullName: true, email: true }
                },
                owner: {
                    select: { fullName: true, email: true }
                }
            },
            orderBy: { createdAt: 'desc' }
        });
        res.json(docs);
    } catch (error) {
        next(error);
    }
};

export const createDocument = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const data = docSchema.parse(req.body);
        const { userId, organizationId } = req.user!;

        if (!organizationId) {
            return res.status(400).json({ message: 'User must belong to an organization' });
        }

        const doc = await prisma.document.create({
            data: {
                title: data.title,
                referenceNumber: data.referenceNumber,
                classification: data.classification as any,
                type: data.type as any,
                fileUrl: data.fileUrl,
                fileName: data.fileName,
                fileSize: data.fileSize,
                description: data.description,
                createdById: userId,
                organizationId: organizationId,
                ownerId: data.ownerId || userId, // Default to creator if not specified
            },
            include: {
                createdBy: {
                    select: { fullName: true, email: true }
                }
            }
        });
        res.status(201).json(doc);
    } catch (error) {
        next(error);
    }
};















// import { Response, NextFunction } from 'express';
// import prisma from '../../config/db';
// import { AuthRequest } from '../../middleware/auth.middleware';
// import { z } from 'zod';

// const docSchema = z.object({
//     title: z.string(),
//     referenceNumber: z.string(),
//     classification: z.enum(['PUBLIC', 'INTERNAL', 'CONFIDENTIAL']),
//     fileUrl: z.string().optional(),
// });

// export const getDocuments = async (req: AuthRequest, res: Response, next: NextFunction) => {
//     try {
//         const { role, organizationId } = req.user!;

//         let where = {};
//         if (role !== 'SUPER_ADMIN') {
//             where = { organizationId };
//         }

//         const docs = await prisma.document.findMany({
//             where,
//             include: {
//                 createdBy: {
//                     select: { fullName: true, email: true }
//                 }
//             }
//         });
//         res.json(docs);
//     } catch (error) {
//         next(error);
//     }
// };

// export const createDocument = async (req: AuthRequest, res: Response, next: NextFunction) => {
//     try {
//         const data = docSchema.parse(req.body);
//         const { userId, organizationId } = req.user!;

//         if (!organizationId) {
//             return res.status(400).json({ message: 'User must belong to an organization' });
//         }

//         const doc = await prisma.document.create({
//             data: {
//                 ...data,
//                 createdById: userId,
//                 organizationId: organizationId,
//             },
//         });
//         res.status(201).json(doc);
//     } catch (error) {
//         next(error);
//     }
// };
