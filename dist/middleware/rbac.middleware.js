"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.rbacMiddleware = void 0;
const rbacMiddleware = (allowedRoles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ message: 'Unauthorized' });
        }
        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({ message: 'Access denied: Insufficient permissions' });
        }
        next();
    };
};
exports.rbacMiddleware = rbacMiddleware;
