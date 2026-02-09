"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateTeacher = exports.createTeacher = exports.getTeachers = void 0;
const db_1 = __importDefault(require("../../config/db"));
const zod_1 = require("zod");
const bcrypt_1 = __importDefault(require("bcrypt"));
// Schema for creating a teacher
const createTeacherSchema = zod_1.z.object({
    firstName: zod_1.z.string().min(2),
    lastName: zod_1.z.string().min(2),
    email: zod_1.z.string().email(),
    password: zod_1.z.string().min(6),
    employeeNumber: zod_1.z.string().min(1),
    phoneNumber: zod_1.z.string().optional(),
    subjectIds: zod_1.z.array(zod_1.z.string()).optional(),
    classIds: zod_1.z.array(zod_1.z.string()).optional(),
});
// Schema for updating a teacher
const updateTeacherSchema = zod_1.z.object({
    firstName: zod_1.z.string().min(2).optional(),
    lastName: zod_1.z.string().min(2).optional(),
    email: zod_1.z.string().email().optional(),
    phoneNumber: zod_1.z.string().optional(),
    subjectIds: zod_1.z.array(zod_1.z.string()).optional(),
    classIds: zod_1.z.array(zod_1.z.string()).optional(),
    isActive: zod_1.z.boolean().optional(),
});
const getTeachers = async (req, res, next) => {
    try {
        const organizationId = req.user?.organizationId;
        console.log(`[getTeachers] User: ${req.user?.userId}, Role: ${req.user?.role}, Org: ${organizationId}`);
        if (!organizationId) {
            return res.status(400).json({ message: 'User does not belong to an organization' });
        }
        const teachers = await db_1.default.teacher.findMany({
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
                subjects: {
                    include: {
                        subject: true
                    }
                },
                classes: {
                    include: {
                        class: true
                    }
                }
            }
        });
        console.log(`[getTeachers] Found ${teachers.length} teachers for org ${organizationId}`);
        res.json(teachers);
    }
    catch (error) {
        console.error('[getTeachers] Error:', error);
        next(error);
    }
};
exports.getTeachers = getTeachers;
const createTeacher = async (req, res, next) => {
    try {
        const organizationId = req.user?.organizationId;
        if (!organizationId) {
            return res.status(400).json({ message: 'User does not belong to an organization' });
        }
        const { firstName, lastName, email, password, employeeNumber, phoneNumber, subjectIds, classIds } = createTeacherSchema.parse(req.body);
        // Check if user exists
        const existingUser = await db_1.default.user.findUnique({ where: { email } });
        if (existingUser) {
            return res.status(400).json({ message: 'User with this email already exists' });
        }
        // Check if employee number exists
        const existingTeacher = await db_1.default.teacher.findUnique({ where: { employeeNumber } });
        if (existingTeacher) {
            return res.status(400).json({ message: 'Teacher with this employee number already exists' });
        }
        const passwordHash = await bcrypt_1.default.hash(password, 10);
        const fullName = `${firstName} ${lastName}`;
        const result = await db_1.default.$transaction(async (tx) => {
            const user = await tx.user.create({
                data: {
                    fullName,
                    email,
                    passwordHash,
                    role: 'TEACHER',
                    organizationId,
                    phoneNumber,
                    isActive: true
                }
            });
            const teacher = await tx.teacher.create({
                data: {
                    userId: user.id,
                    employeeNumber
                }
            });
            if (subjectIds && subjectIds.length > 0) {
                await tx.teacherSubject.createMany({
                    data: subjectIds.map((subjectId) => ({
                        teacherId: teacher.id,
                        subjectId
                    }))
                });
            }
            if (classIds && classIds.length > 0) {
                await tx.classTeacher.createMany({
                    data: classIds.map((classId) => ({
                        teacherId: teacher.id,
                        classId
                    }))
                });
            }
            return { user, teacher };
        });
        res.status(201).json(result);
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            console.error('[createTeacher] Validation Error:', error.issues);
            return res.status(400).json({ message: 'Validation failed', errors: error.issues });
        }
        next(error);
    }
};
exports.createTeacher = createTeacher;
const updateTeacher = async (req, res, next) => {
    try {
        const id = (Array.isArray(req.params.id) ? req.params.id[0] : req.params.id);
        const data = updateTeacherSchema.parse(req.body);
        const teacher = await db_1.default.teacher.findUnique({
            where: { id },
            include: { user: true }
        });
        if (!teacher) {
            return res.status(404).json({ message: 'Teacher not found' });
        }
        const result = await db_1.default.$transaction(async (tx) => {
            const updateData = {};
            if (data.firstName || data.lastName) {
                const names = teacher.user.fullName.split(' ');
                const firstName = data.firstName || names[0];
                const lastName = data.lastName || names.slice(1).join(' ');
                updateData.fullName = `${firstName} ${lastName}`;
            }
            if (data.email)
                updateData.email = data.email;
            if (data.phoneNumber)
                updateData.phoneNumber = data.phoneNumber;
            if (data.isActive !== undefined)
                updateData.isActive = data.isActive;
            if (Object.keys(updateData).length > 0) {
                await tx.user.update({
                    where: { id: teacher.userId },
                    data: updateData
                });
            }
            // Update subjects if provided
            if (data.subjectIds) {
                await tx.teacherSubject.deleteMany({ where: { teacherId: id } });
                if (data.subjectIds.length > 0) {
                    await tx.teacherSubject.createMany({
                        data: data.subjectIds.map((subjectId) => ({
                            teacherId: id,
                            subjectId
                        }))
                    });
                }
            }
            // Update classes if provided
            if (data.classIds) {
                await tx.classTeacher.deleteMany({ where: { teacherId: id } });
                if (data.classIds.length > 0) {
                    await tx.classTeacher.createMany({
                        data: data.classIds.map((classId) => ({
                            teacherId: id,
                            classId
                        }))
                    });
                }
            }
            return await tx.teacher.findUnique({
                where: { id },
                include: {
                    user: true,
                    subjects: { include: { subject: true } },
                    classes: { include: { class: true } }
                }
            });
        });
        res.json(result);
    }
    catch (error) {
        next(error);
    }
};
exports.updateTeacher = updateTeacher;
