import { Router } from 'express';
import { HealthcareController } from './healthcare.controller';
import { authMiddleware } from '../../middleware/auth.middleware';

const router = Router();

router.use(authMiddleware);

router.get('/patients', HealthcareController.getPatients);
router.get('/doctors', HealthcareController.getDoctors);
router.get('/appointments', HealthcareController.getAppointments);
router.get('/medicines', HealthcareController.getMedicines);
router.get('/lab-tests', HealthcareController.getLabTests);
router.get('/transactions', HealthcareController.getTransactions);
router.get('/summary', HealthcareController.getSummaryStats);

export default router;
