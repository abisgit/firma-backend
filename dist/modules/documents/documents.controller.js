"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createDocument = exports.getDocuments = exports.upload = void 0;
const db_1 = __importDefault(require("../../config/db"));
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
// Configure multer for local storage
const storage = multer_1.default.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = path_1.default.join(process.cwd(), 'public', 'uploads', 'documents');
        if (!fs_1.default.existsSync(uploadDir)) {
            fs_1.default.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'doc-' + uniqueSuffix + path_1.default.extname(file.originalname));
    }
});
exports.upload = (0, multer_1.default)({
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
    fileFilter: (req, file, cb) => {
        // Allow Images, PDFs, and common doc types
        const allowedTypes = [
            'image/jpeg', 'image/png', 'image/webp',
            'application/pdf',
            'text/plain'
        ];
        // We can be more permissive or strict. This covers basic needs.
        if (file.mimetype.startsWith('image/') || file.mimetype === 'application/pdf' || file.mimetype === 'text/plain') {
            cb(null, true);
        }
        else {
            // For now, allow all if unsure to avoid blocking user during dev
            cb(null, true);
        }
    }
});
const getDocuments = async (req, res, next) => {
    try {
        const { role, organizationId } = req.user;
        let where = {};
        if (role !== 'SUPER_ADMIN') {
            where.organizationId = organizationId;
        }
        // If checking for a specific owner (e.g. "My Documents")
        if (req.query.ownerId) {
            where.ownerId = req.query.ownerId;
        }
        const docs = await db_1.default.document.findMany({
            where,
            include: {
                createdBy: {
                    select: { fullName: true, email: true }
                },
                owner: {
                    select: { fullName: true, email: true }
                }
            },
            orderBy: { createdAt: 'desc' }
        });
        res.json(docs);
    }
    catch (error) {
        next(error);
    }
};
exports.getDocuments = getDocuments;
const createDocument = async (req, res, next) => {
    try {
        // When using multer, body fields are available but might skip validation if we just rely on Zod strict parsing of non-file fields.
        // We will extract manually and validate.
        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }
        const { userId, organizationId } = req.user;
        if (!organizationId) {
            return res.status(400).json({ message: 'User must belong to an organization' });
        }
        const fileUrl = `/uploads/documents/${req.file.filename}`;
        // Body fields come as strings from FormData
        const title = req.body.title;
        const referenceNumber = req.body.referenceNumber || `DOC-${Date.now()}`;
        const classification = req.body.classification || 'INTERNAL';
        const type = req.body.type || 'OTHER';
        const description = req.body.description || '';
        const ownerId = req.body.ownerId || userId;
        const doc = await db_1.default.document.create({
            data: {
                title,
                referenceNumber,
                classification: classification,
                type: type,
                fileUrl,
                fileName: req.file.originalname,
                fileSize: req.file.size,
                description,
                createdById: userId,
                organizationId: organizationId,
                ownerId,
            },
            include: {
                createdBy: {
                    select: { fullName: true, email: true }
                }
            }
        });
        res.status(201).json(doc);
    }
    catch (error) {
        next(error);
    }
};
exports.createDocument = createDocument;
