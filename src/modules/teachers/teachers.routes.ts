import { Router } from 'express';
import { getTeachers, createTeacher, updateTeacher } from './teachers.controller';
import { authMiddleware } from '../../middleware/auth.middleware';
import { checkPermission } from '../../middleware/permission.middleware';

const router = Router();

router.use(authMiddleware);

router.get('/', checkPermission('view_teachers'), getTeachers);
router.post('/', checkPermission('manage_teachers'), createTeacher);
router.put('/:id', checkPermission('manage_teachers'), updateTeacher);

export default router;
