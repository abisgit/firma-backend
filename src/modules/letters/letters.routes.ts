
import { Router } from 'express';
import { authMiddleware } from '../../middleware/auth.middleware';
import { createLetter, getLetterByRef, getLetterById, updateStampPosition } from './letters.controller';

const router = Router();

router.use(authMiddleware);

router.post('/', createLetter);
router.get('/:org/:year/:seq', getLetterByRef);
router.get('/:id', getLetterById);
router.put('/:id/stamp', updateStampPosition);

export default router;
