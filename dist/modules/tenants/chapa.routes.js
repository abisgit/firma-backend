"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const chapa_controller_1 = require("./chapa.controller");
const auth_middleware_1 = require("../../middleware/auth.middleware");
const router = (0, express_1.Router)();
// Endpoint for tenants to create a payment session
router.post('/session', auth_middleware_1.authMiddleware, chapa_controller_1.createChapaCheckoutSession);
// Webhook endpoint
router.post('/webhook', chapa_controller_1.handleChapaWebhook);
exports.default = router;
