"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteClass = exports.updateClass = exports.getClassById = exports.createClass = exports.getClasses = void 0;
const db_1 = __importDefault(require("../../config/db"));
const zod_1 = require("zod");
const createClassSchema = zod_1.z.object({
    name: zod_1.z.string().min(1),
    grade: zod_1.z.string().min(1),
    section: zod_1.z.string().optional(),
    academicYear: zod_1.z.string().min(4),
    capacity: zod_1.z.number().int().positive().optional(),
    subjectIds: zod_1.z.array(zod_1.z.string()).optional(),
});
const updateClassSchema = zod_1.z.object({
    name: zod_1.z.string().min(1).optional(),
    grade: zod_1.z.string().min(1).optional(),
    section: zod_1.z.string().optional(),
    academicYear: zod_1.z.string().min(4).optional(),
    capacity: zod_1.z.number().int().positive().optional(),
    subjectIds: zod_1.z.array(zod_1.z.string()).optional(),
});
const getClasses = async (req, res, next) => {
    try {
        const organizationId = req.user?.organizationId;
        if (!organizationId) {
            return res.status(400).json({ message: 'User does not belong to an organization' });
        }
        let school = await db_1.default.school.findUnique({
            where: { organizationId }
        });
        if (!school) {
            const org = await db_1.default.organization.findUnique({ where: { id: organizationId } });
            if (org?.industryType === 'EDUCATION' || req.user?.role === 'SCHOOL_ADMIN' || req.user?.role === 'TEACHER') {
                school = await db_1.default.school.create({
                    data: { organizationId }
                });
            }
            else {
                return res.status(404).json({ message: 'School profile not found' });
            }
        }
        const classes = await db_1.default.class.findMany({
            where: { schoolId: school.id },
            include: {
                teachers: {
                    include: {
                        teacher: {
                            include: { user: true }
                        }
                    }
                },
                subjects: {
                    include: {
                        subject: true
                    }
                },
                _count: {
                    select: { students: true }
                }
            },
            orderBy: [{ grade: 'asc' }, { name: 'asc' }]
        });
        res.json(classes);
    }
    catch (error) {
        next(error);
    }
};
exports.getClasses = getClasses;
const createClass = async (req, res, next) => {
    try {
        const organizationId = req.user?.organizationId;
        if (!organizationId) {
            return res.status(400).json({ message: 'User does not belong to an organization' });
        }
        const { name, grade, section, academicYear, capacity, subjectIds } = createClassSchema.parse(req.body);
        let school = await db_1.default.school.findUnique({
            where: { organizationId }
        });
        if (!school) {
            const org = await db_1.default.organization.findUnique({ where: { id: organizationId } });
            if (org?.industryType === 'EDUCATION' || req.user?.role === 'SCHOOL_ADMIN' || req.user?.role === 'TEACHER') {
                school = await db_1.default.school.create({
                    data: { organizationId }
                });
            }
            else {
                return res.status(404).json({ message: 'School profile not found' });
            }
        }
        const result = await db_1.default.$transaction(async (tx) => {
            const newClass = await tx.class.create({
                data: {
                    name,
                    grade,
                    section,
                    academicYear,
                    capacity: capacity || 40,
                    schoolId: school.id
                }
            });
            if (subjectIds && subjectIds.length > 0) {
                await tx.classSubject.createMany({
                    data: subjectIds.map(subjectId => ({
                        classId: newClass.id,
                        subjectId
                    }))
                });
            }
            return newClass;
        });
        res.status(201).json(result);
    }
    catch (error) {
        next(error);
    }
};
exports.createClass = createClass;
const getClassById = async (req, res, next) => {
    try {
        const id = req.params.id;
        const organizationId = req.user?.organizationId;
        const classDetail = await db_1.default.class.findUnique({
            where: { id },
            include: {
                teachers: {
                    include: {
                        teacher: {
                            include: { user: { select: { fullName: true, email: true } } }
                        }
                    }
                },
                subjects: {
                    include: {
                        subject: true
                    }
                },
                students: {
                    include: {
                        user: {
                            select: {
                                fullName: true,
                                email: true,
                                phoneNumber: true,
                                isActive: true
                            }
                        }
                    }
                },
                _count: {
                    select: { students: true }
                }
            }
        });
        if (!classDetail)
            return res.status(404).json({ message: 'Class not found' });
        // Security check: ensure the class belongs to the user's organization school
        const school = await db_1.default.school.findUnique({ where: { organizationId } });
        if (!school || classDetail.schoolId !== school.id) {
            return res.status(403).json({ message: 'Forbidden' });
        }
        res.json(classDetail);
    }
    catch (error) {
        next(error);
    }
};
exports.getClassById = getClassById;
const updateClass = async (req, res, next) => {
    try {
        const id = (Array.isArray(req.params.id) ? req.params.id[0] : req.params.id);
        const data = updateClassSchema.parse(req.body);
        const classDetail = await db_1.default.class.findUnique({
            where: { id }
        });
        if (!classDetail)
            return res.status(404).json({ message: 'Class not found' });
        const result = await db_1.default.$transaction(async (tx) => {
            const updatedClass = await tx.class.update({
                where: { id },
                data: {
                    name: data.name,
                    grade: data.grade,
                    section: data.section,
                    academicYear: data.academicYear,
                    capacity: data.capacity
                }
            });
            if (data.subjectIds) {
                await tx.classSubject.deleteMany({
                    where: { classId: id }
                });
                if (data.subjectIds.length > 0) {
                    await tx.classSubject.createMany({
                        data: data.subjectIds.map((subjectId) => ({
                            classId: id,
                            subjectId
                        }))
                    });
                }
            }
            return updatedClass;
        });
        res.json(result);
    }
    catch (error) {
        next(error);
    }
};
exports.updateClass = updateClass;
const deleteClass = async (req, res, next) => {
    try {
        const id = (Array.isArray(req.params.id) ? req.params.id[0] : req.params.id);
        const existingClass = await db_1.default.class.findUnique({ where: { id } });
        if (!existingClass)
            return res.status(404).json({ message: 'Class not found' });
        await db_1.default.$transaction(async (tx) => {
            // 1. Unassign students
            await tx.student.updateMany({
                where: { classId: id },
                data: { classId: null }
            });
            // 2. Remove subject associations
            await tx.classSubject.deleteMany({
                where: { classId: id }
            });
            // 3. Remove teacher assignments
            await tx.classTeacher.deleteMany({
                where: { classId: id }
            });
            // 4. Remove timetable entries
            await tx.timetable.deleteMany({
                where: { classId: id }
            });
            // 5. Delete the class itself
            await tx.class.delete({
                where: { id }
            });
        });
        res.json({ message: 'Class deleted successfully' });
    }
    catch (error) {
        next(error);
    }
};
exports.deleteClass = deleteClass;
