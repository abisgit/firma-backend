"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMyMessages = exports.getMessagesByLetter = exports.sendMessage = void 0;
const db_1 = __importDefault(require("../../config/db"));
const zod_1 = require("zod");
const messageSchema = zod_1.z.object({
    content: zod_1.z.string(),
    letterId: zod_1.z.string().optional(),
    recipientOrgId: zod_1.z.string().optional(),
});
const sendMessage = async (req, res, next) => {
    try {
        const data = messageSchema.parse(req.body);
        const { userId } = req.user;
        const message = await db_1.default.message.create({
            data: {
                content: data.content,
                letterId: data.letterId,
                senderId: userId,
                recipientOrgId: data.recipientOrgId,
            }
        });
        res.status(201).json(message);
    }
    catch (error) {
        next(error);
    }
};
exports.sendMessage = sendMessage;
const getMessagesByLetter = async (req, res, next) => {
    try {
        const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
        const letterId = id;
        const messages = await db_1.default.message.findMany({
            where: { letterId },
            include: {
                sender: {
                    select: { fullName: true, role: true }
                }
            },
            orderBy: { createdAt: 'asc' }
        });
        res.json(messages);
    }
    catch (error) {
        next(error);
    }
};
exports.getMessagesByLetter = getMessagesByLetter;
const getMyMessages = async (req, res, next) => {
    try {
        const { userId, organizationId, role } = req.user;
        let where = {};
        if (role === 'APPLICANT') {
            where = { senderId: userId };
        }
        else if (organizationId) {
            where = { recipientOrgId: organizationId };
        }
        const messages = await db_1.default.message.findMany({
            where,
            include: {
                letter: {
                    select: { referenceNumber: true, subject: true }
                },
                sender: {
                    select: { fullName: true }
                }
            },
            orderBy: { createdAt: 'desc' }
        });
        res.json(messages);
    }
    catch (error) {
        next(error);
    }
};
exports.getMyMessages = getMyMessages;
