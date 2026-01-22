
import { Response, NextFunction } from 'express';
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

        if (!organizationId) {
            return res.status(400).json({ message: 'User must belong to an organization' });
        }

        const senderOrg = await prisma.organization.findUnique({
            where: { id: organizationId }
        });
        if (!senderOrg) return res.status(400).json({ message: 'Organization not found' });

        const referenceNumber = await generateReferenceNumber(senderOrg.code);

        const letter = await prisma.letter.create({
            data: {
                ...data,
                referenceNumber,
                senderOrgId: organizationId,
                createdById: userId,
            },
        });
        res.status(201).json(letter);
    } catch (error) {
        next(error);
    }
};

export const getLetterByRef = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const { org, year, seq } = req.params;
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
        const { id } = req.params;
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
        const { id } = req.params;
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
