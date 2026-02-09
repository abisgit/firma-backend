"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createSubject = exports.getSubjects = void 0;
const db_1 = __importDefault(require("../../config/db"));
const zod_1 = require("zod");
const createSubjectSchema = zod_1.z.object({
    name: zod_1.z.string().min(1),
    code: zod_1.z.string().min(1),
    grade: zod_1.z.string().optional(),
});
const getSubjects = async (req, res, next) => {
    try {
        const organizationId = req.user?.organizationId;
        if (!organizationId) {
            return res.status(400).json({ message: 'User does not belong to an organization' });
        }
        const school = await db_1.default.school.findUnique({
            where: { organizationId }
        });
        if (!school) {
            return res.status(404).json({ message: 'School profile not found' });
        }
        let whereClause = { schoolId: school.id };
        // Role-based filtering
        if (req.user?.role === 'TEACHER') {
            const teacher = await db_1.default.teacher.findUnique({ where: { userId: req.user.userId } });
            if (teacher) {
                whereClause.teachers = { some: { teacherId: teacher.id } };
            }
        }
        else if (req.user?.role === 'STUDENT') {
            const student = await db_1.default.student.findUnique({
                where: { userId: req.user.userId },
                include: { class: true }
            });
            if (student?.class?.grade) {
                whereClause.grade = student.class.grade;
            }
        }
        else if (req.user?.role === 'PARENT') {
            const parent = await db_1.default.parent.findUnique({
                where: { userId: req.user.userId },
                include: { children: { include: { student: { include: { class: true } } } } }
            });
            if (parent?.children) {
                const grades = [...new Set(parent.children.map((s) => s.student?.class?.grade).filter(Boolean))];
                if (grades.length > 0) {
                    whereClause.grade = { in: grades };
                }
            }
        }
        const subjects = await db_1.default.subject.findMany({
            where: whereClause,
            include: {
                teachers: {
                    include: {
                        teacher: {
                            include: {
                                user: {
                                    select: { fullName: true }
                                }
                            }
                        }
                    }
                },
                _count: {
                    select: { teachers: true, classes: true }
                }
            },
            orderBy: [{ grade: 'asc' }, { name: 'asc' }]
        });
        res.json(subjects);
    }
    catch (error) {
        next(error);
    }
};
exports.getSubjects = getSubjects;
const createSubject = async (req, res, next) => {
    try {
        const organizationId = req.user?.organizationId;
        if (!organizationId) {
            return res.status(400).json({ message: 'User does not belong to an organization' });
        }
        const { name, code, grade } = createSubjectSchema.parse(req.body);
        const school = await db_1.default.school.findUnique({
            where: { organizationId }
        });
        if (!school) {
            return res.status(404).json({ message: 'School profile not found' });
        }
        const subject = await db_1.default.subject.create({
            data: {
                name,
                code: code.toUpperCase(),
                grade,
                schoolId: school.id
            }
        });
        res.status(201).json(subject);
    }
    catch (error) {
        next(error);
    }
};
exports.createSubject = createSubject;
