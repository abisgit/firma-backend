"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../../middleware/auth.middleware");
const letters_controller_1 = require("./letters.controller");
const router = (0, express_1.Router)();
// Public routes - No auth required
router.get('/public/:id', letters_controller_1.getPublicLetter);
router.get('/verify/:org/:year/:seq', letters_controller_1.getLetterByRef);
router.use(auth_middleware_1.authMiddleware);
router.get('/', letters_controller_1.getLetters);
router.post('/', letters_controller_1.createLetter);
router.get('/:org/:year/:seq', letters_controller_1.getLetterByRef);
router.get('/:id', letters_controller_1.getLetterById);
router.put('/:id/stamp', letters_controller_1.updateStampPosition);
router.put('/:id/status', letters_controller_1.updateApplicationStatus);
exports.default = router;
