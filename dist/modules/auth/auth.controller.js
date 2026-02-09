"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.publicRegister = exports.register = exports.login = void 0;
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const env_1 = require("../../config/env");
const db_1 = __importDefault(require("../../config/db"));
const zod_1 = require("zod");
const loginSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
    password: zod_1.z.string().min(6),
});
const registerSchema = zod_1.z.object({
    fullName: zod_1.z.string(),
    email: zod_1.z.string().email(),
    password: zod_1.z.string().min(6),
    role: zod_1.z.enum(['SUPER_ADMIN', 'ORG_ADMIN', 'HR', 'OFFICER', 'REVIEWER', 'APPLICANT', 'SCHOOL_ADMIN', 'TEACHER', 'STUDENT', 'PARENT']),
    organizationId: zod_1.z.string().optional(),
});
const publicRegisterSchema = zod_1.z.object({
    fullName: zod_1.z.string(),
    email: zod_1.z.string().email(),
    password: zod_1.z.string().min(6),
});
const login = async (req, res, next) => {
    try {
        const { email, password } = loginSchema.parse(req.body);
        const user = await db_1.default.user.findUnique({
            where: { email },
            include: {
                organization: true,
                student: true,
                teacher: true,
                parent: true
            }
        });
        if (!user || !(await bcrypt_1.default.compare(password, user.passwordHash))) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }
        const token = jsonwebtoken_1.default.sign({ userId: user.id, role: user.role, organizationId: user.organizationId }, env_1.env.JWT_SECRET, { expiresIn: '8h' });
        res.json({
            token,
            user: {
                id: user.id,
                fullName: user.fullName,
                email: user.email,
                role: user.role,
                organizationId: user.organizationId,
                industryType: user.organization?.industryType || 'GOVERNMENT',
                organization: user.organization ? {
                    name: user.organization.name,
                    code: user.organization.code,
                    industryType: user.organization.industryType
                } : null,
                student: user.student,
                teacher: user.teacher,
                parent: user.parent
            },
        });
    }
    catch (error) {
        next(error);
    }
};
exports.login = login;
const register = async (req, res, next) => {
    try {
        const data = registerSchema.parse(req.body);
        const passwordHash = await bcrypt_1.default.hash(data.password, 10);
        const user = await db_1.default.user.create({
            data: {
                fullName: data.fullName,
                email: data.email,
                passwordHash,
                role: data.role,
                organizationId: data.organizationId,
            },
        });
        res.status(201).json({
            message: 'User created successfully',
            user: {
                id: user.id,
                email: user.email,
                role: user.role,
            },
        });
    }
    catch (error) {
        next(error);
    }
};
exports.register = register;
const publicRegister = async (req, res, next) => {
    try {
        const data = publicRegisterSchema.parse(req.body);
        const passwordHash = await bcrypt_1.default.hash(data.password, 10);
        const user = await db_1.default.user.create({
            data: {
                fullName: data.fullName,
                email: data.email,
                passwordHash,
                role: 'APPLICANT',
            },
        });
        res.status(201).json({
            message: 'Applicant created successfully',
            user: {
                id: user.id,
                email: user.email,
                role: user.role,
            },
        });
    }
    catch (error) {
        next(error);
    }
};
exports.publicRegister = publicRegister;
