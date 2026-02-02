import { Response, NextFunction } from 'express';
import prisma from '../../config/db';
import { z } from 'zod';
import { AuthRequest } from '../../middleware/auth.middleware';

const eventSchema = z.object({
    title: z.string().min(1),
    description: z.string().optional(),
    startDate: z.string().transform((str) => new Date(str)),
    endDate: z.string().optional().transform((str) => str ? new Date(str) : undefined),
    location: z.string().optional(),
});

export const getEvents = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const organizationId = req.user?.organizationId;
        if (!organizationId) {
            return res.status(400).json({ message: 'User does not belong to an organization' });
        }

        const events = await prisma.event.findMany({
            where: { organizationId },
            orderBy: { startDate: 'asc' }
        });

        res.json(events);
    } catch (error) {
        next(error);
    }
};

export const createEvent = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const organizationId = req.user?.organizationId;
        if (!organizationId) {
            return res.status(400).json({ message: 'User does not belong to an organization' });
        }

        const data = eventSchema.parse(req.body);

        const event = await prisma.event.create({
            data: {
                ...data,
                organizationId
            }
        });

        res.status(201).json(event);
    } catch (error) {
        next(error);
    }
};

export const deleteEvent = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        await prisma.event.delete({
            where: { id }
        });
        res.json({ message: 'Event deleted' });
    } catch (error) {
        next(error);
    }
};
