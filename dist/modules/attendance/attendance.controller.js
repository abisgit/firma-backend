"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getStudentAttendance = exports.markAttendance = exports.getAttendanceByClass = void 0;
const db_1 = __importDefault(require("../../config/db"));
const zod_1 = require("zod");
const markAttendanceSchema = zod_1.z.object({
    date: zod_1.z.string().transform((str) => new Date(str)),
    subjectId: zod_1.z.string().optional(),
    records: zod_1.z.array(zod_1.z.object({
        studentId: zod_1.z.string(),
        status: zod_1.z.enum(['PRESENT', 'ABSENT', 'LATE', 'EXCUSED']),
        remarks: zod_1.z.string().optional()
    }))
});
const getAttendanceByClass = async (req, res, next) => {
    try {
        const classId = req.params.classId;
        const { date, subjectId } = req.query;
        const targetDate = date ? new Date(date) : new Date();
        targetDate.setHours(0, 0, 0, 0);
        const attendance = await db_1.default.attendance.findMany({
            where: {
                student: { classId },
                subjectId: subjectId ? subjectId : null,
                date: {
                    gte: targetDate,
                    lt: new Date(targetDate.getTime() + 24 * 60 * 60 * 1000)
                }
            },
            include: {
                student: {
                    include: {
                        user: {
                            select: { fullName: true }
                        }
                    }
                }
            }
        });
        res.json(attendance);
    }
    catch (error) {
        next(error);
    }
};
exports.getAttendanceByClass = getAttendanceByClass;
const markAttendance = async (req, res, next) => {
    try {
        const { date, subjectId, records } = markAttendanceSchema.parse(req.body);
        const markedById = req.user?.userId;
        if (!markedById) {
            return res.status(401).json({ message: 'Unauthorized' });
        }
        const targetDate = new Date(date);
        targetDate.setHours(0, 0, 0, 0);
        const finalResults = [];
        for (const record of records) {
            const existing = await db_1.default.attendance.findFirst({
                where: {
                    studentId: record.studentId,
                    date: targetDate,
                    subjectId: subjectId || null
                }
            });
            if (existing) {
                const updated = await db_1.default.attendance.update({
                    where: { id: existing.id },
                    data: {
                        status: record.status,
                        remarks: record.remarks,
                        markedById
                    }
                });
                finalResults.push(updated);
            }
            else {
                const created = await db_1.default.attendance.create({
                    data: {
                        studentId: record.studentId,
                        subjectId: subjectId || null,
                        date: targetDate,
                        status: record.status,
                        remarks: record.remarks,
                        markedById
                    }
                });
                finalResults.push(created);
            }
        }
        res.json({ message: 'Attendance marked successfully', results: finalResults });
    }
    catch (error) {
        next(error);
    }
};
exports.markAttendance = markAttendance;
const getStudentAttendance = async (req, res, next) => {
    try {
        const studentId = req.params.studentId || (req.user?.role === 'STUDENT' ? await db_1.default.student.findUnique({ where: { userId: req.user.userId } }).then((s) => s?.id) : null);
        if (!studentId) {
            return res.status(400).json({ message: 'Student ID required or user is not a student' });
        }
        const attendance = await db_1.default.attendance.findMany({
            where: { studentId },
            orderBy: { date: 'desc' },
            take: 30
        });
        res.json(attendance);
    }
    catch (error) {
        next(error);
    }
};
exports.getStudentAttendance = getStudentAttendance;
