import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../middleware/auth.middleware';
import prisma from '../../config/db';
import { z } from 'zod';

const messageSchema = z.object({
    content: z.string(),
    recipientId: z.string().optional(),
    letterId: z.string().optional(),
    recipientOrgId: z.string().optional(),
});

export const sendMessage = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const data = messageSchema.parse(req.body);
        const { userId } = req.user!;

        const message = await (prisma.message as any).create({
            data: {
                content: data.content,
                letterId: data.letterId,
                senderId: userId,
                recipientId: data.recipientId,
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
        const { userId } = req.user!;

        // Get unique conversation partners (people I've sent to or received from)
        const sentMessages = await (prisma.message as any).findMany({
            where: { senderId: userId, recipientId: { not: null } },
            include: { recipient: { select: { id: true, fullName: true, role: true } } },
            distinct: ['recipientId']
        });

        const receivedMessages = await (prisma.message as any).findMany({
            where: { recipientId: userId },
            include: { sender: { select: { id: true, fullName: true, role: true } } },
            distinct: ['senderId']
        });

        // Combine and find unique users
        const partnersMap = new Map();
        (sentMessages as any[]).forEach(m => {
            if (m.recipient) partnersMap.set(m.recipient.id, m.recipient);
        });
        (receivedMessages as any[]).forEach(m => {
            if (m.sender) partnersMap.set(m.sender.id, m.sender);
        });

        const chats = Array.from(partnersMap.values()).map(user => ({
            id: user.id,
            name: user.fullName,
            role: user.role,
            lastMessage: 'Open to view conversation'
        }));

        res.json(chats);
    } catch (error) {
        next(error);
    }
};

export const getChatHistory = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const { userId } = req.user!;
        const { partnerId } = req.params;

        const messages = await (prisma.message as any).findMany({
            where: {
                OR: [
                    { senderId: userId, recipientId: partnerId as string },
                    { senderId: partnerId as string, recipientId: userId }
                ]
            },
            orderBy: { createdAt: 'asc' }
        });

        res.json(messages);
    } catch (error) {
        console.error('[getChatHistory] Error:', error);
        next(error);
    }
};
