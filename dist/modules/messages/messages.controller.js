"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getChatHistory = exports.getMyMessages = exports.getMessagesByLetter = exports.sendMessage = void 0;
const db_1 = __importDefault(require("../../config/db"));
const zod_1 = require("zod");
const messageSchema = zod_1.z.object({
    content: zod_1.z.string(),
    recipientId: zod_1.z.string().optional(),
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
                recipientId: data.recipientId,
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
        const { userId } = req.user;
        // Get all messages involving the user to find partners and their last messages
        const messages = await db_1.default.message.findMany({
            where: {
                OR: [
                    { senderId: userId, recipientId: { not: null } },
                    { recipientId: userId }
                ]
            },
            include: {
                sender: { select: { id: true, fullName: true, role: true } },
                recipient: { select: { id: true, fullName: true, role: true } }
            },
            orderBy: { createdAt: 'desc' }
        });
        const partnersMap = new Map();
        messages.forEach(msg => {
            const partner = msg.senderId === userId ? msg.recipient : msg.sender;
            if (partner && !partnersMap.has(partner.id)) {
                partnersMap.set(partner.id, {
                    id: partner.id,
                    name: partner.fullName,
                    role: partner.role,
                    lastMessage: msg.content,
                    lastMessageAt: msg.createdAt
                });
            }
        });
        const chats = Array.from(partnersMap.values());
        res.json(chats);
    }
    catch (error) {
        next(error);
    }
};
exports.getMyMessages = getMyMessages;
const getChatHistory = async (req, res, next) => {
    try {
        const { userId } = req.user;
        const { partnerId } = req.params;
        const messages = await db_1.default.message.findMany({
            where: {
                OR: [
                    { senderId: userId, recipientId: partnerId },
                    { senderId: partnerId, recipientId: userId }
                ]
            },
            orderBy: { createdAt: 'asc' }
        });
        res.json(messages);
    }
    catch (error) {
        console.error('[getChatHistory] Error:', error);
        next(error);
    }
};
exports.getChatHistory = getChatHistory;
