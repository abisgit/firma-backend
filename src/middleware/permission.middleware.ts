import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth.middleware';
import { Permission, hasPermission } from '../config/permissions';

export const checkPermission = (permission: Permission) => {
    return (req: AuthRequest, res: Response, next: NextFunction) => {
        const user = req.user;

        if (!user) {
            return res.status(401).json({ message: 'Authentication required' });
        }

        if (hasPermission(user.role, permission)) {
            return next();
        }

        return res.status(403).json({ message: 'Forbidden: Insufficient permissions' });
    };
};
