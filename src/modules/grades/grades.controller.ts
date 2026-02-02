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

        // Validate termId or find a default one if it's the hardcoded dummy 'TERM-1'
        let finalTermId = data.termId;
        if (finalTermId === 'TERM-1' || !finalTermId) {
            const organizationId = req.user?.organizationId;
            const school = await (prisma as any).school.findUnique({ where: { organizationId } });
            if (school) {
                const term = await prisma.term.findFirst({
                    where: { academicYear: { schoolId: school.id } },
                    orderBy: { startDate: 'desc' }
                });
                if (term) finalTermId = term.id;
            } else {
                // Fallback: find any term if school not linked
                const anyTerm = await prisma.term.findFirst({ orderBy: { startDate: 'desc' } });
                if (anyTerm) finalTermId = anyTerm.id;
            }
        }

        if (finalTermId === 'TERM-1') {
            return res.status(400).json({ message: 'Invalid Term ID. No semester records found in system.' });
        }

        const grade = await prisma.grade.create({
            data: {
                ...data,
                termId: finalTermId,
                gradedById
            }
        });

        res.status(201).json(grade);
    } catch (error) {
        next(error);
    }
};

export const updateGrade = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        const { score, remarks, gradeType } = req.body;

        const grade = await prisma.grade.update({
            where: { id: id as string },
            data: {
                ...(score !== undefined && { score: Number(score) }),
                ...(remarks !== undefined && { remarks }),
                ...(gradeType !== undefined && { gradeType })
            }
        });

        res.json(grade);
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
