import { Router } from 'express';
import { getBanks, getActiveBanks, createBank, updateBank, deleteBank } from './banks.controller';
import { authMiddleware } from '../../middleware/auth.middleware';
import { rbacMiddleware } from '../../middleware/rbac.middleware';

const router = Router();

// Public/Tenant route
router.get('/active', authMiddleware, getActiveBanks);

// Admin routes
router.get('/', authMiddleware, rbacMiddleware(['SUPER_ADMIN']), getBanks);
router.post('/', authMiddleware, rbacMiddleware(['SUPER_ADMIN']), createBank);
router.patch('/:id', authMiddleware, rbacMiddleware(['SUPER_ADMIN']), updateBank);
router.delete('/:id', authMiddleware, rbacMiddleware(['SUPER_ADMIN']), deleteBank);

export default router;
