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

        // Get all messages involving the user to find partners and their last messages
        const messages = await (prisma.message as any).findMany({
            where: {
                OR: [
                    { senderId: userId, recipientId: { not: null } },
                    { recipientId: userId }
                ]
            },
            include: {
                sender: { select: { id: true, fullName: true, role: true } },
                recipient: { select: { id: true, fullName: true, role: true } }
            },
            orderBy: { createdAt: 'desc' }
        });

        const partnersMap = new Map();
        (messages as any[]).forEach(msg => {
            const partner = msg.senderId === userId ? msg.recipient : msg.sender;
            if (partner && !partnersMap.has(partner.id)) {
                partnersMap.set(partner.id, {
                    id: partner.id,
                    name: partner.fullName,
                    role: partner.role,
                    lastMessage: msg.content,
                    lastMessageAt: msg.createdAt
                });
            }
        });

        const chats = Array.from(partnersMap.values());
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
