import { Router } from 'express';
import { getTemplates, getTemplateById, createTemplate, updateTemplate, deleteTemplate } from './templates.controller';
import { authMiddleware } from '../../middleware/auth.middleware';
import { checkPermission } from '../../middleware/permission.middleware';

const router = Router();

router.use(authMiddleware);

router.get('/', getTemplates);
router.get('/:id', getTemplateById);
router.post('/', checkPermission('create_templates'), createTemplate);
router.put('/:id', checkPermission('edit_templates'), updateTemplate);
router.delete('/:id', checkPermission('delete_templates'), deleteTemplate);

export default router;
