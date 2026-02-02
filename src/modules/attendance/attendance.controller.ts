import { Response, NextFunction } from 'express';
import prisma from '../../config/db';
import { z } from 'zod';
import { AuthRequest } from '../../middleware/auth.middleware';

const markAttendanceSchema = z.object({
    date: z.string().transform((str) => new Date(str)),
    subjectId: z.string().optional(),
    records: z.array(z.object({
        studentId: z.string(),
        status: z.enum(['PRESENT', 'ABSENT', 'LATE', 'EXCUSED']),
        remarks: z.string().optional()
    }))
});

export const getAttendanceByClass = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const classId = req.params.classId as string;
        const { date, subjectId } = req.query;

        const targetDate = date ? new Date(date as string) : new Date();
        targetDate.setHours(0, 0, 0, 0);

        const attendance = await (prisma as any).attendance.findMany({
            where: {
                student: { classId },
                subjectId: subjectId ? subjectId as string : null,
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
        const { date, subjectId, records } = markAttendanceSchema.parse(req.body);
        const markedById = req.user?.userId;

        if (!markedById) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        const targetDate = new Date(date);
        targetDate.setHours(0, 0, 0, 0);

        const finalResults = [];
        for (const record of records) {
            const existing = await (prisma as any).attendance.findFirst({
                where: {
                    studentId: record.studentId,
                    date: targetDate,
                    subjectId: subjectId || null
                }
            });

            if (existing) {
                const updated = await (prisma as any).attendance.update({
                    where: { id: existing.id },
                    data: {
                        status: record.status,
                        remarks: record.remarks,
                        markedById
                    }
                });
                finalResults.push(updated);
            } else {
                const created = await (prisma as any).attendance.create({
                    data: {
                        studentId: record.studentId,
                        subjectId: subjectId || null,
                        date: targetDate,
                        status: record.status,
                        remarks: record.remarks,
                        markedById
                    }
                });
                finalResults.push(created);
            }
        }

        res.json({ message: 'Attendance marked successfully', results: finalResults });
    } catch (error) {
        next(error);
    }
};

export const getStudentAttendance = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const studentId = (req.params.studentId as string) || (req.user?.role === 'STUDENT' ? await (prisma as any).student.findUnique({ where: { userId: req.user.userId } }).then((s: any) => s?.id) : null);

        if (!studentId) {
            return res.status(400).json({ message: 'Student ID required or user is not a student' });
        }

        const attendance = await (prisma as any).attendance.findMany({
            where: { studentId },
            orderBy: { date: 'desc' },
            take: 30
        });

        res.json(attendance);
    } catch (error) {
        next(error);
    }
};
