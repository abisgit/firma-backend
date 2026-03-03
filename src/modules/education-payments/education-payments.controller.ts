import { Request, Response, NextFunction } from 'express';
import prisma from '../../config/db';
import { z } from 'zod';

export const getPaymentRequests = async (req: any, res: Response, next: NextFunction) => {
    try {
        const userId = req.user.userId;
        const role = req.user.role;
        const { feeCollectionId, status } = req.query;

        let studentIds: string[] = [];

        if (role === 'STUDENT') {
            const student = await prisma.student.findUnique({
                where: { userId }
            });
            if (student) studentIds.push(student.id);
        } else if (role === 'PARENT') {
            const parent = await prisma.parent.findUnique({
                where: { userId },
                include: { children: true }
            });
            if (parent) {
                studentIds = parent.children.map(c => c.studentId);
            }
        } else if (role === 'SCHOOL_ADMIN' || role === 'ORG_ADMIN') {
            // Admin can see all payments for their org
            const where: any = { organizationId: req.user.organizationId };
            if (feeCollectionId) where.feeCollectionId = feeCollectionId;
            if (status) where.status = status;

            const payments = await prisma.educationPayment.findMany({
                where,
                include: {
                    student: { include: { user: true } },
                    bank: true,
                    feeCollection: true
                },
                orderBy: { createdAt: 'desc' }
            });
            return res.json(payments);
        }

        const where: any = { studentId: { in: studentIds } };
        if (feeCollectionId) where.feeCollectionId = feeCollectionId;
        if (status) where.status = status;

        const payments = await prisma.educationPayment.findMany({
            where,
            include: {
                student: { include: { user: true } },
                bank: true,
                feeCollection: true
            },
            orderBy: { createdAt: 'desc' }
        });

        res.json(payments);
    } catch (error) {
        next(error);
    }
};

const submissionSchema = z.object({
    bankId: z.string(),
    transactionNumber: z.string(),
});

export const submitPayment = async (req: any, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        const { bankId, transactionNumber } = submissionSchema.parse(req.body);

        const payment = await prisma.educationPayment.update({
            where: { id },
            data: {
                bankId,
                transactionNumber,
                status: 'PENDING',
                paymentDate: new Date()
            }
        });

        res.json(payment);
    } catch (error) {
        next(error);
    }
};

export const approvePayment = async (req: any, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        console.log(`[EducationPayment] Approving payment ID: ${id}`);

        const payment = await prisma.educationPayment.update({
            where: { id },
            data: {
                status: 'PAID',
                updatedAt: new Date()
            }
        });

        console.log(`[EducationPayment] Successfully approved payment: ${payment.id}`);
        res.json(payment);
    } catch (error) {
        console.error('[EducationPayment] Approve error:', error);
        next(error);
    }
};

const feeCollectionSchema = z.object({
    name: z.string(),
    amount: z.number(),
    dueDate: z.string(),
    targetType: z.enum(['ALL', 'GRADE']),
    targetGrade: z.string().optional().nullable(),
});

export const createFeeCollection = async (req: any, res: Response, next: NextFunction) => {
    try {
        const data = feeCollectionSchema.parse(req.body);
        const organizationId = req.user.organizationId;

        // Create the collection
        const collection = await prisma.feeCollection.create({
            data: {
                ...data,
                dueDate: new Date(data.dueDate),
                organizationId
            }
        });

        // Generate payments for targeted students
        let students: any[] = [];
        if (data.targetType === 'ALL') {
            students = await prisma.student.findMany({
                where: { user: { organizationId } }
            });
        } else if (data.targetType === 'GRADE' && data.targetGrade) {
            students = await prisma.student.findMany({
                where: {
                    user: { organizationId },
                    class: { grade: data.targetGrade }
                }
            });
        }

        const paymentsData = students.map(student => ({
            studentId: student.id,
            feeCollectionId: collection.id,
            type: 'OTHER' as any, // Default to other or based on collection name?
            amount: data.amount,
            description: data.name,
            organizationId,
            status: 'UNPAID' as any
        }));

        if (paymentsData.length > 0) {
            await prisma.educationPayment.createMany({
                data: paymentsData
            });
        }

        res.status(201).json(collection);
    } catch (error) {
        next(error);
    }
};

export const getFeeCollections = async (req: any, res: Response, next: NextFunction) => {
    try {
        const collections = await prisma.feeCollection.findMany({
            where: { organizationId: req.user.organizationId },
            orderBy: { createdAt: 'desc' }
        });
        res.json(collections);
    } catch (error) {
        next(error);
    }
};

export const createPaymentRequest = async (req: any, res: Response, next: NextFunction) => {
    try {
        const { studentId, type, amount, description } = req.body;

        const payment = await prisma.educationPayment.create({
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
    } catch (error) {
        next(error);
    }
};
