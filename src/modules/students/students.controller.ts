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

export const getStudentProfile = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const userId = req.user?.userId;
        const student = await prisma.student.findUnique({
            where: { userId },
            include: {
                class: true,
                user: {
                    select: {
                        id: true,
                        fullName: true,
                        email: true,
                        phoneNumber: true
                    }
                }
            }
        });

        if (!student) {
            return res.status(404).json({ message: 'Student profile not found' });
        }

        res.json(student);
    } catch (error) {
        next(error);
    }
};

export const getStudentById = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const id = (Array.isArray(req.params.id) ? req.params.id[0] : req.params.id) as string;
        const student = await prisma.student.findUnique({
            where: { id },
            include: {
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
                attendances: {
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

        const { firstName, lastName, email, password, dateOfBirth, classId } = createStudentSchema.parse(req.body);

        // Check if user exists
        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser) {
            return res.status(400).json({ message: 'User with this email already exists' });
        }

        const org = await prisma.organization.findUnique({
            where: { id: organizationId }
        });

        if (!org) {
            return res.status(404).json({ message: 'Organization not found' });
        }

        const year = new Date().getFullYear();

        // Find all admission numbers for this org and year to find the next available index
        const studentsInOrg = await prisma.student.findMany({
            where: {
                user: {
                    organizationId
                },
                admissionNumber: {
                    contains: `${org.code}/${year}/`
                }
            },
            select: {
                admissionNumber: true
            }
        });

        let nextIndex = 1;
        if (studentsInOrg.length > 0) {
            const indices = studentsInOrg.map(s => {
                const parts = s.admissionNumber.split('/');
                return parseInt(parts[parts.length - 1], 10);
            }).filter(idx => !isNaN(idx));

            if (indices.length > 0) {
                nextIndex = Math.max(...indices) + 1;
            }
        }

        const studentIndex = nextIndex.toString().padStart(4, '0');
        const admissionNumber = `${org.code}/${year}/${studentIndex}`;

        const passwordHash = await bcrypt.hash(password, 10);
        const fullName = `${firstName} ${lastName}`;

        const result = await prisma.$transaction(async (tx) => {
            const user = await tx.user.create({
                data: {
                    fullName,
                    email,
                    passwordHash,
                    role: 'STUDENT',
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
const updateStudentSchema = z.object({
    firstName: z.string().min(2).optional(),
    lastName: z.string().min(2).optional(),
    email: z.string().email().optional(),
    dateOfBirth: z.string().transform((str) => new Date(str)).optional(),
    classId: z.string().optional(),
    isActive: z.boolean().optional(),
});

export const updateStudent = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const id = (Array.isArray(req.params.id) ? req.params.id[0] : req.params.id) as string;
        const data = updateStudentSchema.parse(req.body);

        const student = await prisma.student.findUnique({
            where: { id },
            include: { user: true }
        }) as any;

        if (!student) {
            return res.status(404).json({ message: 'Student not found' });
        }

        const result = await prisma.$transaction(async (tx) => {
            const updateData: any = {};
            if (data.firstName || data.lastName) {
                const names = student.user.fullName.split(' ');
                const firstName = data.firstName || names[0];
                const lastName = data.lastName || names.slice(1).join(' ');
                updateData.fullName = `${firstName} ${lastName}`;
            }
            if (data.email) updateData.email = data.email;
            if (data.isActive !== undefined) updateData.isActive = data.isActive;

            if (Object.keys(updateData).length > 0) {
                await tx.user.update({
                    where: { id: student.userId },
                    data: updateData
                });
            }

            const updatedStudent = await tx.student.update({
                where: { id },
                data: {
                    dateOfBirth: data.dateOfBirth,
                    classId: data.classId || undefined
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
                    class: true
                }
            });

            return updatedStudent;
        });

        res.json(result);
    } catch (error) {
        next(error);
    }
};
