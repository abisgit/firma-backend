import { Router } from 'express';
import { getClasses, createClass } from './classes.controller';
import { authMiddleware } from '../../middleware/auth.middleware';
import { checkPermission } from '../../middleware/permission.middleware';

const router = Router();

router.use(authMiddleware);

router.get('/', checkPermission('manage_classes'), getClasses);
router.post('/', checkPermission('manage_classes'), createClass);

export default router;
