"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateStampPosition = exports.getLetterById = exports.getLetterByRef = exports.createLetter = void 0;
const db_1 = __importDefault(require("../../config/db"));
const zod_1 = require("zod");
const letterSchema = zod_1.z.object({
    subject: zod_1.z.string(),
    content: zod_1.z.string(),
    letterType: zod_1.z.enum(['HIERARCHICAL', 'CROSS_STRUCTURE', 'STAFF', 'C_STAFF', 'HEAD_OFFICE', 'GUEST']),
    classification: zod_1.z.enum(['PUBLIC', 'INTERNAL', 'CONFIDENTIAL']),
    recipientOrgId: zod_1.z.string().optional(),
    recipientUserId: zod_1.z.string().optional(),
    templateId: zod_1.z.string().optional(),
    stampId: zod_1.z.number().optional(),
    stampX: zod_1.z.number().optional(),
    stampY: zod_1.z.number().optional(),
});
const generateReferenceNumber = async (orgCode) => {
    const year = new Date().getFullYear();
    const count = await db_1.default.letter.count({
        where: {
            senderOrg: { code: orgCode },
            letterDate: {
                gte: new Date(`${year}-01-01`),
                lt: new Date(`${year + 1}-01-01`),
            }
        }
    });
    const seq = (count + 1).toString().padStart(3, '0');
    return `${orgCode}/${year}/${seq}`;
};
const createLetter = async (req, res, next) => {
    try {
        const data = letterSchema.parse(req.body);
        const { userId, organizationId } = req.user;
        if (!organizationId) {
            return res.status(400).json({ message: 'User must belong to an organization' });
        }
        const senderOrg = await db_1.default.organization.findUnique({
            where: { id: organizationId }
        });
        if (!senderOrg)
            return res.status(400).json({ message: 'Organization not found' });
        const referenceNumber = await generateReferenceNumber(senderOrg.code);
        const letter = await db_1.default.letter.create({
            data: {
                ...data,
                referenceNumber,
                senderOrgId: organizationId,
                createdById: userId,
            },
        });
        res.status(201).json(letter);
    }
    catch (error) {
        next(error);
    }
};
exports.createLetter = createLetter;
const getLetterByRef = async (req, res, next) => {
    try {
        const { org, year, seq } = req.params;
        const referenceNumber = `${org}/${year}/${seq}`;
        const letter = await db_1.default.letter.findUnique({
            where: { referenceNumber },
            include: {
                senderOrg: true,
                recipientOrg: true,
                recipientUser: true,
                createdBy: true,
                template: true,
                stamp: true, // Include stamp
                attachments: true,
                ccRecipients: { include: { organization: true } }
            }
        });
        if (!letter) {
            return res.status(404).json({ message: 'Letter not found' });
        }
        res.json(letter);
    }
    catch (error) {
        next(error);
    }
};
exports.getLetterByRef = getLetterByRef;
const getLetterById = async (req, res, next) => {
    try {
        const { id } = req.params;
        const letter = await db_1.default.letter.findUnique({
            where: { id },
            include: {
                senderOrg: true,
                recipientOrg: true,
                recipientUser: true,
                createdBy: true,
                template: true,
                stamp: true,
                attachments: true,
                ccRecipients: { include: { organization: true } }
            }
        });
        if (!letter)
            return res.status(404).json({ message: 'Letter not found' });
        res.json(letter);
    }
    catch (error) {
        next(error);
    }
};
exports.getLetterById = getLetterById;
const updateStampPosition = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { stampId, stampX, stampY } = req.body;
        const letter = await db_1.default.letter.update({
            where: { id },
            data: {
                stampId,
                stampX,
                stampY
            },
            include: { stamp: true }
        });
        res.json(letter);
    }
    catch (error) {
        next(error);
    }
};
exports.updateStampPosition = updateStampPosition;
