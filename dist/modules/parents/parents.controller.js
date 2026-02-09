"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateParent = exports.getParentById = exports.createParent = exports.getParents = void 0;
const db_1 = __importDefault(require("../../config/db"));
const zod_1 = require("zod");
const bcrypt_1 = __importDefault(require("bcrypt"));
const createParentSchema = zod_1.z.object({
    firstName: zod_1.z.string().min(2),
    lastName: zod_1.z.string().min(2),
    email: zod_1.z.string().email(),
    password: zod_1.z.string().min(6),
    phoneNumber: zod_1.z.string().optional(),
    studentIds: zod_1.z.array(zod_1.z.string()).min(1),
    relationship: zod_1.z.enum(['FATHER', 'MOTHER', 'PARENT', 'GUARDIAN', 'OTHER']).default('PARENT'),
});
const getParents = async (req, res, next) => {
    try {
        const organizationId = req.user?.organizationId;
        if (!organizationId) {
            return res.status(400).json({ message: 'User does not belong to an organization' });
        }
        const parents = await db_1.default.parent.findMany({
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
                children: {
                    include: {
                        student: {
                            include: {
                                user: {
                                    select: {
                                        fullName: true
                                    }
                                }
                            }
                        }
                    }
                }
            }
        });
        res.json(parents);
    }
    catch (error) {
        next(error);
    }
};
exports.getParents = getParents;
const createParent = async (req, res, next) => {
    try {
        const organizationId = req.user?.organizationId;
        if (!organizationId) {
            return res.status(400).json({ message: 'User does not belong to an organization' });
        }
        const { firstName, lastName, email, password, phoneNumber, studentIds, relationship } = createParentSchema.parse(req.body);
        // Check if user exists
        const existingUser = await db_1.default.user.findUnique({ where: { email } });
        if (existingUser) {
            return res.status(400).json({ message: 'User with this email already exists' });
        }
        const passwordHash = await bcrypt_1.default.hash(password, 10);
        const fullName = `${firstName} ${lastName}`;
        const result = await db_1.default.$transaction(async (tx) => {
            const user = await tx.user.create({
                data: {
                    fullName,
                    email,
                    passwordHash,
                    role: 'PARENT',
                    organizationId,
                    phoneNumber,
                    isActive: true
                }
            });
            const parent = await tx.parent.create({
                data: {
                    userId: user.id
                }
            });
            await tx.studentGuardian.createMany({
                data: studentIds.map(studentId => ({
                    studentId,
                    parentId: parent.id,
                    relationship,
                    isPrimary: true
                }))
            });
            return { user, parent };
        });
        res.status(201).json(result);
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            return res.status(400).json({ message: 'Validation failed', errors: error.issues });
        }
        next(error);
    }
};
exports.createParent = createParent;
const getParentById = async (req, res, next) => {
    try {
        const { id } = req.params;
        const organizationId = req.user?.organizationId;
        const parent = await db_1.default.parent.findUnique({
            where: { id },
            include: {
                user: true,
                children: {
                    include: {
                        student: {
                            include: {
                                user: { select: { fullName: true } }
                            }
                        }
                    }
                }
            }
        });
        if (!parent || parent.user.organizationId !== organizationId) {
            return res.status(404).json({ message: 'Parent not found' });
        }
        res.json(parent);
    }
    catch (error) {
        next(error);
    }
};
exports.getParentById = getParentById;
const updateParent = async (req, res, next) => {
    try {
        const { id } = req.params;
        const organizationId = req.user?.organizationId;
        const { fullName, phoneNumber, studentIds, relationship, isActive } = req.body;
        const parent = await db_1.default.parent.findUnique({
            where: { id },
            include: { user: true }
        });
        if (!parent || parent.user.organizationId !== organizationId) {
            return res.status(404).json({ message: 'Parent not found' });
        }
        await db_1.default.$transaction(async (tx) => {
            // Update User details
            await tx.user.update({
                where: { id: parent.userId },
                data: {
                    fullName,
                    phoneNumber,
                    isActive
                }
            });
            // Update children mapping if studentIds provided
            if (studentIds) {
                // Delete existing mappings
                await tx.studentGuardian.deleteMany({
                    where: { parentId: id }
                });
                // Add new mappings
                await tx.studentGuardian.createMany({
                    data: studentIds.map((studentId) => ({
                        studentId,
                        parentId: id,
                        relationship: relationship || 'PARENT',
                        isPrimary: true
                    }))
                });
            }
        });
        res.json({ message: 'Parent updated successfully' });
    }
    catch (error) {
        next(error);
    }
};
exports.updateParent = updateParent;
