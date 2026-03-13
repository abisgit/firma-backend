"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const arifpay_controller_1 = require("./arifpay.controller");
const auth_middleware_1 = require("../../middleware/auth.middleware");
const router = (0, express_1.Router)();
// Endpoint for tenants to create a payment session
router.post('/session', auth_middleware_1.authMiddleware, arifpay_controller_1.createCheckoutSession);
// Webhook endpoint (Public, but probably should verified with signature if possible)
router.post('/webhook', arifpay_controller_1.handleArifPayWebhook);
exports.default = router;
