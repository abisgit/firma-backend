"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getOrgStats = exports.updateOrganization = exports.createOrganization = exports.getOrganization = exports.getSubOrganizations = exports.getPublicOrganizations = exports.getOrganizations = void 0;
const db_1 = __importDefault(require("../../config/db"));
const zod_1 = require("zod");
const client_1 = require("@prisma/client");
const orgSchema = zod_1.z.object({
    name: zod_1.z.string(),
    code: zod_1.z.string(),
    type: zod_1.z.enum(['MINISTRY', 'AGENCY', 'REGION', 'SUB_ORGANIZATION', 'OFFICE', 'EDUCATION', 'SCHOOL', 'COLLEGE', 'UNIVERSITY', 'SOE', 'ENTERPRISE']),
    industryType: zod_1.z.enum(['GOVERNMENT', 'EDUCATION', 'HEALTHCARE', 'FINANCE', 'LEGAL', 'PRIVATE', 'OTHER']).optional().nullable(),
    phoneNumber: zod_1.z.string().optional().nullable(),
    location: zod_1.z.string().optional().nullable(),
    parentOrganizationId: zod_1.z.string().optional().nullable(),
    isActive: zod_1.z.boolean().optional(),
    status: zod_1.z.string().optional().nullable(),
    subscriptionTier: zod_1.z.string().optional().nullable(),
    maxUsers: zod_1.z.number().optional().nullable(),
    expirationDate: zod_1.z.string().or(zod_1.z.date()).optional().nullable().transform(val => (val && val !== "") ? new Date(val) : null),
});
const getOrganizations = async (req, res, next) => {
    try {
        const orgs = await db_1.default.organization.findMany({
            include: {
                subOrganizations: true,
                invoices: {
                    where: { status: { in: ['UNPAID', 'PENDING'] } },
                    take: 1
                }
            }
        });
        const processedOrgs = orgs.map(org => {
            const isExpired = org.expirationDate && new Date(org.expirationDate) < new Date();
            const hasPendingPayment = org.invoices.some(inv => inv.status === 'UNPAID' || inv.status === 'PENDING');
            return {
                ...org,
                isActive: (isExpired || hasPendingPayment) ? false : org.isActive,
                hasUnpaidInvoice: hasPendingPayment,
                isExpired
            };
        });
        res.json(processedOrgs);
    }
    catch (error) {
        next(error);
    }
};
exports.getOrganizations = getOrganizations;
const getPublicOrganizations = async (req, res, next) => {
    try {
        const orgs = await db_1.default.organization.findMany({
            where: {
                parentOrganizationId: null
            },
            select: {
                name: true,
                code: true
            }
        });
        res.json(orgs);
    }
    catch (error) {
        next(error);
    }
};
exports.getPublicOrganizations = getPublicOrganizations;
const getSubOrganizations = async (req, res, next) => {
    try {
        // Fetch only sub-organizations and offices
        const orgs = await db_1.default.organization.findMany({
            where: {
                type: {
                    in: [client_1.OrganizationType.SUB_ORGANIZATION, client_1.OrganizationType.OFFICE, client_1.OrganizationType.REGION]
                }
            },
            include: { parentOrganization: true }
        });
        res.json(orgs);
    }
    catch (error) {
        next(error);
    }
};
exports.getSubOrganizations = getSubOrganizations;
const getOrganization = async (req, res, next) => {
    try {
        const id = (Array.isArray(req.params.id) ? req.params.id[0] : req.params.id);
        const org = await db_1.default.organization.findFirst({
            where: {
                OR: [
                    { id: id },
                    { code: id }
                ]
            },
            include: {
                subOrganizations: true,
                invoices: {
                    where: { status: { in: ['UNPAID', 'PENDING'] } },
                    orderBy: { createdAt: 'desc' },
                    take: 1
                }
            }
        });
        if (!org) {
            return res.status(404).json({ message: 'Organization not found' });
        }
        // If there is an unpaid or pending invoice, or if the subscription is expired, the tenant should not be considered "Active"
        const isExpired = org.expirationDate && new Date(org.expirationDate) < new Date();
        const hasPendingPayment = org.invoices.some(inv => inv.status === 'UNPAID' || inv.status === 'PENDING');
        // Final status: Active only if DB says so AND no outstanding payment AND not expired
        const finalIsActive = (isExpired || hasPendingPayment) ? false : org.isActive;
        res.json({
            ...org,
            isActive: finalIsActive,
            hasUnpaidInvoice: hasPendingPayment,
            isExpired
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getOrganization = getOrganization;
const createOrganization = async (req, res, next) => {
    try {
        const data = orgSchema.parse(req.body);
        // Convert Zod string enum to Prisma Enum if needed, though they match
        const org = await db_1.default.organization.create({
            data: {
                name: data.name,
                code: data.code,
                type: data.type,
                industryType: data.industryType,
                phoneNumber: data.phoneNumber,
                location: data.location,
                parentOrganizationId: (data.parentOrganizationId && data.parentOrganizationId !== "") ? data.parentOrganizationId : null,
                isActive: data.isActive,
                status: data.status,
                subscriptionTier: data.subscriptionTier,
                maxUsers: data.maxUsers || 100,
                expirationDate: data.expirationDate
            },
        });
        res.status(201).json(org);
    }
    catch (error) {
        next(error);
    }
};
exports.createOrganization = createOrganization;
const updateOrganization = async (req, res, next) => {
    try {
        const id = (Array.isArray(req.params.id) ? req.params.id[0] : req.params.id);
        // make schema partial for updates
        const updateSchema = orgSchema.partial();
        const data = updateSchema.parse(req.body);
        // Explicitly map allowed fields to avoid passing relations or id to update
        const updateData = {};
        if (data.name !== undefined)
            updateData.name = data.name;
        if (data.code !== undefined)
            updateData.code = data.code;
        if (data.type !== undefined)
            updateData.type = data.type;
        if (data.industryType !== undefined)
            updateData.industryType = data.industryType;
        if (data.phoneNumber !== undefined)
            updateData.phoneNumber = data.phoneNumber;
        if (data.location !== undefined)
            updateData.location = data.location;
        if (data.isActive !== undefined)
            updateData.isActive = data.isActive;
        if (data.status !== undefined)
            updateData.status = data.status;
        if (data.subscriptionTier !== undefined)
            updateData.subscriptionTier = data.subscriptionTier;
        if (data.maxUsers !== undefined)
            updateData.maxUsers = data.maxUsers || 100;
        if (data.expirationDate !== undefined)
            updateData.expirationDate = data.expirationDate;
        // Handle parentOrganizationId carefully
        if (data.parentOrganizationId !== undefined) {
            updateData.parentOrganizationId = (data.parentOrganizationId && data.parentOrganizationId !== "") ? data.parentOrganizationId : null;
        }
        const org = await db_1.default.organization.update({
            where: { id },
            data: updateData
        });
        res.json(org);
    }
    catch (error) {
        console.error('Organization Update Error:', error);
        next(error);
    }
};
exports.updateOrganization = updateOrganization;
const getOrgStats = async (req, res, next) => {
    try {
        const orgId = (Array.isArray(req.params.id) ? req.params.id[0] : req.params.id);
        if (!orgId)
            return res.status(400).json({ message: 'Org ID required' });
        const [subOrgs, employees, sentToOrgs, sentToEmployees, appsReceived, ccToUs, received, drafts] = await Promise.all([
            db_1.default.organization.count({ where: { parentOrganizationId: orgId } }),
            db_1.default.user.count({ where: { organizationId: orgId } }),
            db_1.default.letter.count({ where: { senderOrgId: orgId, recipientOrgId: { not: null }, status: 'SENT' } }),
            db_1.default.letter.count({ where: { senderOrgId: orgId, recipientUserId: { not: null }, status: 'SENT' } }),
            db_1.default.letter.count({ where: { recipientOrgId: orgId, letterType: 'GUEST' } }),
            db_1.default.letterCC.count({ where: { organizationId: orgId } }),
            db_1.default.letter.count({ where: { recipientOrgId: orgId, status: 'SENT' } }),
            db_1.default.letter.count({ where: { senderOrgId: orgId, status: 'DRAFT' } })
        ]);
        res.json({
            subOrgs,
            employees,
            sentToOrgs,
            sentToEmployees,
            appsReceived,
            ccToUs,
            received,
            drafts
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getOrgStats = getOrgStats;
