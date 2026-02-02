import { Router } from 'express';
import { getEvents, createEvent, deleteEvent } from './events.controller';
import { authMiddleware } from '../../middleware/auth.middleware';
import { checkPermission } from '../../middleware/permission.middleware';

const router = Router();

router.use(authMiddleware);

router.get('/', getEvents);
router.post('/', checkPermission('manage_events'), createEvent);
router.delete('/:id', checkPermission('manage_events'), deleteEvent);

export default router;
