"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const users_controller_1 = require("./users.controller");
const auth_middleware_1 = require("../../middleware/auth.middleware");
const rbac_middleware_1 = require("../../middleware/rbac.middleware");
const router = (0, express_1.Router)();
router.get('/', auth_middleware_1.authMiddleware, users_controller_1.getUsers);
router.get('/:id', auth_middleware_1.authMiddleware, users_controller_1.getUser);
router.post('/', auth_middleware_1.authMiddleware, (0, rbac_middleware_1.rbacMiddleware)(['SUPER_ADMIN', 'ORG_ADMIN']), users_controller_1.createUser);
router.put('/:id', auth_middleware_1.authMiddleware, (0, rbac_middleware_1.rbacMiddleware)(['SUPER_ADMIN', 'ORG_ADMIN']), users_controller_1.updateUser);
router.patch('/profile', auth_middleware_1.authMiddleware, users_controller_1.updateProfile); // Self-update profile
router.post('/:id/signature', auth_middleware_1.authMiddleware, users_controller_1.upload.single('signature'), users_controller_1.uploadSignature);
router.post('/:id/profile-image', auth_middleware_1.authMiddleware, users_controller_1.uploadProfileImg.single('profileImage'), users_controller_1.uploadProfileImage);
exports.default = router;
