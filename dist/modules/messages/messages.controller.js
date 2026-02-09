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
        // Get unique conversation partners (people I've sent to or received from)
        const sentMessages = await db_1.default.message.findMany({
            where: { senderId: userId, recipientId: { not: null } },
            include: { recipient: { select: { id: true, fullName: true, role: true } } },
            distinct: ['recipientId']
        });
        const receivedMessages = await db_1.default.message.findMany({
            where: { recipientId: userId },
            include: { sender: { select: { id: true, fullName: true, role: true } } },
            distinct: ['senderId']
        });
        // Combine and find unique users
        const partnersMap = new Map();
        sentMessages.forEach(m => {
            if (m.recipient)
                partnersMap.set(m.recipient.id, m.recipient);
        });
        receivedMessages.forEach(m => {
            if (m.sender)
                partnersMap.set(m.sender.id, m.sender);
        });
        const chats = Array.from(partnersMap.values()).map(user => ({
            id: user.id,
            name: user.fullName,
            role: user.role,
            lastMessage: 'Open to view conversation'
        }));
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
