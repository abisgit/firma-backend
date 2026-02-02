import { Router } from 'express';
import { getAcademicYears, getTerms } from './academic.controller';
import { authMiddleware } from '../../middleware/auth.middleware';

const router = Router();

router.use(authMiddleware);

router.get('/years', getAcademicYears);
router.get('/terms/:yearId', getTerms);

export default router;
