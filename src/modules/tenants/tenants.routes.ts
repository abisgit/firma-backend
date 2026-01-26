import { Router } from 'express';
import { submitRegistrationRequest, getRegistrationRequests, updateRequestStatus } from './tenants.controller';
import { authMiddleware } from '../../middleware/auth.middleware';
import { rbacMiddleware } from '../../middleware/rbac.middleware';

const router = Router();

// Public route for landing page
router.post('/request', submitRegistrationRequest);

// Admin routes
router.use(authMiddleware);
router.use(rbacMiddleware(['SUPER_ADMIN']));

router.get('/requests', getRegistrationRequests);
router.put('/requests/:id', updateRequestStatus);

export default router;
