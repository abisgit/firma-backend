import { Request, Response, NextFunction } from 'express';
import prisma from '../../config/db';
import { z } from 'zod';
import { OrganizationType } from '@prisma/client';

const orgSchema = z.object({
    name: z.string(),
    code: z.string(),
    type: z.enum(['MINISTRY', 'AGENCY', 'REGION', 'SUB_ORGANIZATION', 'OFFICE']),
    phoneNumber: z.string().optional(),
    location: z.string().optional(),
    parentOrganizationId: z.string().optional(),
});

export const getOrganizations = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const orgs = await prisma.organization.findMany({
            include: { subOrganizations: true } // Include children for hierarchy if needed
        });
        res.json(orgs);
    } catch (error) {
        next(error);
    }
};

export const getPublicOrganizations = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const orgs = await prisma.organization.findMany({
            where: {
                parentOrganizationId: null
            },
            select: {
                name: true,
                code: true
            }
        });
        res.json(orgs);
    } catch (error) {
        next(error);
    }
};

export const getSubOrganizations = async (req: Request, res: Response, next: NextFunction) => {
    try {
        // Fetch only sub-organizations and offices
        const orgs = await prisma.organization.findMany({
            where: {
                type: {
                    in: [OrganizationType.SUB_ORGANIZATION, OrganizationType.OFFICE, OrganizationType.REGION]
                }
            },
            include: { parentOrganization: true }
        });
        res.json(orgs);
    } catch (error) {
        next(error);
    }
};

export const getOrganization = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
        const org = await prisma.organization.findFirst({
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
    } catch (error) {
        next(error);
    }
};

export const createOrganization = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const data = orgSchema.parse(req.body);

        // Convert Zod string enum to Prisma Enum if needed, though they match
        const org = await prisma.organization.create({
            data: {
                name: data.name,
                code: data.code,
                type: data.type as OrganizationType,
                phoneNumber: data.phoneNumber,
                location: data.location,
                parentOrganizationId: data.parentOrganizationId
            },
        });
        res.status(201).json(org);
    } catch (error) {
        next(error);
    }
};

export const updateOrganization = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
        // make schema partial for updates
        const updateSchema = orgSchema.partial();
        const data = updateSchema.parse(req.body);

        const org = await prisma.organization.update({
            where: { id },
            data: {
                ...data,
                // explicit cast if present
                type: data.type ? (data.type as OrganizationType) : undefined
            }
        });
        res.json(org);
    } catch (error) {
        next(error);
    }
};

export const getOrgStats = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const orgId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
        if (!orgId) return res.status(400).json({ message: 'Org ID required' });

        const [
            subOrgs,
            employees,
            sentToOrgs,
            sentToEmployees,
            appsReceived,
            ccToUs,
            received,
            drafts
        ] = await Promise.all([
            prisma.organization.count({ where: { parentOrganizationId: orgId } }),
            prisma.user.count({ where: { organizationId: orgId } }),
            prisma.letter.count({ where: { senderOrgId: orgId, recipientOrgId: { not: null }, status: 'SENT' } }),
            prisma.letter.count({ where: { senderOrgId: orgId, recipientUserId: { not: null }, status: 'SENT' } }),
            prisma.letter.count({ where: { recipientOrgId: orgId, letterType: 'GUEST' } }),
            prisma.letterCC.count({ where: { organizationId: orgId } }),
            prisma.letter.count({ where: { recipientOrgId: orgId, status: 'SENT' } }),
            prisma.letter.count({ where: { senderOrgId: orgId, status: 'DRAFT' } })
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
    } catch (error) {
        next(error);
    }
};
