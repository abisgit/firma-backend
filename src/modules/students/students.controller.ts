import { Response, NextFunction } from 'express';
import prisma from '../../config/db';
import { z } from 'zod';
import bcrypt from 'bcrypt';
import { AuthRequest } from '../../middleware/auth.middleware';
import { Role } from '../../config/permissions';

// Schema for creating a student
const createStudentSchema = z.object({
    firstName: z.string().min(2),
    lastName: z.string().min(2),
    email: z.string().email(),
    password: z.string().min(6),
    admissionNumber: z.string(),
    dateOfBirth: z.string().transform((str) => new Date(str)),
    gender: z.string().optional(),
    classId: z.string().optional(),
});

export const getStudents = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const organizationId = req.user?.organizationId;
        if (!organizationId) {
            return res.status(400).json({ message: 'User does not belong to an organization' });
        }

        const students = await prisma.student.findMany({
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
                class: true,
                guardians: {
                    include: {
                        parent: {
                            include: {
                                user: {
                                    select: {
                                        fullName: true,
                                        phoneNumber: true
                                    }
                                }
                            }
                        }
                    }
                }
            }
        });

        res.json(students);
    } catch (error) {
        next(error);
    }
};

export const getStudentById = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        const student = await prisma.student.findUnique({
            where: { id },
            include: {
                user: true,
                class: true,
                guardians: {
                    include: {
                        parent: {
                            include: {
                                user: true
                            }
                        }
                    }
                },
                attendance: {
                    take: 5,
                    orderBy: { date: 'desc' }
                },
                grades: {
                    include: {
                        subject: true
                    }
                }
            }
        });

        if (!student) {
            return res.status(404).json({ message: 'Student not found' });
        }

        res.json(student);
    } catch (error) {
        next(error);
    }
};

export const createStudent = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const organizationId = req.user?.organizationId;
        if (!organizationId) {
            return res.status(400).json({ message: 'User does not belong to an organization' });
        }

        const { firstName, lastName, email, password, admissionNumber, dateOfBirth, classId } = createStudentSchema.parse(req.body);

        // Check if user exists
        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser) {
            return res.status(400).json({ message: 'User with this email already exists' });
        }

        // Check if admission number exists
        const existingStudent = await prisma.student.findUnique({ where: { admissionNumber } });
        if (existingStudent) {
            return res.status(400).json({ message: 'Student with this admission number already exists' });
        }

        const passwordHash = await bcrypt.hash(password, 10);
        const fullName = `${firstName} ${lastName}`;

        const result = await prisma.$transaction(async (tx) => {
            const user = await tx.user.create({
                data: {
                    fullName,
                    email,
                    passwordHash,
                    role: 'STUDENT' as any,
                    organizationId,
                    isActive: true
                }
            });

            const student = await tx.student.create({
                data: {
                    userId: user.id,
                    admissionNumber,
                    dateOfBirth,
                    classId: classId || undefined
                }
            });

            return { user, student };
        });

        res.status(201).json(result);
    } catch (error) {
        next(error);
    }
};
