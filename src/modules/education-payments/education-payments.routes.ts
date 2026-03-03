import { Router } from 'express';
import * as EducationPaymentController from './education-payments.controller';
import { authMiddleware } from '../../middleware/auth.middleware';

const router = Router();

router.use(authMiddleware);

router.get('/', EducationPaymentController.getPaymentRequests);
router.post('/', EducationPaymentController.createPaymentRequest);
router.put('/:id/submit', EducationPaymentController.submitPayment);

export default router;
