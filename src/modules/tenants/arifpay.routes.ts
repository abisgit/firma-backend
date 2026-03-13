import { Router } from 'express';
import { createCheckoutSession, handleArifPayWebhook } from './arifpay.controller';
import { authMiddleware } from '../../middleware/auth.middleware';
import { rbacMiddleware } from '../../middleware/rbac.middleware';

const router = Router();

// Endpoint for tenants to create a payment session
router.post('/session', authMiddleware, createCheckoutSession);

// Webhook endpoint (Public, but probably should verified with signature if possible)
router.post('/webhook', handleArifPayWebhook);

export default router;
