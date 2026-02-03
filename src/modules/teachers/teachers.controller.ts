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
    classIds: z.array(z.string()).optional(),
});

// Schema for updating a teacher
const updateTeacherSchema = z.object({
    firstName: z.string().min(2).optional(),
    lastName: z.string().min(2).optional(),
    email: z.string().email().optional(),
    phoneNumber: z.string().optional(),
    subjectIds: z.array(z.string()).optional(),
    classIds: z.array(z.string()).optional(),
    isActive: z.boolean().optional(),
});

export const getTeachers = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const organizationId = req.user?.organizationId;
        console.log(`[getTeachers] User: ${req.user?.userId}, Role: ${req.user?.role}, Org: ${organizationId}`);
        if (!organizationId) {
            return res.status(400).json({ message: 'User does not belong to an organization' });
        }

        const teachers = await prisma.teacher.findMany({
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

        console.log(`[getTeachers] Found ${teachers.length} teachers for org ${organizationId}`);
        res.json(teachers);
    } catch (error) {
        console.error('[getTeachers] Error:', error);
        next(error);
    }
};

export const createTeacher = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const organizationId = req.user?.organizationId;
        if (!organizationId) {
            return res.status(400).json({ message: 'User does not belong to an organization' });
        }

        const { firstName, lastName, email, password, employeeNumber, phoneNumber, subjectIds, classIds } = createTeacherSchema.parse(req.body);

        // Check if user exists
        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser) {
            return res.status(400).json({ message: 'User with this email already exists' });
        }

        // Check if employee number exists
        const existingTeacher = await prisma.teacher.findUnique({ where: { employeeNumber } });
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
                    role: 'TEACHER',
                    organizationId,
                    phoneNumber,
                    isActive: true
                }
            });

            const teacher = await tx.teacher.create({
                data: {
                    userId: user.id,
                    employeeNumber
                }
            });

            if (subjectIds && subjectIds.length > 0) {
                await tx.teacherSubject.createMany({
                    data: subjectIds.map((subjectId: string) => ({
                        teacherId: teacher.id,
                        subjectId
                    }))
                });
            }

            if (classIds && classIds.length > 0) {
                await tx.classTeacher.createMany({
                    data: classIds.map((classId: string) => ({
                        teacherId: teacher.id,
                        classId
                    }))
                });
            }

            return { user, teacher };
        });

        res.status(201).json(result);
    } catch (error) {
        if (error instanceof z.ZodError) {
            console.error('[createTeacher] Validation Error:', error.issues);
            return res.status(400).json({ message: 'Validation failed', errors: error.issues });
        }
        next(error);
    }
};

export const updateTeacher = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const id = (Array.isArray(req.params.id) ? req.params.id[0] : req.params.id) as string;
        const data = updateTeacherSchema.parse(req.body);

        const teacher = await prisma.teacher.findUnique({
            where: { id },
            include: { user: true }
        }) as any;

        if (!teacher) {
            return res.status(404).json({ message: 'Teacher not found' });
        }

        const result = await prisma.$transaction(async (tx) => {
            const updateData: any = {};
            if (data.firstName || data.lastName) {
                const names = teacher.user.fullName.split(' ');
                const firstName = data.firstName || names[0];
                const lastName = data.lastName || names.slice(1).join(' ');
                updateData.fullName = `${firstName} ${lastName}`;
            }
            if (data.email) updateData.email = data.email;
            if (data.phoneNumber) updateData.phoneNumber = data.phoneNumber;
            if (data.isActive !== undefined) updateData.isActive = data.isActive;

            if (Object.keys(updateData).length > 0) {
                await tx.user.update({
                    where: { id: teacher.userId },
                    data: updateData
                });
            }

            // Update subjects if provided
            if (data.subjectIds) {
                await tx.teacherSubject.deleteMany({ where: { teacherId: id } });
                if (data.subjectIds.length > 0) {
                    await tx.teacherSubject.createMany({
                        data: data.subjectIds.map((subjectId: string) => ({
                            teacherId: id,
                            subjectId
                        }))
                    });
                }
            }

            // Update classes if provided
            if (data.classIds) {
                await tx.classTeacher.deleteMany({ where: { teacherId: id } });
                if (data.classIds.length > 0) {
                    await tx.classTeacher.createMany({
                        data: data.classIds.map((classId: string) => ({
                            teacherId: id,
                            classId
                        }))
                    });
                }
            }

            return await tx.teacher.findUnique({
                where: { id },
                include: {
                    user: true,
                    subjects: { include: { subject: true } },
                    classes: { include: { class: true } }
                }
            });
        });

        res.json(result);
    } catch (error) {
        next(error);
    }
};
