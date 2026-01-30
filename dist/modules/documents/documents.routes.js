"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const documents_controller_1 = require("./documents.controller");
const auth_middleware_1 = require("../../middleware/auth.middleware");
const router = (0, express_1.Router)();
router.get('/', auth_middleware_1.authMiddleware, documents_controller_1.getDocuments);
router.post('/', auth_middleware_1.authMiddleware, documents_controller_1.upload.single('file'), documents_controller_1.createDocument);
exports.default = router;
