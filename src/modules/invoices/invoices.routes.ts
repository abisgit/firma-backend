import { Router } from 'express';
import { getInvoice, submitPayment, getAllInvoices, approveInvoice, updateInvoiceTier } from './invoices.controller';
import { authMiddleware } from '../../middleware/auth.middleware';
import { rbacMiddleware } from '../../middleware/rbac.middleware';

const router = Router();

// Tenant routes
router.get('/org/:orgId', authMiddleware, getInvoice);
router.patch('/:id/submit', authMiddleware, submitPayment);
router.patch('/:id/tier', authMiddleware, updateInvoiceTier);

// Admin routes
router.get('/admin/all', authMiddleware, rbacMiddleware(['SUPER_ADMIN']), getAllInvoices);
router.patch('/admin/:id/approve', authMiddleware, rbacMiddleware(['SUPER_ADMIN']), approveInvoice);

export default router;
