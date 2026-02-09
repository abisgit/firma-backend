"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const banks_controller_1 = require("./banks.controller");
const auth_middleware_1 = require("../../middleware/auth.middleware");
const rbac_middleware_1 = require("../../middleware/rbac.middleware");
const router = (0, express_1.Router)();
// Public/Tenant route
router.get('/active', auth_middleware_1.authMiddleware, banks_controller_1.getActiveBanks);
// Admin routes
router.get('/', auth_middleware_1.authMiddleware, (0, rbac_middleware_1.rbacMiddleware)(['SUPER_ADMIN']), banks_controller_1.getBanks);
router.post('/', auth_middleware_1.authMiddleware, (0, rbac_middleware_1.rbacMiddleware)(['SUPER_ADMIN']), banks_controller_1.createBank);
router.patch('/:id', auth_middleware_1.authMiddleware, (0, rbac_middleware_1.rbacMiddleware)(['SUPER_ADMIN']), banks_controller_1.updateBank);
router.delete('/:id', auth_middleware_1.authMiddleware, (0, rbac_middleware_1.rbacMiddleware)(['SUPER_ADMIN']), banks_controller_1.deleteBank);
exports.default = router;
