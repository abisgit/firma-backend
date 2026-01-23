import { Router } from 'express';
import { getUsers, getUser, createUser, updateUser } from './users.controller';
import { authMiddleware } from '../../middleware/auth.middleware';
import { rbacMiddleware } from '../../middleware/rbac.middleware';

const router = Router();

router.get('/', authMiddleware, getUsers);
router.get('/:id', authMiddleware, getUser);
router.post('/', authMiddleware, rbacMiddleware(['SUPER_ADMIN', 'ORG_ADMIN']), createUser);
router.put('/:id', authMiddleware, rbacMiddleware(['SUPER_ADMIN', 'ORG_ADMIN']), updateUser);

export default router;
