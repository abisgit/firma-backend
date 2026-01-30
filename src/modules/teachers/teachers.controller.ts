import { Response, NextFunction } from 'express';
import prisma from '../../config/db';
import { z } from 'zod';
import bcrypt from 'bcrypt';
import { AuthRequest } from '../../middleware/auth.middleware';
import { Role } from '../../config/permissions';

// Schema for creating a teacher
const createTeacherSchema = z.object({
    firstName: z.string().min(2),
    lastName: z.string().min(2),
    email: z.string().email(),
    password: z.string().min(6),
    employeeNumber: z.string().min(1),
    phoneNumber: z.string().optional(),
    subjectIds: z.array(z.string()).optional(),
});

export const getTeachers = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const organizationId = req.user?.organizationId;
        if (!organizationId) {
            return res.status(400).json({ message: 'User does not belong to an organization' });
        }

        const teachers = await (prisma as any).teacher.findMany({
            where: {
                user: {
                    organizationId
                }
            },
            include: {
                user: {
                    select: {
                        id: true,
                        fullName: true,
                        email: true,
                        phoneNumber: true,
                        isActive: true
                    }
                },
                subjects: {
                    include: {
                        subject: true
                    }
                },
                classes: {
                    include: {
                        class: true
                    }
                }
            }
        });

        res.json(teachers);
    } catch (error) {
        next(error);
    }
};

export const createTeacher = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const organizationId = req.user?.organizationId;
        if (!organizationId) {
            return res.status(400).json({ message: 'User does not belong to an organization' });
        }

        const { firstName, lastName, email, password, employeeNumber, phoneNumber, subjectIds } = createTeacherSchema.parse(req.body);

        // Check if user exists
        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser) {
            return res.status(400).json({ message: 'User with this email already exists' });
        }

        // Check if employee number exists
        const existingTeacher = await (prisma as any).teacher.findUnique({ where: { employeeNumber } });
        if (existingTeacher) {
            return res.status(400).json({ message: 'Teacher with this employee number already exists' });
        }

        const passwordHash = await bcrypt.hash(password, 10);
        const fullName = `${firstName} ${lastName}`;

        const result = await prisma.$transaction(async (tx) => {
            const user = await tx.user.create({
                data: {
                    fullName,
                    email,
                    passwordHash,
                    role: 'TEACHER' as any,
                    organizationId,
                    phoneNumber,
                    isActive: true
                }
            });

            const teacher = await (tx as any).teacher.create({
                data: {
                    userId: user.id,
                    employeeNumber
                }
            });

            if (subjectIds && subjectIds.length > 0) {
                await (tx as any).teacherSubject.createMany({
                    data: subjectIds.map(subjectId => ({
                        teacherId: teacher.id,
                        subjectId
                    }))
                });
            }

            return { user, teacher };
        });

        res.status(201).json(result);
    } catch (error) {
        next(error);
    }
};
