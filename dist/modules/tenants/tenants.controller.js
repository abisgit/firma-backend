"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateRequestStatus = exports.getRegistrationRequests = exports.submitRegistrationRequest = void 0;
const db_1 = __importDefault(require("../../config/db"));
const bcrypt_1 = __importDefault(require("bcrypt"));
const submitRegistrationRequest = async (req, res, next) => {
    try {
        const { orgName, orgType, orgCode, contactPerson, officialEmail, identitySystem, phone, intendedUse } = req.body;
        let finalOrgCode = orgCode?.trim().toUpperCase();
        if (!finalOrgCode) {
            // Generate a code if not provided (e.g. "Lancet Hospital" -> "LAN-1234")
            const cleanName = (orgName || '').replace(/[^A-Z]/gi, '').toUpperCase();
            const prefix = cleanName.substring(0, 3) || 'ORG';
            const random = Math.floor(1000 + Math.random() * 9000);
            finalOrgCode = `${prefix}-${random}`;
        }
        const normalizedCode = finalOrgCode;
        // 1. Check if an active request already exists for this code
        const existingRequest = await db_1.default.registrationRequest.findFirst({
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
        const existingOrg = await db_1.default.organization.findUnique({
            where: { code: normalizedCode }
        });
        if (existingOrg) {
            return res.status(400).json({
                error: { message: 'An organization with this code is already registered.' }
            });
        }
        const request = await db_1.default.registrationRequest.create({
            data: {
                orgName,
                orgType,
                orgCode: normalizedCode,
                contactPerson,
                officialEmail,
                identitySystem,
                phone,
                intendedUse,
                industryType: ['EDUCATION', 'HEALTHCARE', 'FINANCE', 'LEGAL'].includes(orgType) ? orgType : 'GOVERNMENT'
            }
        });
        res.status(201).json(request);
    }
    catch (error) {
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
exports.submitRegistrationRequest = submitRegistrationRequest;
const getRegistrationRequests = async (req, res, next) => {
    try {
        const requests = await db_1.default.registrationRequest.findMany({
            orderBy: { createdAt: 'desc' }
        });
        res.json(requests);
    }
    catch (error) {
        next(error);
    }
};
exports.getRegistrationRequests = getRegistrationRequests;
const updateRequestStatus = async (req, res, next) => {
    try {
        const id = (Array.isArray(req.params.id) ? req.params.id[0] : req.params.id);
        const { status, assignedTier } = req.body;
        const { userId } = req.user;
        // 1. Get current request state
        const request = await db_1.default.registrationRequest.findUnique({
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
        const updatedRequest = await db_1.default.$transaction(async (tx) => {
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
                // Create School profile if it's an educational institution
                if (updated.industryType === 'EDUCATION') {
                    await tx.school.create({
                        data: {
                            organizationId: org.id
                        }
                    });
                }
                // Check if user already exists
                const existingUser = await tx.user.findUnique({
                    where: { email: updated.officialEmail }
                });
                if (existingUser) {
                    throw new Error(`User with email ${updated.officialEmail} already exists.`);
                }
                const tempPassword = 'Welcome' + Math.floor(1000 + Math.random() * 9000) + '!';
                const passwordHash = await bcrypt_1.default.hash(tempPassword, 10);
                await tx.user.create({
                    data: {
                        fullName: updated.contactPerson,
                        email: updated.officialEmail,
                        passwordHash,
                        role: (updated.industryType === 'EDUCATION')
                            ? 'SCHOOL_ADMIN'
                            : (updated.industryType === 'HEALTHCARE' ? 'HOSPITAL_ADMIN' : 'ORG_ADMIN'),
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
    }
    catch (error) {
        console.error('Error in updateRequestStatus:', error);
        res.status(500).json({ error: { message: error.message || 'Failed to update request status.' } });
    }
};
exports.updateRequestStatus = updateRequestStatus;
