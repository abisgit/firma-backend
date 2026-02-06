import { Request, Response, NextFunction } from 'express';
import prisma from '../../config/db';
import { z } from 'zod';
import { OrganizationType } from '@prisma/client';

const orgSchema = z.object({
    name: z.string(),
    code: z.string(),
    type: z.enum(['MINISTRY', 'AGENCY', 'REGION', 'SUB_ORGANIZATION', 'OFFICE', 'EDUCATION', 'SCHOOL', 'COLLEGE', 'UNIVERSITY', 'SOE', 'ENTERPRISE']),
    industryType: z.enum(['GOVERNMENT', 'EDUCATION', 'HEALTHCARE', 'FINANCE', 'LEGAL', 'PRIVATE', 'OTHER']).optional().nullable(),
    phoneNumber: z.string().optional().nullable(),
    location: z.string().optional().nullable(),
    parentOrganizationId: z.string().optional().nullable(),
    isActive: z.boolean().optional(),
    status: z.string().optional().nullable(),
    subscriptionTier: z.string().optional().nullable(),
    maxUsers: z.number().optional().nullable(),
    expirationDate: z.string().or(z.date()).optional().nullable().transform(val => (val && val !== "") ? new Date(val) : null),
});

export const getOrganizations = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const orgs = await prisma.organization.findMany({
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
        const id = (Array.isArray(req.params.id) ? req.params.id[0] : req.params.id) as string;
        const org = await prisma.organization.findFirst({
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
                industryType: data.industryType as any,
                phoneNumber: data.phoneNumber,
                location: data.location,
                parentOrganizationId: (data.parentOrganizationId && data.parentOrganizationId !== "") ? data.parentOrganizationId : null,
                isActive: data.isActive,
                status: data.status as any,
                subscriptionTier: data.subscriptionTier as any,
                maxUsers: data.maxUsers || 100,
                expirationDate: data.expirationDate as any
            },
        });
        res.status(201).json(org);
    } catch (error) {
        next(error);
    }
};

export const updateOrganization = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const id = (Array.isArray(req.params.id) ? req.params.id[0] : req.params.id) as string;
        // make schema partial for updates
        const updateSchema = orgSchema.partial();
        const data = updateSchema.parse(req.body);

        // Explicitly map allowed fields to avoid passing relations or id to update
        const updateData: any = {};
        if (data.name !== undefined) updateData.name = data.name;
        if (data.code !== undefined) updateData.code = data.code;
        if (data.type !== undefined) updateData.type = data.type as any;
        if (data.industryType !== undefined) updateData.industryType = data.industryType as any;
        if (data.phoneNumber !== undefined) updateData.phoneNumber = data.phoneNumber;
        if (data.location !== undefined) updateData.location = data.location;
        if (data.isActive !== undefined) updateData.isActive = data.isActive;
        if (data.status !== undefined) updateData.status = data.status as any;
        if (data.subscriptionTier !== undefined) updateData.subscriptionTier = data.subscriptionTier as any;
        if (data.maxUsers !== undefined) updateData.maxUsers = data.maxUsers || 100;
        if (data.expirationDate !== undefined) updateData.expirationDate = data.expirationDate as any;

        // Handle parentOrganizationId carefully
        if (data.parentOrganizationId !== undefined) {
            updateData.parentOrganizationId = (data.parentOrganizationId && data.parentOrganizationId !== "") ? data.parentOrganizationId : null;
        }

        const org = await prisma.organization.update({
            where: { id },
            data: updateData
        });
        res.json(org);
    } catch (error) {
        console.error('Organization Update Error:', error);
        next(error);
    }
};

export const getOrgStats = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const orgId = (Array.isArray(req.params.id) ? req.params.id[0] : req.params.id) as string;
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
