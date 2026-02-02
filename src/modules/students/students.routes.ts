import { Router } from 'express';
import { getStudents, getStudentById, createStudent } from './students.controller';
import { authMiddleware } from '../../middleware/auth.middleware';
import { checkPermission } from '../../middleware/permission.middleware';

const router = Router();

router.use(authMiddleware);

router.get('/', checkPermission('view_students'), getStudents);
router.get('/:id', checkPermission('view_students'), getStudentById);
router.post('/', checkPermission('manage_students'), createStudent);

export default router;
