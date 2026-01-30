"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../../middleware/auth.middleware");
const leaves_controller_1 = require("./leaves.controller");
const reviews_controller_1 = require("./reviews.controller");
const router = (0, express_1.Router)();
router.use(auth_middleware_1.authMiddleware);
// Leave Routes
router.get('/leaves', leaves_controller_1.getLeaves);
router.post('/leaves', leaves_controller_1.createLeave);
router.patch('/leaves/:id/status', leaves_controller_1.updateLeaveStatus);
// Performance Review Routes
router.get('/reviews', reviews_controller_1.getReviews);
router.post('/reviews', reviews_controller_1.createReview);
exports.default = router;
