
import { Router } from 'express';
import { authMiddleware } from '../../middleware/auth.middleware';
import {
    createLetter,
    getLetterByRef,
    getLetterById,
    updateStampPosition,
    getLetters,
    getPublicLetter,
    updateApplicationStatus
} from './letters.controller';

const router = Router();

// Public routes - No auth required
router.get('/public/:id', getPublicLetter);
router.get('/verify/:org/:year/:seq', getLetterByRef);

router.use(authMiddleware);

router.get('/', getLetters);
router.post('/', createLetter);
router.get('/:org/:year/:seq', getLetterByRef);
router.get('/:id', getLetterById);
router.put('/:id/stamp', updateStampPosition);
router.put('/:id/status', updateApplicationStatus);

export default router;
