
import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../middleware/auth.middleware';
import prisma from '../../config/db';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Configure multer for local storage
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = path.join(process.cwd(), 'public', 'uploads');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'stamp-' + uniqueSuffix + path.extname(file.originalname));
    }
});

export const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only images are allowed'));
        }
    }
});

export const uploadStamp = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }

        const { userId } = req.user!;
        const fileUrl = `/uploads/${req.file.filename}`; // Relative URL serves from public

        const stamp = await prisma.stamp.create({
            data: {
                userId,
                imageUrl: fileUrl,
            }
        });

        res.status(201).json(stamp);
    } catch (error) {
        next(error);
    }
};

export const getMyStamps = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const { userId } = req.user!;
        const stamps = await prisma.stamp.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' }
        });
        res.json(stamps);
    } catch (error) {
        next(error);
    }
};

export const deleteStamp = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        const { userId } = req.user!;

        const stamp = await prisma.stamp.findUnique({
            where: { id: parseInt(id) }
        });

        if (!stamp) {
            return res.status(404).json({ message: 'Stamp not found' });
        }

        if (stamp.userId !== userId) {
            return res.status(403).json({ message: 'Not authorized to delete this stamp' });
        }

        await prisma.stamp.delete({
            where: { id: parseInt(id) }
        });

        // Optional: Delete file from disk
        const filePath = path.join(process.cwd(), 'public', stamp.imageUrl);
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }

        res.json({ message: 'Stamp deleted successfully' });
    } catch (error) {
        next(error);
    }
};
