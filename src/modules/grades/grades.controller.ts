import { Response, NextFunction } from 'express';
import prisma from '../../config/db';
import { z } from 'zod';
import { AuthRequest } from '../../middleware/auth.middleware';

const addGradeSchema = z.object({
    studentId: z.string(),
    subjectId: z.string(),
    termId: z.string(),
    score: z.number().min(0),
    maxScore: z.number().min(0).default(100),
    gradeType: z.enum(['EXAM', 'QUIZ', 'ASSIGNMENT', 'PROJECT']),
    remarks: z.string().optional()
});

export const getGradesByClass = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const classId = req.params.classId as string;
        const { termId } = req.query;

        const grades = await prisma.grade.findMany({
            where: {
                student: { classId },
                ...(termId ? { termId: termId as string } : {})
            },
            include: {
                student: {
                    include: { user: { select: { fullName: true } } }
                },
                subject: true,
                term: true
            }
        });

        res.json(grades);
    } catch (error) {
        next(error);
    }
};

export const addGrade = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const data = addGradeSchema.parse(req.body);
        const gradedById = req.user?.userId;

        if (!gradedById) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        const grade = await prisma.grade.create({
            data: {
                ...data,
                gradedById
            }
        });

        res.status(201).json(grade);
    } catch (error) {
        next(error);
    }
};

export const getStudentGrades = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const studentId = req.params.studentId || (req.user?.role === 'STUDENT' ? await prisma.student.findUnique({ where: { userId: req.user.userId } }).then((s: any) => s?.id) : null);

        if (!studentId) {
            return res.status(400).json({ message: 'Student ID required' });
        }

        const grades = await prisma.grade.findMany({
            where: { studentId },
            include: {
                subject: true,
                term: true
            },
            orderBy: { createdAt: 'desc' }
        });

        res.json(grades);
    } catch (error) {
        next(error);
    }
};
