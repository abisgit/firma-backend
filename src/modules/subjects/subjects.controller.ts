import { Response, NextFunction } from 'express';
import prisma from '../../config/db';
import { z } from 'zod';
import { AuthRequest } from '../../middleware/auth.middleware';

const createSubjectSchema = z.object({
    name: z.string().min(1),
    code: z.string().min(1),
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

        const subjects = await (prisma as any).subject.findMany({
            where: { schoolId: school.id },
            include: {
                _count: {
                    select: { teachers: true, classes: true }
                }
            },
            orderBy: { name: 'asc' }
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

        const { name, code } = createSubjectSchema.parse(req.body);

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
                schoolId: school.id
            }
        });

        res.status(201).json(subject);
    } catch (error) {
        next(error);
    }
};
