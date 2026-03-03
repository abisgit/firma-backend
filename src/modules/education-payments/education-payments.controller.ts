import { Request, Response, NextFunction } from 'express';
import prisma from '../../config/db';
import { z } from 'zod';

export const getPaymentRequests = async (req: any, res: Response, next: NextFunction) => {
    try {
        const userId = req.user.id;
        const role = req.user.role;

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
            const payments = await prisma.educationPayment.findMany({
                where: { organizationId: req.user.organizationId },
                include: { student: { include: { user: true } }, bank: true },
                orderBy: { createdAt: 'desc' }
            });
            return res.json(payments);
        }

        const payments = await prisma.educationPayment.findMany({
            where: {
                studentId: { in: studentIds }
            },
            include: { student: { include: { user: true } }, bank: true },
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
