import { Router } from 'express';
import { getParents, createParent, getParentById, updateParent } from './parents.controller';
import { authMiddleware } from '../../middleware/auth.middleware';

const router = Router();

router.use(authMiddleware);

router.get('/', getParents);
router.post('/', createParent);
router.get('/:id', getParentById);
router.patch('/:id', updateParent);

export default router;
