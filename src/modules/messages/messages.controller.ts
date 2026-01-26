import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../middleware/auth.middleware';
import prisma from '../../config/db';
import { z } from 'zod';

const messageSchema = z.object({
    content: z.string(),
    letterId: z.string().optional(),
    recipientOrgId: z.string().optional(),
});

export const sendMessage = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const data = messageSchema.parse(req.body);
        const { userId } = req.user!;

        const message = await prisma.message.create({
            data: {
                content: data.content,
                letterId: data.letterId,
                senderId: userId,
                recipientOrgId: data.recipientOrgId,
            }
        });

        res.status(201).json(message);
    } catch (error) {
        next(error);
    }
};

export const getMessagesByLetter = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
        const letterId = id as string;
        const messages = await prisma.message.findMany({
            where: { letterId },
            include: {
                sender: {
                    select: { fullName: true, role: true }
                }
            },
            orderBy: { createdAt: 'asc' }
        });
        res.json(messages);
    } catch (error) {
        next(error);
    }
};

export const getMyMessages = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const { userId, organizationId, role } = req.user!;

        let where: any = {};
        if (role === 'APPLICANT') {
            where = { senderId: userId };
        } else if (organizationId) {
            where = { recipientOrgId: organizationId };
        }

        const messages = await prisma.message.findMany({
            where,
            include: {
                letter: {
                    select: { referenceNumber: true, subject: true }
                },
                sender: {
                    select: { fullName: true }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        res.json(messages);
    } catch (error) {
        next(error);
    }
};
