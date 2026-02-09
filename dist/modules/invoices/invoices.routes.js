"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const invoices_controller_1 = require("./invoices.controller");
const auth_middleware_1 = require("../../middleware/auth.middleware");
const rbac_middleware_1 = require("../../middleware/rbac.middleware");
const router = (0, express_1.Router)();
// Tenant routes
router.get('/org/:orgId', auth_middleware_1.authMiddleware, invoices_controller_1.getInvoice);
router.patch('/:id/submit', auth_middleware_1.authMiddleware, invoices_controller_1.submitPayment);
router.patch('/:id/tier', auth_middleware_1.authMiddleware, invoices_controller_1.updateInvoiceTier);
// Admin routes
router.get('/admin/all', auth_middleware_1.authMiddleware, (0, rbac_middleware_1.rbacMiddleware)(['SUPER_ADMIN']), invoices_controller_1.getAllInvoices);
router.patch('/admin/:id/approve', auth_middleware_1.authMiddleware, (0, rbac_middleware_1.rbacMiddleware)(['SUPER_ADMIN']), invoices_controller_1.approveInvoice);
exports.default = router;
