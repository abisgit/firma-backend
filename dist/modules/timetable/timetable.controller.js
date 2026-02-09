"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.addTimetableEntry = exports.getTimetableByClass = void 0;
const db_1 = __importDefault(require("../../config/db"));
const zod_1 = require("zod");
const addTimetableSchema = zod_1.z.object({
    classId: zod_1.z.string(),
    subjectId: zod_1.z.string(),
    teacherId: zod_1.z.string(),
    dayOfWeek: zod_1.z.number().min(1).max(7), // 1=Monday... 7=Sunday
    startTime: zod_1.z.string(), // "HH:mm"
    endTime: zod_1.z.string(),
    room: zod_1.z.string().optional()
});
const getTimetableByClass = async (req, res, next) => {
    try {
        const classId = req.params.classId;
        const timetable = await db_1.default.timetable.findMany({
            where: { classId },
            include: {
                subject: true,
                class: true,
                teacher: {
                    include: { user: { select: { fullName: true } } }
                }
            }
        });
        res.json(timetable);
    }
    catch (error) {
        next(error);
    }
};
exports.getTimetableByClass = getTimetableByClass;
const addTimetableEntry = async (req, res, next) => {
    try {
        const data = addTimetableSchema.parse(req.body);
        const entry = await db_1.default.timetable.create({
            data
        });
        res.status(201).json(entry);
    }
    catch (error) {
        next(error);
    }
};
exports.addTimetableEntry = addTimetableEntry;
