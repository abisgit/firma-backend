"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getStudentGrades = exports.updateGrade = exports.addGrade = exports.getGradesByClass = void 0;
const db_1 = __importDefault(require("../../config/db"));
const zod_1 = require("zod");
const addGradeSchema = zod_1.z.object({
    studentId: zod_1.z.string(),
    subjectId: zod_1.z.string(),
    termId: zod_1.z.string(),
    score: zod_1.z.number().min(0),
    maxScore: zod_1.z.number().min(0).default(100),
    gradeType: zod_1.z.enum(['EXAM', 'QUIZ', 'ASSIGNMENT', 'PROJECT']),
    remarks: zod_1.z.string().optional()
});
const getGradesByClass = async (req, res, next) => {
    try {
        const classId = req.params.classId;
        const { termId } = req.query;
        const grades = await db_1.default.grade.findMany({
            where: {
                student: { classId },
                ...(termId ? { termId: termId } : {})
            },
            include: {
                student: {
                    include: { user: { select: { fullName: true } } }
                },
                subject: true,
                term: true
            }
        });
        res.json(grades);
    }
    catch (error) {
        next(error);
    }
};
exports.getGradesByClass = getGradesByClass;
const addGrade = async (req, res, next) => {
    try {
        const data = addGradeSchema.parse(req.body);
        const gradedById = req.user?.userId;
        if (!gradedById) {
            return res.status(401).json({ message: 'Unauthorized' });
        }
        // Validate termId or find a default one if it's the hardcoded dummy 'TERM-1'
        let finalTermId = data.termId;
        if (finalTermId === 'TERM-1' || !finalTermId) {
            const organizationId = req.user?.organizationId;
            const school = await db_1.default.school.findUnique({ where: { organizationId } });
            if (school) {
                const term = await db_1.default.term.findFirst({
                    where: { academicYear: { schoolId: school.id } },
                    orderBy: { startDate: 'desc' }
                });
                if (term)
                    finalTermId = term.id;
            }
            else {
                // Fallback: find any term if school not linked
                const anyTerm = await db_1.default.term.findFirst({ orderBy: { startDate: 'desc' } });
                if (anyTerm)
                    finalTermId = anyTerm.id;
            }
        }
        if (finalTermId === 'TERM-1') {
            return res.status(400).json({ message: 'Invalid Term ID. No semester records found in system.' });
        }
        const grade = await db_1.default.grade.create({
            data: {
                ...data,
                termId: finalTermId,
                gradedById
            }
        });
        res.status(201).json(grade);
    }
    catch (error) {
        next(error);
    }
};
exports.addGrade = addGrade;
const updateGrade = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { score, remarks, gradeType } = req.body;
        const grade = await db_1.default.grade.update({
            where: { id: id },
            data: {
                ...(score !== undefined && { score: Number(score) }),
                ...(remarks !== undefined && { remarks }),
                ...(gradeType !== undefined && { gradeType })
            }
        });
        res.json(grade);
    }
    catch (error) {
        next(error);
    }
};
exports.updateGrade = updateGrade;
const getStudentGrades = async (req, res, next) => {
    try {
        const studentId = req.params.studentId || (req.user?.role === 'STUDENT' ? await db_1.default.student.findUnique({ where: { userId: req.user.userId } }).then((s) => s?.id) : null);
        if (!studentId) {
            return res.status(400).json({ message: 'Student ID required' });
        }
        const grades = await db_1.default.grade.findMany({
            where: { studentId },
            include: {
                subject: true,
                term: true
            },
            orderBy: { createdAt: 'desc' }
        });
        res.json(grades);
    }
    catch (error) {
        next(error);
    }
};
exports.getStudentGrades = getStudentGrades;
