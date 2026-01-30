"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const organizations_controller_1 = require("./organizations.controller");
const auth_middleware_1 = require("../../middleware/auth.middleware");
const rbac_middleware_1 = require("../../middleware/rbac.middleware");
const router = (0, express_1.Router)();
// Public route
router.get('/public', organizations_controller_1.getPublicOrganizations);
// Order is important: specific routes before generic :id
router.get('/sub-organizations', auth_middleware_1.authMiddleware, organizations_controller_1.getSubOrganizations);
// General Listings - Allow authenticated users to view orgs
router.get('/', auth_middleware_1.authMiddleware, organizations_controller_1.getOrganizations);
router.post('/', auth_middleware_1.authMiddleware, (0, rbac_middleware_1.rbacMiddleware)(['SUPER_ADMIN']), organizations_controller_1.createOrganization);
// Specific Organization operations
router.get('/:id', auth_middleware_1.authMiddleware, organizations_controller_1.getOrganization);
router.get('/:id/stats', auth_middleware_1.authMiddleware, organizations_controller_1.getOrgStats);
router.put('/:id', auth_middleware_1.authMiddleware, (0, rbac_middleware_1.rbacMiddleware)(['SUPER_ADMIN', 'ORG_ADMIN']), organizations_controller_1.updateOrganization);
exports.default = router;
