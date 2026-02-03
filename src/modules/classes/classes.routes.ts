import { Router } from 'express';
import { getClasses, createClass, getClassById, updateClass, deleteClass } from './classes.controller';
import { authMiddleware } from '../../middleware/auth.middleware';
import { checkPermission } from '../../middleware/permission.middleware';

const router = Router();

router.use(authMiddleware);

router.get('/', checkPermission('view_classes'), getClasses);
router.get('/:id', checkPermission('view_classes'), getClassById);
router.post('/', checkPermission('manage_classes'), createClass);
router.put('/:id', checkPermission('manage_classes'), updateClass);
router.delete('/:id', checkPermission('manage_classes'), deleteClass);

export default router;
