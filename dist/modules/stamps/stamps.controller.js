"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteStamp = exports.getMyStamps = exports.uploadStamp = exports.upload = void 0;
const db_1 = __importDefault(require("../../config/db"));
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
// Configure multer for local storage
const storage = multer_1.default.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = path_1.default.join(process.cwd(), 'public', 'uploads');
        if (!fs_1.default.existsSync(uploadDir)) {
            fs_1.default.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'stamp-' + uniqueSuffix + path_1.default.extname(file.originalname));
    }
});
exports.upload = (0, multer_1.default)({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        }
        else {
            cb(new Error('Only images are allowed'));
        }
    }
});
const uploadStamp = async (req, res, next) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }
        const { userId } = req.user;
        const fileUrl = `/uploads/${req.file.filename}`; // Relative URL serves from public
        const stamp = await db_1.default.stamp.create({
            data: {
                userId,
                imageUrl: fileUrl,
            }
        });
        res.status(201).json(stamp);
    }
    catch (error) {
        next(error);
    }
};
exports.uploadStamp = uploadStamp;
const getMyStamps = async (req, res, next) => {
    try {
        const { userId } = req.user;
        const stamps = await db_1.default.stamp.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' }
        });
        res.json(stamps);
    }
    catch (error) {
        next(error);
    }
};
exports.getMyStamps = getMyStamps;
const deleteStamp = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { userId } = req.user;
        const stamp = await db_1.default.stamp.findUnique({
            where: { id: parseInt(id) }
        });
        if (!stamp) {
            return res.status(404).json({ message: 'Stamp not found' });
        }
        if (stamp.userId !== userId) {
            return res.status(403).json({ message: 'Not authorized to delete this stamp' });
        }
        await db_1.default.stamp.delete({
            where: { id: parseInt(id) }
        });
        // Optional: Delete file from disk
        const filePath = path_1.default.join(process.cwd(), 'public', stamp.imageUrl);
        if (fs_1.default.existsSync(filePath)) {
            fs_1.default.unlinkSync(filePath);
        }
        res.json({ message: 'Stamp deleted successfully' });
    }
    catch (error) {
        next(error);
    }
};
exports.deleteStamp = deleteStamp;
