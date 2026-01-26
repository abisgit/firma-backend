import { Request, Response, NextFunction } from 'express';
import prisma from '../../config/db';
import { AuthRequest } from '../../middleware/auth.middleware';
import bcrypt from 'bcrypt';

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
                intendedUse
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

        const request = await prisma.registrationRequest.update({
            where: { id },
            data: {
                status,
                assignedTier,
                reviewedById: userId
            }
        });

        let credentials = null;

        // If approved, create the organization and its initial ORG_ADMIN
        if (status === 'APPROVED') {
            const org = await prisma.organization.create({
                data: {
                    name: request.orgName,
                    code: request.orgCode,
                    type: request.orgType,
                    subscriptionTier: assignedTier || 'STARTER',
                    status: 'APPROVED'
                }
            });

            // Create the first admin user for the organization
            const tempPassword = 'Welcome' + Math.floor(1000 + Math.random() * 9000) + '!';
            const passwordHash = await bcrypt.hash(tempPassword, 10);

            await prisma.user.create({
                data: {
                    fullName: request.contactPerson,
                    email: request.officialEmail,
                    passwordHash,
                    role: 'ORG_ADMIN',
                    organizationId: org.id
                }
            });

            credentials = {
                email: request.officialEmail,
                password: tempPassword,
                orgCode: org.code
            };
        }

        res.json({
            request,
            credentials
        });
    } catch (error) {
        next(error);
    }
};
