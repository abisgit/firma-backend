import { Response, NextFunction } from 'express';
import prisma from '../../config/db';
import { z } from 'zod';
import { AuthRequest } from '../../middleware/auth.middleware';

const createClassSchema = z.object({
    name: z.string().min(1),
    grade: z.string().min(1),
    section: z.string().optional(),
    academicYear: z.string().min(4), // e.g. "2025" or "2025-2026"
    capacity: z.number().int().positive().optional()
});

export const getClasses = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const organizationId = req.user?.organizationId;
        if (!organizationId) {
            return res.status(400).json({ message: 'User does not belong to an organization' });
        }

        const school = await prisma.school.findUnique({
            where: { organizationId }
        });

        if (!school) {
            return res.status(404).json({ message: 'School profile not found for this organization' });
        }

        const classes = await prisma.class.findMany({
            where: { schoolId: school.id },
            include: {
                teachers: {
                    include: {
                        teacher: {
                            include: { user: true }
                        }
                    }
                },
                _count: {
                    select: { students: true }
                }
            },
            orderBy: { name: 'asc' }
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

        const { name, grade, section, academicYear, capacity } = createClassSchema.parse(req.body);

        const school = await prisma.school.findUnique({
            where: { organizationId }
        });

        if (!school) {
            return res.status(404).json({ message: 'School profile not found for this organization' });
        }

        const newClass = await prisma.class.create({
            data: {
                name,
                grade,
                section,
                academicYear,
                capacity: capacity || 40,
                schoolId: school.id
            }
        });

        res.status(201).json(newClass);
    } catch (error) {
        next(error);
    }
};
