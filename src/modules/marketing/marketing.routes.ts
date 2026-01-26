import { Router } from 'express';
import { getLandingContent, updateLandingContent } from './marketing.controller';
import { authMiddleware } from '../../middleware/auth.middleware';
import { rbacMiddleware } from '../../middleware/rbac.middleware';

const router = Router();

router.get('/', getLandingContent);
router.put('/', authMiddleware, rbacMiddleware(['SUPER_ADMIN']), updateLandingContent);

export default router;
