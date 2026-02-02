import { Response, NextFunction } from 'express';
import prisma from '../../config/db';
import { z } from 'zod';
import bcrypt from 'bcrypt';
import { AuthRequest } from '../../middleware/auth.middleware';

const createParentSchema = z.object({
    firstName: z.string().min(2),
    lastName: z.string().min(2),
    email: z.string().email(),
    password: z.string().min(6),
    phoneNumber: z.string().optional(),
    studentIds: z.array(z.string()).min(1),
    relationship: z.enum(['FATHER', 'MOTHER', 'PARENT', 'GUARDIAN', 'OTHER']).default('PARENT'),
});

export const getParents = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const organizationId = req.user?.organizationId;
        if (!organizationId) {
            return res.status(400).json({ message: 'User does not belong to an organization' });
        }

        const parents = await (prisma as any).parent.findMany({
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
                children: {
                    include: {
                        student: {
                            include: {
                                user: {
                                    select: {
                                        fullName: true
                                    }
                                }
                            }
                        }
                    }
                }
            }
        });

        res.json(parents);
    } catch (error) {
        next(error);
    }
};

export const createParent = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const organizationId = req.user?.organizationId;
        if (!organizationId) {
            return res.status(400).json({ message: 'User does not belong to an organization' });
        }

        const { firstName, lastName, email, password, phoneNumber, studentIds, relationship } = createParentSchema.parse(req.body);

        // Check if user exists
        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser) {
            return res.status(400).json({ message: 'User with this email already exists' });
        }

        const passwordHash = await bcrypt.hash(password, 10);
        const fullName = `${firstName} ${lastName}`;

        const result = await prisma.$transaction(async (tx) => {
            const user = await tx.user.create({
                data: {
                    fullName,
                    email,
                    passwordHash,
                    role: 'PARENT' as any,
                    organizationId,
                    phoneNumber,
                    isActive: true
                }
            });

            const parent = await (tx as any).parent.create({
                data: {
                    userId: user.id
                }
            });

            await (tx as any).studentGuardian.createMany({
                data: studentIds.map(studentId => ({
                    studentId,
                    parentId: parent.id,
                    relationship,
                    isPrimary: true
                }))
            });

            return { user, parent };
        });

        res.status(201).json(result);
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ message: 'Validation failed', errors: error.issues });
        }
        next(error);
    }
};
export const getParentById = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        const organizationId = req.user?.organizationId;

        const parent = await (prisma as any).parent.findUnique({
            where: { id },
            include: {
                user: true,
                children: {
                    include: {
                        student: {
                            include: {
                                user: { select: { fullName: true } }
                            }
                        }
                    }
                }
            }
        });

        if (!parent || parent.user.organizationId !== organizationId) {
            return res.status(404).json({ message: 'Parent not found' });
        }

        res.json(parent);
    } catch (error) {
        next(error);
    }
};

export const updateParent = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        const organizationId = req.user?.organizationId;
        const { fullName, phoneNumber, studentIds, relationship, isActive } = req.body;

        const parent = await (prisma as any).parent.findUnique({
            where: { id },
            include: { user: true }
        });

        if (!parent || parent.user.organizationId !== organizationId) {
            return res.status(404).json({ message: 'Parent not found' });
        }

        await prisma.$transaction(async (tx) => {
            // Update User details
            await tx.user.update({
                where: { id: parent.userId },
                data: {
                    fullName,
                    phoneNumber,
                    isActive
                }
            });

            // Update children mapping if studentIds provided
            if (studentIds) {
                // Delete existing mappings
                await (tx as any).studentGuardian.deleteMany({
                    where: { parentId: id }
                });

                // Add new mappings
                await (tx as any).studentGuardian.createMany({
                    data: studentIds.map((studentId: string) => ({
                        studentId,
                        parentId: id,
                        relationship: relationship || 'PARENT',
                        isPrimary: true
                    }))
                });
            }
        });

        res.json({ message: 'Parent updated successfully' });
    } catch (error) {
        next(error);
    }
};
