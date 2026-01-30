import { Router } from 'express';
import { getTeachers, createTeacher } from './teachers.controller';
import { authMiddleware } from '../../middleware/auth.middleware';
import { checkPermission } from '../../middleware/permission.middleware';

const router = Router();

router.use(authMiddleware);

router.get('/', checkPermission('manage_teachers'), getTeachers);
router.post('/', checkPermission('manage_teachers'), createTeacher);

export default router;
