import { Response, NextFunction } from 'express';
import prisma from '../../config/db';
import { z } from 'zod';
import { AuthRequest } from '../../middleware/auth.middleware';

const createClassSchema = z.object({
    name: z.string().min(1),
    grade: z.string().min(1),
    section: z.string().optional(),
    academicYear: z.string().min(4),
    capacity: z.number().int().positive().optional(),
    subjectIds: z.array(z.string()).optional(),
});

export const getClasses = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const organizationId = req.user?.organizationId;
        if (!organizationId) {
            return res.status(400).json({ message: 'User does not belong to an organization' });
        }

        let school = await (prisma as any).school.findUnique({
            where: { organizationId }
        });

        if (!school) {
            const org: any = await prisma.organization.findUnique({ where: { id: organizationId } });
            if (org?.industryType === 'EDUCATION') {
                school = await (prisma as any).school.create({
                    data: { organizationId }
                });
            } else {
                return res.status(404).json({ message: 'School profile not found' });
            }
        }

        const classes = await (prisma as any).class.findMany({
            where: { schoolId: school.id },
            include: {
                teachers: {
                    include: {
                        teacher: {
                            include: { user: true }
                        }
                    }
                },
                subjects: {
                    include: {
                        subject: true
                    }
                },
                _count: {
                    select: { students: true }
                }
            },
            orderBy: [{ grade: 'asc' }, { name: 'asc' }]
        });

        res.json(classes);
    } catch (error) {
        next(error);
    }
};

export const createClass = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const organizationId = req.user?.organizationId;
        if (!organizationId) {
            return res.status(400).json({ message: 'User does not belong to an organization' });
        }

        const { name, grade, section, academicYear, capacity, subjectIds } = createClassSchema.parse(req.body);

        let school = await (prisma as any).school.findUnique({
            where: { organizationId }
        });

        if (!school) {
            const org: any = await prisma.organization.findUnique({ where: { id: organizationId } });
            if (org?.industryType === 'EDUCATION') {
                school = await (prisma as any).school.create({
                    data: { organizationId }
                });
            } else {
                return res.status(404).json({ message: 'School profile not found' });
            }
        }

        const result = await prisma.$transaction(async (tx) => {
            const newClass = await (tx as any).class.create({
                data: {
                    name,
                    grade,
                    section,
                    academicYear,
                    capacity: capacity || 40,
                    schoolId: school.id
                }
            });

            if (subjectIds && subjectIds.length > 0) {
                await (tx as any).classSubject.createMany({
                    data: subjectIds.map(subjectId => ({
                        classId: newClass.id,
                        subjectId
                    }))
                });
            }

            return newClass;
        });

        res.status(201).json(result);
    } catch (error) {
        next(error);
    }
};
