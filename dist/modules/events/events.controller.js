"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteEvent = exports.createEvent = exports.getEvents = void 0;
const db_1 = __importDefault(require("../../config/db"));
const zod_1 = require("zod");
const eventSchema = zod_1.z.object({
    title: zod_1.z.string().min(1),
    description: zod_1.z.string().optional(),
    startDate: zod_1.z.string().transform((str) => new Date(str)),
    endDate: zod_1.z.string().optional().transform((str) => str ? new Date(str) : undefined),
    location: zod_1.z.string().optional(),
});
const getEvents = async (req, res, next) => {
    try {
        const organizationId = req.user?.organizationId;
        if (!organizationId) {
            return res.status(400).json({ message: 'User does not belong to an organization' });
        }
        const events = await db_1.default.event.findMany({
            where: { organizationId },
            orderBy: { startDate: 'asc' }
        });
        res.json(events);
    }
    catch (error) {
        next(error);
    }
};
exports.getEvents = getEvents;
const createEvent = async (req, res, next) => {
    try {
        const organizationId = req.user?.organizationId;
        if (!organizationId) {
            return res.status(400).json({ message: 'User does not belong to an organization' });
        }
        const data = eventSchema.parse(req.body);
        const event = await db_1.default.event.create({
            data: {
                ...data,
                organizationId
            }
        });
        res.status(201).json(event);
    }
    catch (error) {
        next(error);
    }
};
exports.createEvent = createEvent;
const deleteEvent = async (req, res, next) => {
    try {
        const { id } = req.params;
        await db_1.default.event.delete({
            where: { id: id }
        });
        res.json({ message: 'Event deleted' });
    }
    catch (error) {
        next(error);
    }
};
exports.deleteEvent = deleteEvent;
