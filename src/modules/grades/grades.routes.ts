import { Router } from 'express';
import { getGradesByClass, addGrade, updateGrade, getStudentGrades } from './grades.controller';
import { authMiddleware } from '../../middleware/auth.middleware';
import { checkPermission } from '../../middleware/permission.middleware';

const router = Router();

router.use(authMiddleware);

router.get('/class/:classId', checkPermission('view_grades'), getGradesByClass);
router.post('/', checkPermission('manage_grades'), addGrade);
router.patch('/:id', checkPermission('manage_grades'), updateGrade);
router.get('/student', getStudentGrades);
router.get('/student/:studentId', getStudentGrades);

export default router;
