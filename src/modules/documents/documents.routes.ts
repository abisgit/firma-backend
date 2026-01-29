import { Router } from 'express';
import { getDocuments, createDocument, upload } from './documents.controller';
import { authMiddleware } from '../../middleware/auth.middleware';

const router = Router();

router.get('/', authMiddleware, getDocuments);
router.post('/', authMiddleware, upload.single('file'), createDocument);

export default router;
