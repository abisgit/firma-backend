import { Router } from 'express';
import { authMiddleware } from '../../middleware/auth.middleware';
import { getLeaves, createLeave, updateLeaveStatus } from './leaves.controller';
import { getReviews, createReview } from './reviews.controller';

const router = Router();

router.use(authMiddleware);

// Leave Routes
router.get('/leaves', getLeaves);
router.post('/leaves', createLeave);
router.patch('/leaves/:id/status', updateLeaveStatus);

// Performance Review Routes
router.get('/reviews', getReviews);
router.post('/reviews', createReview);

export default router;
