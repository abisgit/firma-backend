import { Request, Response, NextFunction } from 'express';
import prisma from '../../config/db';
import { z } from 'zod';
import bcrypt from 'bcrypt';
import { AuthRequest } from '../../middleware/auth.middleware';

const userSchema = z.object({
    fullName: z.string(),
    email: z.string().email(),
    password: z.string().min(6),
    role: z.enum(['SUPER_ADMIN', 'ORG_ADMIN', 'OFFICER', 'REVIEWER']),
    position: z.string().optional(),
    phoneNumber: z.string().optional(),
    organizationId: z.string().optional(),
});

export const getUsers = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const { organizationId, role } = req.user!;
        let where = {};

        if (role !== 'SUPER_ADMIN') {
            if (!organizationId) {
                return res.status(400).json({ message: 'User must belong to an organization' });
            }
            where = { organizationId };
        }

        const users = await prisma.user.findMany({
            where,
            include: { organization: true },
            orderBy: { createdAt: 'desc' }
        });
        res.json(users);
    } catch (error) {
        next(error);
    }
};

export const getUser = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const id = (Array.isArray(req.params.id) ? req.params.id[0] : req.params.id) as string;
        const user = await prisma.user.findUnique({
            where: { id },
            include: {
                organization: true,
                documents: true
            }
        });
        if (!user) return res.status(404).json({ message: 'User not found' });
        res.json(user);
    } catch (error) {
        next(error);
    }
};

export const createUser = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const data = userSchema.parse(req.body);
        const { password, ...userData } = data;

        const passwordHash = await bcrypt.hash(password, 10);

        const user = await prisma.user.create({
            data: {
                ...userData,
                passwordHash,
            },
            include: { organization: true }
        });
        res.status(201).json(user);
    } catch (error) {
        next(error);
    }
};

export const updateUser = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const id = (Array.isArray(req.params.id) ? req.params.id[0] : req.params.id) as string;
        const data = userSchema.partial().parse(req.body);

        let updateData: any = { ...data };
        if (data.password) {
            updateData.passwordHash = await bcrypt.hash(data.password, 10);
            delete updateData.password;
        }

        const user = await prisma.user.update({
            where: { id },
            data: updateData,
            include: { organization: true }
        });
        res.json(user);
    } catch (error) {
        next(error);
    }
};
