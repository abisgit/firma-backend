"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createPaymentRequest = exports.getFeeCollections = exports.createFeeCollection = exports.approvePayment = exports.submitPayment = exports.getPaymentRequests = void 0;
const db_1 = __importDefault(require("../../config/db"));
const zod_1 = require("zod");
const getPaymentRequests = async (req, res, next) => {
    try {
        const userId = req.user.userId;
        const role = req.user.role;
        const { feeCollectionId, status } = req.query;
        let studentIds = [];
        if (role === 'STUDENT') {
            const student = await db_1.default.student.findUnique({
                where: { userId }
            });
            if (student)
                studentIds.push(student.id);
        }
        else if (role === 'PARENT') {
            const parent = await db_1.default.parent.findUnique({
                where: { userId },
                include: { children: true }
            });
            if (parent) {
                studentIds = parent.children.map(c => c.studentId);
            }
        }
        else if (role === 'SCHOOL_ADMIN' || role === 'ORG_ADMIN') {
            // Admin can see all payments for their org
            const where = { organizationId: req.user.organizationId };
            if (feeCollectionId)
                where.feeCollectionId = feeCollectionId;
            if (status)
                where.status = status;
            const payments = await db_1.default.educationPayment.findMany({
                where,
                include: {
                    student: { include: { user: true, class: true } },
                    bank: true,
                    feeCollection: true
                },
                orderBy: { createdAt: 'desc' }
            });
            return res.json(payments);
        }
        const where = { studentId: { in: studentIds } };
        if (feeCollectionId)
            where.feeCollectionId = feeCollectionId;
        if (status)
            where.status = status;
        const payments = await db_1.default.educationPayment.findMany({
            where,
            include: {
                student: { include: { user: true, class: true } },
                bank: true,
                feeCollection: true
            },
            orderBy: { createdAt: 'desc' }
        });
        res.json(payments);
    }
    catch (error) {
        next(error);
    }
};
exports.getPaymentRequests = getPaymentRequests;
const submissionSchema = zod_1.z.object({
    bankId: zod_1.z.string(),
    transactionNumber: zod_1.z.string(),
});
const submitPayment = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { bankId, transactionNumber } = submissionSchema.parse(req.body);
        const payment = await db_1.default.educationPayment.update({
            where: { id },
            data: {
                bankId,
                transactionNumber,
                status: 'PENDING',
                paymentDate: new Date()
            }
        });
        res.json(payment);
    }
    catch (error) {
        next(error);
    }
};
exports.submitPayment = submitPayment;
const approvePayment = async (req, res, next) => {
    try {
        const { id } = req.params;
        console.log(`[EducationPayment] Approving payment ID: ${id}`);
        const payment = await db_1.default.educationPayment.update({
            where: { id },
            data: {
                status: 'PAID',
                updatedAt: new Date()
            }
        });
        console.log(`[EducationPayment] Successfully approved payment: ${payment.id}`);
        res.json(payment);
    }
    catch (error) {
        console.error('[EducationPayment] Approve error:', error);
        next(error);
    }
};
exports.approvePayment = approvePayment;
const feeCollectionSchema = zod_1.z.object({
    name: zod_1.z.string(),
    amount: zod_1.z.number(),
    dueDate: zod_1.z.string(),
    targetType: zod_1.z.enum(['ALL', 'GRADE']),
    targetGrade: zod_1.z.string().optional().nullable(),
});
const createFeeCollection = async (req, res, next) => {
    try {
        const data = feeCollectionSchema.parse(req.body);
        const organizationId = req.user.organizationId;
        // Create the collection
        const collection = await db_1.default.feeCollection.create({
            data: {
                ...data,
                dueDate: new Date(data.dueDate),
                organizationId
            }
        });
        // Generate payments for targeted students
        let students = [];
        if (data.targetType === 'ALL') {
            students = await db_1.default.student.findMany({
                where: { user: { organizationId } }
            });
        }
        else if (data.targetType === 'GRADE' && data.targetGrade) {
            students = await db_1.default.student.findMany({
                where: {
                    user: { organizationId },
                    class: { grade: data.targetGrade }
                }
            });
        }
        const paymentsData = students.map(student => ({
            studentId: student.id,
            feeCollectionId: collection.id,
            type: 'OTHER', // Default to other or based on collection name?
            amount: data.amount,
            description: data.name,
            organizationId,
            status: 'UNPAID'
        }));
        if (paymentsData.length > 0) {
            await db_1.default.educationPayment.createMany({
                data: paymentsData
            });
        }
        res.status(201).json(collection);
    }
    catch (error) {
        next(error);
    }
};
exports.createFeeCollection = createFeeCollection;
const getFeeCollections = async (req, res, next) => {
    try {
        const collections = await db_1.default.feeCollection.findMany({
            where: { organizationId: req.user.organizationId },
            orderBy: { createdAt: 'desc' }
        });
        res.json(collections);
    }
    catch (error) {
        next(error);
    }
};
exports.getFeeCollections = getFeeCollections;
const createPaymentRequest = async (req, res, next) => {
    try {
        const { studentId, type, amount, description } = req.body;
        const payment = await db_1.default.educationPayment.create({
            data: {
                studentId,
                type,
                amount,
                description,
                organizationId: req.user.organizationId,
                status: 'UNPAID'
            }
        });
        res.status(201).json(payment);
    }
    catch (error) {
        next(error);
    }
};
exports.createPaymentRequest = createPaymentRequest;
