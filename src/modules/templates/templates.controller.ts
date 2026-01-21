import { Request, Response } from 'express';
import { z } from 'zod';
import prisma from '../../config/db';

const templateSchema = z.object({
    name: z.string().min(1),
    letterType: z.enum(['HIERARCHICAL', 'CROSS_STRUCTURE', 'STAFF', 'C_STAFF', 'HEAD_OFFICE', 'GUEST']),
    content: z.string().min(1),
    isActive: z.boolean().optional(),
});

export const getTemplates = async (req: Request, res: Response) => {
    try {
        const { type, active } = req.query;

        const where: any = {};
        if (type) where.letterType = type;
        if (active !== undefined) where.isActive = active === 'true';

        const templates = await prisma.letterTemplate.findMany({
            where,
            orderBy: { createdAt: 'desc' },
        });

        res.json(templates);
    } catch (error) {
        console.error('Error fetching templates:', error);
        res.status(500).json({ message: 'Failed to fetch templates' });
    }
};

export const getTemplateById = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        const template = await prisma.letterTemplate.findUnique({
            where: { id },
        });

        if (!template) {
            return res.status(404).json({ message: 'Template not found' });
        }

        res.json(template);
    } catch (error) {
        console.error('Error fetching template:', error);
        res.status(500).json({ message: 'Failed to fetch template' });
    }
};

export const createTemplate = async (req: Request, res: Response) => {
    try {
        const validatedData = templateSchema.parse(req.body);

        const template = await prisma.letterTemplate.create({
            data: validatedData,
        });

        res.status(201).json(template);
    } catch (error: any) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ message: 'Validation error', errors: error.errors });
        }
        if (error.code === 'P2002') {
            return res.status(400).json({ message: 'Template name already exists' });
        }
        console.error('Error creating template:', error);
        res.status(500).json({ message: 'Failed to create template' });
    }
};

export const updateTemplate = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const validatedData = templateSchema.partial().parse(req.body);

        const template = await prisma.letterTemplate.update({
            where: { id },
            data: validatedData,
        });

        res.json(template);
    } catch (error: any) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ message: 'Validation error', errors: error.errors });
        }
        if (error.code === 'P2025') {
            return res.status(404).json({ message: 'Template not found' });
        }
        console.error('Error updating template:', error);
        res.status(500).json({ message: 'Failed to update template' });
    }
};

export const deleteTemplate = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        await prisma.letterTemplate.delete({
            where: { id },
        });

        res.json({ message: 'Template deleted successfully' });
    } catch (error: any) {
        if (error.code === 'P2025') {
            return res.status(404).json({ message: 'Template not found' });
        }
        console.error('Error deleting template:', error);
        res.status(500).json({ message: 'Failed to delete template' });
    }
};
