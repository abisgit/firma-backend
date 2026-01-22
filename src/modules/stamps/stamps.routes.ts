
import { Router } from 'express';
import { authMiddleware } from '../../middleware/auth.middleware';
import { upload, uploadStamp, getMyStamps, deleteStamp } from './stamps.controller';

const router = Router();

router.use(authMiddleware);

router.post('/', upload.single('image'), uploadStamp);
router.get('/', getMyStamps);
router.delete('/:id', deleteStamp);

export default router;
