import { Router } from 'express';
import { getOrganizations, createOrganization } from './organizations.controller';
import { authMiddleware } from '../../middleware/auth.middleware';
import { rbacMiddleware } from '../../middleware/rbac.middleware';

const router = Router();

router.get('/', authMiddleware, rbacMiddleware(['SUPER_ADMIN']), getOrganizations);
router.post('/', authMiddleware, rbacMiddleware(['SUPER_ADMIN']), createOrganization);

export default router;
