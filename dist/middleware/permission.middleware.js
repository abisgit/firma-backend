"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkPermission = void 0;
const permissions_1 = require("../config/permissions");
const checkPermission = (permission) => {
    return (req, res, next) => {
        const user = req.user;
        if (!user) {
            return res.status(401).json({ message: 'Authentication required' });
        }
        if ((0, permissions_1.hasPermission)(user.role, permission)) {
            return next();
        }
        return res.status(403).json({ message: 'Forbidden: Insufficient permissions' });
    };
};
exports.checkPermission = checkPermission;
