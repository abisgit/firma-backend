import { Router } from 'express';
import { login, register, publicRegister } from './auth.controller';
import { authMiddleware } from '../../middleware/auth.middleware';
import { rbacMiddleware } from '../../middleware/rbac.middleware';

const router = Router();

router.post('/login', login);
router.post('/register', authMiddleware, rbacMiddleware(['SUPER_ADMIN']), register);
router.post('/register/public', publicRegister);

export default router;
