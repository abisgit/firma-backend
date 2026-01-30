"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createReview = exports.getReviews = void 0;
const db_1 = __importDefault(require("../../config/db"));
const getReviews = async (req, res, next) => {
    try {
        const { organizationId, role } = req.user;
        let where = {};
        if (role !== 'SUPER_ADMIN') {
            where = {
                employee: {
                    organizationId
                }
            };
        }
        const reviews = await db_1.default.performanceReview.findMany({
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
    }
    catch (error) {
        next(error);
    }
};
exports.getReviews = getReviews;
const createReview = async (req, res, next) => {
    try {
        const { employeeId, rating, comments, reviewDate } = req.body;
        const reviewerId = req.user.userId;
        const review = await db_1.default.performanceReview.create({
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
    }
    catch (error) {
        next(error);
    }
};
exports.createReview = createReview;
