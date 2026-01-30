"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getStudentById = exports.getStudents = void 0;
const db_1 = __importDefault(require("../../config/db"));
const zod_1 = require("zod");
// Schema for creating a student
const createStudentSchema = zod_1.z.object({
    firstName: zod_1.z.string().min(2),
    lastName: zod_1.z.string().min(2),
    email: zod_1.z.string().email(),
    password: zod_1.z.string().min(6),
    admissionNumber: zod_1.z.string(),
    dateOfBirth: zod_1.z.string().transform((str) => new Date(str)),
    gender: zod_1.z.string(),
    classId: zod_1.z.string().optional(),
});
const getStudents = async (req, res, next) => {
    try {
        const organizationId = req.user?.organizationId;
        if (!organizationId) {
            return res.status(400).json({ message: 'User does not belong to an organization' });
        }
        const students = await db_1.default.student.findMany({
            where: {
                user: {
                    organizationId
                }
            },
            include: {
                user: {
                    select: {
                        id: true,
                        fullName: true,
                        email: true,
                        phoneNumber: true,
                        isActive: true
                    }
                },
                class: true,
                guardians: {
                    include: {
                        parent: {
                            include: {
                                user: {
                                    select: {
                                        fullName: true,
                                        phoneNumber: true
                                    }
                                }
                            }
                        }
                    }
                }
            }
        });
        res.json(students);
    }
    catch (error) {
        next(error);
    }
};
exports.getStudents = getStudents;
const getStudentById = async (req, res, next) => {
    try {
        const { id } = req.params;
        const student = await db_1.default.student.findUnique({
            where: { id },
            include: {
                user: true,
                class: true,
                guardians: {
                    include: {
                        parent: {
                            include: {
                                user: true
                            }
                        }
                    }
                },
                attendance: {
                    take: 5,
                    orderBy: { date: 'desc' }
                },
                grades: {
                    include: {
                        subject: true
                    }
                }
            }
        });
        if (!student) {
            return res.status(404).json({ message: 'Student not found' });
        }
        res.json(student);
    }
    catch (error) {
        next(error);
    }
};
exports.getStudentById = getStudentById;
