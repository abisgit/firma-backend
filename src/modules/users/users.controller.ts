import { Request, Response, NextFunction } from 'express';
import prisma from '../../config/db';
import { z } from 'zod';
import bcrypt from 'bcrypt';
import { AuthRequest } from '../../middleware/auth.middleware';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Configure multer for signature storage
const signatureStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'signatures');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'sig-' + uniqueSuffix + path.extname(file.originalname));
    }
});

// Configure multer for profile image storage
const profileImageStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'profiles');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'profile-' + uniqueSuffix + path.extname(file.originalname));
    }
});

export const upload = multer({
    storage: signatureStorage,
    limits: { fileSize: 2 * 1024 * 1024 }, // 2MB limit
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only images are allowed for signatures'));
        }
    }
});

export const uploadProfileImg = multer({
    storage: profileImageStorage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only images are allowed for profile'));
        }
    }
});

const userSchema = z.object({
    fullName: z.string(),
    email: z.string().email(),
    password: z.string().min(6),
    role: z.enum(['SUPER_ADMIN', 'ORG_ADMIN', 'OFFICER', 'REVIEWER', 'HR']),
    position: z.string().optional(),
    phoneNumber: z.string().optional(),
    organizationId: z.string().optional(),
});

const profileUpdateSchema = z.object({
    fullName: z.string().optional(),
    phoneNumber: z.string().optional(),
    position: z.string().optional(),
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

// Update own profile (for any authenticated user)
export const updateProfile = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const userId = req.user!.userId;
        const data = profileUpdateSchema.parse(req.body);

        const user = await prisma.user.update({
            where: { id: userId },
            data,
            include: { organization: true }
        });
        res.json(user);
    } catch (error) {
        next(error);
    }
};

export const uploadSignature = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }

        const id = req.params.id as string;
        const requestingUser = req.user!;

        // Permission check: User can update own, or Admin can update within Org
        if (requestingUser.userId !== id && requestingUser.role !== 'SUPER_ADMIN' && requestingUser.role !== 'ORG_ADMIN') {
            return res.status(403).json({ message: 'Not authorized to update this user signature' });
        }

        const fileUrl = `/uploads/signatures/${req.file.filename}`;

        const user = await prisma.user.update({
            where: { id },
            data: { signatureUrl: fileUrl }
        });

        res.json({ message: 'Signature uploaded successfully', signatureUrl: fileUrl, user });
    } catch (error) {
        next(error);
    }
};

export const uploadProfileImage = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }

        const id = req.params.id as string;
        const requestingUser = req.user!;

        // Permission check: User can update own, or Admin can update within Org
        if (requestingUser.userId !== id && requestingUser.role !== 'SUPER_ADMIN' && requestingUser.role !== 'ORG_ADMIN') {
            return res.status(403).json({ message: 'Not authorized to update this user profile image' });
        }

        const fileUrl = `/uploads/profiles/${req.file.filename}`;

        const user = await prisma.user.update({
            where: { id },
            data: { profileImageUrl: fileUrl }
        });

        res.json({ message: 'Profile image uploaded successfully', profileImageUrl: fileUrl, user });
    } catch (error) {
        next(error);
    }
};
