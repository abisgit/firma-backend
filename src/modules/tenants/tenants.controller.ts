import { Request, Response, NextFunction } from 'express';
import prisma from '../../config/db';
import { AuthRequest } from '../../middleware/auth.middleware';
import bcrypt from 'bcrypt';
import { OrganizationType, IndustryType, Role, TenantStatus } from '@prisma/client';

export const submitRegistrationRequest = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const {
            orgName, orgType, orgCode, contactPerson,
            officialEmail, identitySystem, phone, intendedUse
        } = req.body;

        if (!orgCode) {
            return res.status(400).json({ error: { message: 'Organization code is required.' } });
        }

        const normalizedCode = orgCode.toUpperCase();

        // 1. Check if an active request already exists for this code
        const existingRequest = await prisma.registrationRequest.findFirst({
            where: {
                orgCode: normalizedCode,
                status: { in: ['PENDING', 'REVIEWING'] }
            }
        });

        if (existingRequest) {
            return res.status(400).json({
                error: { message: 'A registration request for this organization code is already under review.' }
            });
        }

        // 2. Check if an organization with this code already exists
        const existingOrg = await prisma.organization.findUnique({
            where: { code: normalizedCode }
        });

        if (existingOrg) {
            return res.status(400).json({
                error: { message: 'An organization with this code is already registered.' }
            });
        }

        const request = await prisma.registrationRequest.create({
            data: {
                orgName,
                orgType,
                orgCode: normalizedCode,
                contactPerson,
                officialEmail,
                identitySystem,
                phone,
                intendedUse,
                industryType: orgType === 'EDUCATION' ? 'EDUCATION' : 'GOVERNMENT'
            }
        });

        res.status(201).json(request);
    } catch (error: any) {
        console.error('Error submitting registration request:', error);
        // Handle Prisma unique constraint specifically if it somehow passes our checks
        if (error.code === 'P2002') {
            return res.status(400).json({
                error: { message: 'Organization code already exists. Please choose a unique code.' }
            });
        }
        next(error);
    }
};

export const getRegistrationRequests = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const requests = await prisma.registrationRequest.findMany({
            orderBy: { createdAt: 'desc' }
        });
        res.json(requests);
    } catch (error) {
        next(error);
    }
};

export const updateRequestStatus = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const id = (Array.isArray(req.params.id) ? req.params.id[0] : req.params.id) as string;
        const { status, assignedTier } = req.body;
        const { userId } = req.user!;

        // 1. Get current request state
        const request = await prisma.registrationRequest.findUnique({
            where: { id }
        });

        if (!request) {
            return res.status(404).json({ error: { message: 'Registration request not found.' } });
        }

        // 2. If already approved, don't re-create organization
        if (request.status === 'APPROVED' && status === 'APPROVED') {
            return res.status(400).json({ error: { message: 'This request has already been approved.' } });
        }

        let credentials = null;

        const updatedRequest = await prisma.$transaction(async (tx) => {
            const updated = await tx.registrationRequest.update({
                where: { id },
                data: {
                    status,
                    assignedTier,
                    reviewedById: userId
                }
            });

            if (status === 'APPROVED') {
                // Check if org already exists (safety check)
                const existingOrg = await tx.organization.findUnique({
                    where: { code: updated.orgCode }
                });

                if (existingOrg) {
                    throw new Error(`Organization with code ${updated.orgCode} already exists.`);
                }

                const org = await tx.organization.create({
                    data: {
                        name: updated.orgName,
                        code: updated.orgCode,
                        type: updated.orgType,
                        industryType: updated.industryType,
                        subscriptionTier: assignedTier || 'STARTER',
                        status: 'APPROVED'
                    }
                });

                // Check if user already exists
                const existingUser = await tx.user.findUnique({
                    where: { email: updated.officialEmail }
                });

                if (existingUser) {
                    throw new Error(`User with email ${updated.officialEmail} already exists.`);
                }

                const tempPassword = 'Welcome' + Math.floor(1000 + Math.random() * 9000) + '!';
                const passwordHash = await bcrypt.hash(tempPassword, 10);

                await tx.user.create({
                    data: {
                        fullName: updated.contactPerson,
                        email: updated.officialEmail,
                        passwordHash,
                        role: updated.industryType === 'EDUCATION' ? Role.SCHOOL_ADMIN : Role.ORG_ADMIN,
                        organizationId: org.id
                    }
                });

                credentials = {
                    email: updated.officialEmail,
                    password: tempPassword,
                    orgCode: org.code
                };
            }

            return updated;
        });

        res.json({
            request: updatedRequest,
            credentials
        });
    } catch (error: any) {
        console.error('Error in updateRequestStatus:', error);
        res.status(500).json({ error: { message: error.message || 'Failed to update request status.' } });
    }
};
