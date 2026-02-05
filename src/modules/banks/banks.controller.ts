import { Request, Response, NextFunction } from 'express';
import prisma from '../../config/db';
import { z } from 'zod';

const bankSchema = z.object({
    name: z.string(),
    accountNumber: z.string(),
    logoUrl: z.string().optional().nullable(),
    isActive: z.boolean().optional(),
});

export const getBanks = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const banks = await prisma.bank.findMany({
            orderBy: { name: 'asc' }
        });
        res.json(banks);
    } catch (error) {
        next(error);
    }
};

export const getActiveBanks = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const banks = await prisma.bank.findMany({
            where: { isActive: true },
            orderBy: { name: 'asc' }
        });
        res.json(banks);
    } catch (error) {
        next(error);
    }
};

export const createBank = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const data = bankSchema.parse(req.body);
        const bank = await prisma.bank.create({
            data
        });
        res.status(201).json(bank);
    } catch (error) {
        next(error);
    }
};

export const updateBank = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const id = req.params.id as string;
        const data = bankSchema.partial().parse(req.body);
        const bank = await prisma.bank.update({
            where: { id },
            data
        });
        res.json(bank);
    } catch (error) {
        next(error);
    }
};

export const deleteBank = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const id = req.params.id as string;
        await prisma.bank.delete({
            where: { id }
        });
        res.sendStatus(204);
    } catch (error) {
        next(error);
    }
};
