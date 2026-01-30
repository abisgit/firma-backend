import { Response, NextFunction } from 'express';
import prisma from '../../config/db';
import { z } from 'zod';
import { AuthRequest } from '../../middleware/auth.middleware';

const markAttendanceSchema = z.object({
    date: z.string().transform((str) => new Date(str)),
    records: z.array(z.object({
        studentId: z.string(),
        status: z.enum(['PRESENT', 'ABSENT', 'LATE', 'EXCUSED']),
        remarks: z.string().optional()
    }))
});

export const getAttendanceByClass = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const { classId } = req.params;
        const { date } = req.query;

        const targetDate = date ? new Date(date as string) : new Date();
        targetDate.setHours(0, 0, 0, 0);

        const attendance = await prisma.attendance.findMany({
            where: {
                student: { classId },
                date: {
                    gte: targetDate,
                    lt: new Date(targetDate.getTime() + 24 * 60 * 60 * 1000)
                }
            },
            include: {
                student: {
                    include: {
                        user: {
                            select: { fullName: true }
                        }
                    }
                }
            }
        });

        res.json(attendance);
    } catch (error) {
        next(error);
    }
};

export const markAttendance = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const { date, records } = markAttendanceSchema.parse(req.body);
        const markedById = req.user?.userId;

        if (!markedById) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        const targetDate = new Date(date);
        targetDate.setHours(0, 0, 0, 0);

        const results = await prisma.$transaction(
            records.map(record => prisma.attendance.upsert({
                where: {
                    studentId_date: {
                        studentId: record.studentId,
                        date: targetDate
                    }
                },
                update: {
                    status: record.status,
                    remarks: record.remarks,
                    markedById
                },
                create: {
                    studentId: record.studentId,
                    date: targetDate,
                    status: record.status,
                    remarks: record.remarks,
                    markedById
                }
            }))
        );

        res.json({ message: 'Attendance marked successfully', results });
    } catch (error) {
        next(error);
    }
};

export const getStudentAttendance = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const studentId = req.params.studentId || (req.user?.role === 'STUDENT' ? await prisma.student.findUnique({ where: { userId: req.user.userId } }).then((s: any) => s?.id) : null);

        if (!studentId) {
            return res.status(400).json({ message: 'Student ID required or user is not a student' });
        }

        const attendance = await prisma.attendance.findMany({
            where: { studentId },
            orderBy: { date: 'desc' },
            take: 30
        });

        res.json(attendance);
    } catch (error) {
        next(error);
    }
};
