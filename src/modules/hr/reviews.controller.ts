import { Request, Response, NextFunction } from 'express';
import prisma from '../../config/db';
import { AuthRequest } from '../../middleware/auth.middleware';

export const getReviews = async (req: AuthRequest, res: Response, next: NextFunction) => {
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

        const reviews = await prisma.performanceReview.findMany({
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
                reviewer: {
                    select: {
                        fullName: true
                    }
                }
            },
            orderBy: { reviewDate: 'desc' }
        });
        res.json(reviews);
    } catch (error) {
        next(error);
    }
};

export const createReview = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const { employeeId, rating, comments, reviewDate } = req.body;
        const reviewerId = req.user!.userId;

        const review = await prisma.performanceReview.create({
            data: {
                employeeId,
                reviewerId,
                rating: parseInt(rating),
                comments,
                reviewDate: reviewDate ? new Date(reviewDate) : new Date()
            },
            include: {
                employee: true
            }
        });
        res.status(201).json(review);
    } catch (error) {
        next(error);
    }
};
