import { Router } from 'express';
import { getTemplates, getTemplateById, createTemplate, updateTemplate, deleteTemplate } from './templates.controller';
import { authMiddleware } from '../../middleware/authMiddleware';

const router = Router();

router.use(authMiddleware);

router.get('/', getTemplates);
router.get('/:id', getTemplateById);
router.post('/', createTemplate);
router.put('/:id', updateTemplate);
router.delete('/:id', deleteTemplate);

export default router;
