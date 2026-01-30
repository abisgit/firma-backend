import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { env } from '../../config/env';
import prisma from '../../config/db';
import { z } from 'zod';

const loginSchema = z.object({
    email: z.string().email(),
    password: z.string().min(6),
});

const registerSchema = z.object({
    fullName: z.string(),
    email: z.string().email(),
    password: z.string().min(6),
    role: z.enum(['SUPER_ADMIN', 'ORG_ADMIN', 'HR', 'OFFICER', 'REVIEWER', 'APPLICANT', 'SCHOOL_ADMIN', 'TEACHER', 'STUDENT', 'PARENT']),
    organizationId: z.string().optional(),
});

const publicRegisterSchema = z.object({
    fullName: z.string(),
    email: z.string().email(),
    password: z.string().min(6),
});

export const login = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { email, password } = loginSchema.parse(req.body);

        const user = await prisma.user.findUnique({
            where: { email },
            include: { organization: true }
        });

        if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const token = jwt.sign(
            { userId: user.id, role: user.role, organizationId: user.organizationId },
            env.JWT_SECRET,
            { expiresIn: '8h' }
        );

        res.json({
            token,
            user: {
                id: user.id,
                fullName: user.fullName,
                email: user.email,
                role: user.role,
                organizationId: user.organizationId,
                industryType: user.organization?.industryType || 'GOVERNMENT',
                organization: user.organization ? {
                    name: user.organization.name,
                    code: user.organization.code,
                    industryType: user.organization.industryType
                } : null
            },
        });
    } catch (error) {
        next(error);
    }
};

export const register = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const data = registerSchema.parse(req.body);
        const passwordHash = await bcrypt.hash(data.password, 10);

        const user = await prisma.user.create({
            data: {
                fullName: data.fullName,
                email: data.email,
                passwordHash,
                role: data.role,
                organizationId: data.organizationId,
            },
        });

        res.status(201).json({
            message: 'User created successfully',
            user: {
                id: user.id,
                email: user.email,
                role: user.role,
            },
        });
    } catch (error) {
        next(error);
    }
};
export const publicRegister = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const data = publicRegisterSchema.parse(req.body);
        const passwordHash = await bcrypt.hash(data.password, 10);

        const user = await prisma.user.create({
            data: {
                fullName: data.fullName,
                email: data.email,
                passwordHash,
                role: 'APPLICANT',
            },
        });

        res.status(201).json({
            message: 'Applicant created successfully',
            user: {
                id: user.id,
                email: user.email,
                role: user.role,
            },
        });
    } catch (error) {
        next(error);
    }
};
