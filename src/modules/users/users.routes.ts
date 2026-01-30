import { Router } from 'express';
import { getUsers, getUser, createUser, updateUser, uploadSignature, upload, updateProfile, uploadProfileImage, uploadProfileImg } from './users.controller';
import { authMiddleware } from '../../middleware/auth.middleware';
import { rbacMiddleware } from '../../middleware/rbac.middleware';

const router = Router();

router.get('/', authMiddleware, getUsers);
router.get('/:id', authMiddleware, getUser);
router.post('/', authMiddleware, rbacMiddleware(['SUPER_ADMIN', 'ORG_ADMIN']), createUser);
router.put('/:id', authMiddleware, rbacMiddleware(['SUPER_ADMIN', 'ORG_ADMIN']), updateUser);
router.patch('/profile', authMiddleware, updateProfile); // Self-update profile
router.post('/:id/signature', authMiddleware, upload.single('signature'), uploadSignature);
router.post('/:id/profile-image', authMiddleware, uploadProfileImg.single('profileImage'), uploadProfileImage);

export default router;
