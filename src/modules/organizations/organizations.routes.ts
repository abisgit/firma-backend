import { Router } from 'express';
import {
    getOrganizations,
    createOrganization,
    getOrganization,
    updateOrganization,
    getSubOrganizations
} from './organizations.controller';
import { authMiddleware } from '../../middleware/auth.middleware';
import { rbacMiddleware } from '../../middleware/rbac.middleware';

const router = Router();

// Order is important: specific routes before generic :id
router.get('/sub-organizations', authMiddleware, getSubOrganizations);

// General Listings - Allow authenticated users to view orgs
router.get('/', authMiddleware, getOrganizations);
router.post('/', authMiddleware, rbacMiddleware(['SUPER_ADMIN']), createOrganization);

// Specific Organization operations
router.get('/:id', authMiddleware, getOrganization);
router.put('/:id', authMiddleware, rbacMiddleware(['SUPER_ADMIN', 'ORG_ADMIN']), updateOrganization);

export default router;
