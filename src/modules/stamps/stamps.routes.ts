
import { Router } from 'express';
import { authMiddleware } from '../../middleware/auth.middleware';
import { upload, uploadStamp, getMyStamps, deleteStamp, getStampsByUser } from './stamps.controller';

const router = Router();

router.use(authMiddleware);

router.post('/', upload.single('image'), uploadStamp);
router.get('/', getMyStamps);
router.get('/user/:userId', getStampsByUser);
router.delete('/:id', deleteStamp);

export default router;
