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
        if (!orgCode) {
            return res.status(400).json({ error: { message: 'Organization code is required.' } });
        }
        const normalizedCode = orgCode.toUpperCase();
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
                intendedUse
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
        const request = await db_1.default.registrationRequest.update({
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
            const org = await db_1.default.organization.create({
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
            const passwordHash = await bcrypt_1.default.hash(tempPassword, 10);
            await db_1.default.user.create({
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
    }
    catch (error) {
        next(error);
    }
};
exports.updateRequestStatus = updateRequestStatus;
