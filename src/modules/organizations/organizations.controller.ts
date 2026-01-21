import { Request, Response, NextFunction } from 'express';
import prisma from '../../config/db';
import { z } from 'zod';

const orgSchema = z.object({
    name: z.string(),
    code: z.string(),
    type: z.enum(['MINISTRY', 'AGENCY', 'REGION']),
});

export const getOrganizations = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const orgs = await prisma.organization.findMany();
        res.json(orgs);
    } catch (error) {
        next(error);
    }
};

export const createOrganization = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const data = orgSchema.parse(req.body);
        const org = await prisma.organization.create({
            data,
        });
        res.status(201).json(org);
    } catch (error) {
        next(error);
    }
};
