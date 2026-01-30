"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadProfileImage = exports.uploadSignature = exports.updateProfile = exports.updateUser = exports.createUser = exports.getUser = exports.getUsers = exports.uploadProfileImg = exports.upload = void 0;
const db_1 = __importDefault(require("../../config/db"));
const zod_1 = require("zod");
const bcrypt_1 = __importDefault(require("bcrypt"));
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
// Configure multer for signature storage
const signatureStorage = multer_1.default.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = path_1.default.join(process.cwd(), 'public', 'uploads', 'signatures');
        if (!fs_1.default.existsSync(uploadDir)) {
            fs_1.default.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'sig-' + uniqueSuffix + path_1.default.extname(file.originalname));
    }
});
// Configure multer for profile image storage
const profileImageStorage = multer_1.default.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = path_1.default.join(process.cwd(), 'public', 'uploads', 'profiles');
        if (!fs_1.default.existsSync(uploadDir)) {
            fs_1.default.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'profile-' + uniqueSuffix + path_1.default.extname(file.originalname));
    }
});
exports.upload = (0, multer_1.default)({
    storage: signatureStorage,
    limits: { fileSize: 2 * 1024 * 1024 }, // 2MB limit
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        }
        else {
            cb(new Error('Only images are allowed for signatures'));
        }
    }
});
exports.uploadProfileImg = (0, multer_1.default)({
    storage: profileImageStorage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        }
        else {
            cb(new Error('Only images are allowed for profile'));
        }
    }
});
const userSchema = zod_1.z.object({
    fullName: zod_1.z.string(),
    email: zod_1.z.string().email(),
    password: zod_1.z.string().min(6),
    role: zod_1.z.enum(['SUPER_ADMIN', 'ORG_ADMIN', 'OFFICER', 'REVIEWER', 'HR']),
    position: zod_1.z.string().optional(),
    phoneNumber: zod_1.z.string().optional(),
    organizationId: zod_1.z.string().optional(),
});
const profileUpdateSchema = zod_1.z.object({
    fullName: zod_1.z.string().optional(),
    phoneNumber: zod_1.z.string().optional(),
    position: zod_1.z.string().optional(),
});
const getUsers = async (req, res, next) => {
    try {
        const { organizationId, role } = req.user;
        let where = {};
        if (role !== 'SUPER_ADMIN') {
            if (!organizationId) {
                return res.status(400).json({ message: 'User must belong to an organization' });
            }
            where = { organizationId };
        }
        const users = await db_1.default.user.findMany({
            where,
            include: { organization: true },
            orderBy: { createdAt: 'desc' }
        });
        res.json(users);
    }
    catch (error) {
        next(error);
    }
};
exports.getUsers = getUsers;
const getUser = async (req, res, next) => {
    try {
        const id = (Array.isArray(req.params.id) ? req.params.id[0] : req.params.id);
        const user = await db_1.default.user.findUnique({
            where: { id },
            include: {
                organization: true,
                documents: true
            }
        });
        if (!user)
            return res.status(404).json({ message: 'User not found' });
        res.json(user);
    }
    catch (error) {
        next(error);
    }
};
exports.getUser = getUser;
const createUser = async (req, res, next) => {
    try {
        const data = userSchema.parse(req.body);
        const { password, ...userData } = data;
        const passwordHash = await bcrypt_1.default.hash(password, 10);
        const user = await db_1.default.user.create({
            data: {
                ...userData,
                passwordHash,
            },
            include: { organization: true }
        });
        res.status(201).json(user);
    }
    catch (error) {
        next(error);
    }
};
exports.createUser = createUser;
const updateUser = async (req, res, next) => {
    try {
        const id = (Array.isArray(req.params.id) ? req.params.id[0] : req.params.id);
        const data = userSchema.partial().parse(req.body);
        let updateData = { ...data };
        if (data.password) {
            updateData.passwordHash = await bcrypt_1.default.hash(data.password, 10);
            delete updateData.password;
        }
        const user = await db_1.default.user.update({
            where: { id },
            data: updateData,
            include: { organization: true }
        });
        res.json(user);
    }
    catch (error) {
        next(error);
    }
};
exports.updateUser = updateUser;
// Update own profile (for any authenticated user)
const updateProfile = async (req, res, next) => {
    try {
        const userId = req.user.userId;
        const data = profileUpdateSchema.parse(req.body);
        const user = await db_1.default.user.update({
            where: { id: userId },
            data,
            include: { organization: true }
        });
        res.json(user);
    }
    catch (error) {
        next(error);
    }
};
exports.updateProfile = updateProfile;
const uploadSignature = async (req, res, next) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }
        const id = req.params.id;
        const requestingUser = req.user;
        // Permission check: User can update own, or Admin can update within Org
        if (requestingUser.userId !== id && requestingUser.role !== 'SUPER_ADMIN' && requestingUser.role !== 'ORG_ADMIN') {
            return res.status(403).json({ message: 'Not authorized to update this user signature' });
        }
        const fileUrl = `/uploads/signatures/${req.file.filename}`;
        const user = await db_1.default.user.update({
            where: { id },
            data: { signatureUrl: fileUrl }
        });
        res.json({ message: 'Signature uploaded successfully', signatureUrl: fileUrl, user });
    }
    catch (error) {
        next(error);
    }
};
exports.uploadSignature = uploadSignature;
const uploadProfileImage = async (req, res, next) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }
        const id = req.params.id;
        const requestingUser = req.user;
        // Permission check: User can update own, or Admin can update within Org
        if (requestingUser.userId !== id && requestingUser.role !== 'SUPER_ADMIN' && requestingUser.role !== 'ORG_ADMIN') {
            return res.status(403).json({ message: 'Not authorized to update this user profile image' });
        }
        const fileUrl = `/uploads/profiles/${req.file.filename}`;
        const user = await db_1.default.user.update({
            where: { id },
            data: { profileImageUrl: fileUrl }
        });
        res.json({ message: 'Profile image uploaded successfully', profileImageUrl: fileUrl, user });
    }
    catch (error) {
        next(error);
    }
};
exports.uploadProfileImage = uploadProfileImage;
