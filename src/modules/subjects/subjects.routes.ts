import { Router } from 'express';
import { getSubjects, createSubject } from './subjects.controller';
import { authMiddleware } from '../../middleware/auth.middleware';
import { checkPermission } from '../../middleware/permission.middleware';

const router = Router();

router.use(authMiddleware);

router.get('/', checkPermission('manage_classes'), getSubjects);
router.post('/', checkPermission('manage_classes'), createSubject);

export default router;
