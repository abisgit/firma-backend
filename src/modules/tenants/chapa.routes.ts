import { Router } from 'express';
import { createChapaCheckoutSession, handleChapaWebhook } from './chapa.controller';
import { authMiddleware } from '../../middleware/auth.middleware';

const router = Router();

// Endpoint for tenants to create a payment session
router.post('/session', authMiddleware, createChapaCheckoutSession);

// Webhook endpoint
router.post('/webhook', handleChapaWebhook);

export default router;
