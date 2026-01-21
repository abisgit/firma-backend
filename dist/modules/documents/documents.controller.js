"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createDocument = exports.getDocuments = void 0;
const db_1 = __importDefault(require("../../config/db"));
const zod_1 = require("zod");
const docSchema = zod_1.z.object({
    title: zod_1.z.string(),
    referenceNumber: zod_1.z.string(),
    classification: zod_1.z.enum(['PUBLIC', 'INTERNAL', 'CONFIDENTIAL']),
    fileUrl: zod_1.z.string().optional(),
});
const getDocuments = async (req, res, next) => {
    try {
        const { role, organizationId } = req.user;
        let where = {};
        if (role !== 'SUPER_ADMIN') {
            where = { organizationId };
        }
        const docs = await db_1.default.document.findMany({
            where,
            include: {
                createdBy: {
                    select: { fullName: true, email: true }
                }
            }
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
        const data = docSchema.parse(req.body);
        const { userId, organizationId } = req.user;
        if (!organizationId) {
            return res.status(400).json({ message: 'User must belong to an organization' });
        }
        const doc = await db_1.default.document.create({
            data: {
                ...data,
                createdById: userId,
                organizationId: organizationId,
            },
        });
        res.status(201).json(doc);
    }
    catch (error) {
        next(error);
    }
};
exports.createDocument = createDocument;
