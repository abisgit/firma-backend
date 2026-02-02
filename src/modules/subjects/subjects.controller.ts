import { Response, NextFunction } from 'express';
import prisma from '../../config/db';
import { z } from 'zod';
import { AuthRequest } from '../../middleware/auth.middleware';

const createSubjectSchema = z.object({
    name: z.string().min(1),
    code: z.string().min(1),
    grade: z.string().optional(),
});

export const getSubjects = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const organizationId = req.user?.organizationId;
        if (!organizationId) {
            return res.status(400).json({ message: 'User does not belong to an organization' });
        }

        const school = await (prisma as any).school.findUnique({
            where: { organizationId }
        });

        if (!school) {
            return res.status(404).json({ message: 'School profile not found' });
        }

        let whereClause: any = { schoolId: school.id };

        // Role-based filtering
        if (req.user?.role === 'TEACHER') {
            const teacher = await prisma.teacher.findUnique({ where: { userId: req.user.userId } });
            if (teacher) {
                whereClause.teachers = { some: { teacherId: teacher.id } };
            }
        } else if (req.user?.role === 'STUDENT') {
            const student = await prisma.student.findUnique({
                where: { userId: req.user.userId },
                include: { class: true }
            });
            if (student?.class?.grade) {
                whereClause.grade = student.class.grade;
            }
        } else if (req.user?.role === 'PARENT') {
            const parent = await prisma.parent.findUnique({
                where: { userId: req.user.userId },
                include: { children: { include: { student: { include: { class: true } } } } }
            });

            if (parent?.children) {
                const grades = [...new Set(parent.children.map((s: any) => s.student?.class?.grade).filter(Boolean))];
                if (grades.length > 0) {
                    whereClause.grade = { in: grades };
                }
            }
        }

        const subjects = await (prisma as any).subject.findMany({
            where: whereClause,
            include: {
                teachers: {
                    include: {
                        teacher: {
                            include: {
                                user: {
                                    select: { fullName: true }
                                }
                            }
                        }
                    }
                },
                _count: {
                    select: { teachers: true, classes: true }
                }
            },
            orderBy: [{ grade: 'asc' }, { name: 'asc' }]
        });

        res.json(subjects);
    } catch (error) {
        next(error);
    }
};

export const createSubject = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const organizationId = req.user?.organizationId;
        if (!organizationId) {
            return res.status(400).json({ message: 'User does not belong to an organization' });
        }

        const { name, code, grade } = createSubjectSchema.parse(req.body);

        const school = await (prisma as any).school.findUnique({
            where: { organizationId }
        });

        if (!school) {
            return res.status(404).json({ message: 'School profile not found' });
        }

        const subject = await (prisma as any).subject.create({
            data: {
                name,
                code: code.toUpperCase(),
                grade,
                schoolId: school.id
            }
        });

        res.status(201).json(subject);
    } catch (error) {
        next(error);
    }
};
