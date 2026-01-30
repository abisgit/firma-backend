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
    type: zod_1.z.enum(['MINISTRY', 'AGENCY', 'REGION', 'SUB_ORGANIZATION', 'OFFICE']),
    phoneNumber: zod_1.z.string().optional(),
    location: zod_1.z.string().optional(),
    parentOrganizationId: zod_1.z.string().optional(),
});
const getOrganizations = async (req, res, next) => {
    try {
        const orgs = await db_1.default.organization.findMany({
            include: { subOrganizations: true } // Include children for hierarchy if needed
        });
        res.json(orgs);
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
            include: { subOrganizations: true }
        });
        if (!org) {
            return res.status(404).json({ message: 'Organization not found' });
        }
        res.json(org);
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
                phoneNumber: data.phoneNumber,
                location: data.location,
                parentOrganizationId: data.parentOrganizationId
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
        const org = await db_1.default.organization.update({
            where: { id },
            data: {
                ...data,
                // explicit cast if present
                type: data.type ? data.type : undefined
            }
        });
        res.json(org);
    }
    catch (error) {
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
