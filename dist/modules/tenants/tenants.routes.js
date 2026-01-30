"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const tenants_controller_1 = require("./tenants.controller");
const auth_middleware_1 = require("../../middleware/auth.middleware");
const rbac_middleware_1 = require("../../middleware/rbac.middleware");
const router = (0, express_1.Router)();
// Public route for landing page
router.post('/request', tenants_controller_1.submitRegistrationRequest);
// Admin routes
router.use(auth_middleware_1.authMiddleware);
router.use((0, rbac_middleware_1.rbacMiddleware)(['SUPER_ADMIN']));
router.get('/requests', tenants_controller_1.getRegistrationRequests);
router.put('/requests/:id', tenants_controller_1.updateRequestStatus);
exports.default = router;
