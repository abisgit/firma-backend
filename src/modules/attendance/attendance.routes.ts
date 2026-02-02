import { Router } from 'express';
import { getAttendanceByClass, markAttendance, getStudentAttendance } from './attendance.controller';
import { authMiddleware } from '../../middleware/auth.middleware';
import { checkPermission } from '../../middleware/permission.middleware';

const router = Router();

router.use(authMiddleware);

router.get('/class/:classId', checkPermission('view_attendance'), getAttendanceByClass);
router.post('/mark', checkPermission('mark_attendance'), markAttendance);
router.get('/student', getStudentAttendance);
router.get('/student/:studentId', getStudentAttendance);

export default router;
