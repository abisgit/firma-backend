import { Router } from 'express';
import { authMiddleware } from '../../middleware/auth.middleware';
import { sendMessage, getMessagesByLetter, getMyMessages } from './messages.controller';

const router = Router();

router.use(authMiddleware);

router.get('/', getMyMessages);
router.post('/', sendMessage);
router.get('/letter/:id', getMessagesByLetter);

export default router;
