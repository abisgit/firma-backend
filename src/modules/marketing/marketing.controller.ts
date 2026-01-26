import { Request, Response, NextFunction } from 'express';
import prisma from '../../config/db';

export const getLandingContent = async (req: Request, res: Response, next: NextFunction) => {
    try {
        let content = await prisma.landingPageContent.findUnique({
            where: { id: 'hero' }
        });

        if (!content) {
            content = await prisma.landingPageContent.create({
                data: { id: 'hero' }
            });
        }

        res.json(content);
    } catch (error) {
        next(error);
    }
};

export const updateLandingContent = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { heroTitle, heroDesc, featuresJson } = req.body;

        const content = await prisma.landingPageContent.upsert({
            where: { id: 'hero' },
            update: { heroTitle, heroDesc, featuresJson },
            create: { id: 'hero', heroTitle, heroDesc, featuresJson }
        });

        res.json(content);
    } catch (error) {
        next(error);
    }
};
