import { Request, Response, NextFunction } from 'express';
import prisma from '../../config/db';
import { AuthRequest } from '../../middleware/auth.middleware';

export const getLeaves = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const { organizationId, role } = req.user!;
        let where: any = {};

        if (role !== 'SUPER_ADMIN') {
            where = {
                employee: {
                    organizationId
                }
            };
        }

        const leaves = await prisma.leaveRequest.findMany({
            where,
            include: {
                employee: {
                    select: {
                        id: true,
                        fullName: true,
                        email: true,
                        position: true
                    }
                },
                approvedBy: {
                    select: {
                        fullName: true
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });
        res.json(leaves);
    } catch (error) {
        next(error);
    }
};

export const createLeave = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const { employeeId, type, startDate, endDate, reason } = req.body;

        const leave = await prisma.leaveRequest.create({
            data: {
                employeeId,
                type,
                startDate: new Date(startDate),
                endDate: new Date(endDate),
                reason,
                status: 'PENDING'
            },
            include: {
                employee: true
            }
        });
        res.status(201).json(leave);
    } catch (error) {
        next(error);
    }
};

export const updateLeaveStatus = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        const approvedById = req.user!.userId;

        const leave = await prisma.leaveRequest.update({
            where: { id: id as string },
            data: {
                status,
                approvedById: status === 'APPROVED' ? approvedById : undefined
            }
        });
        res.json(leave);
    } catch (error) {
        next(error);
    }
};
