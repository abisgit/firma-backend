import { Response, NextFunction } from 'express';
import prisma from '../../config/db';
import { z } from 'zod';
import { AuthRequest } from '../../middleware/auth.middleware';

const addTimetableSchema = z.object({
    classId: z.string(),
    subjectId: z.string(),
    teacherId: z.string(),
    dayOfWeek: z.number().min(1).max(7), // 1=Monday... 7=Sunday
    startTime: z.string(), // "HH:mm"
    endTime: z.string(),
    room: z.string().optional()
});

export const getTimetableByClass = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const classId = req.params.classId as string;
        const timetable = await prisma.timetable.findMany({
            where: { classId },
            include: {
                subject: true,
                class: true,
                teacher: {
                    include: { user: { select: { fullName: true } } }
                }
            }
        });
        res.json(timetable);
    } catch (error) {
        next(error);
    }
};

export const addTimetableEntry = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const data = addTimetableSchema.parse(req.body);
        const entry = await prisma.timetable.create({
            data
        });
        res.status(201).json(entry);
    } catch (error) {
        next(error);
    }
};
