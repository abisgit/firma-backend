import { Router } from 'express';
import { getTimetableByClass, addTimetableEntry } from './timetable.controller';
import { authMiddleware } from '../../middleware/auth.middleware';
import { checkPermission } from '../../middleware/permission.middleware';

const router = Router();

router.use(authMiddleware);

router.get('/class/:classId', checkPermission('view_timetable'), getTimetableByClass);
router.post('/', checkPermission('manage_timetable'), addTimetableEntry);

export default router;
