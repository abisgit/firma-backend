import { Router } from 'express';
import { getDocuments, createDocument } from './documents.controller';
import { authMiddleware } from '../../middleware/auth.middleware';

const router = Router();

router.get('/', authMiddleware, getDocuments);
router.post('/', authMiddleware, createDocument);

export default router;
