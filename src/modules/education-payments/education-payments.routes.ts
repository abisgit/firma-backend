import { Router } from 'express';
import * as EducationPaymentController from './education-payments.controller';
import { authMiddleware } from '../../middleware/auth.middleware';

const router = Router();

router.use(authMiddleware);

router.get('/', EducationPaymentController.getPaymentRequests);
router.post('/', EducationPaymentController.createPaymentRequest);
router.put('/:id/submit', EducationPaymentController.submitPayment);
router.patch('/:id/approve', EducationPaymentController.approvePayment);

router.get('/collections', EducationPaymentController.getFeeCollections);
router.post('/collections', EducationPaymentController.createFeeCollection);

export default router;
