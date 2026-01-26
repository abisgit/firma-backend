import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import prisma from '../../config/db';
import { AuthRequest } from '../../middleware/auth.middleware';

const templateSchema = z.object({
  name: z.string().min(1),
  letterType: z.enum([
    'HIERARCHICAL',
    'CROSS_STRUCTURE',
    'STAFF',
    'C_STAFF',
    'HEAD_OFFICE',
    'GUEST',
  ]),
  content: z.string().min(1),
  isActive: z.boolean().optional(),
});

export const getTemplates = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { type, active } = req.query;
    const { organizationId, role } = req.user!;

    const where: any = {};
    if (type) where.letterType = type;
    if (active !== undefined) where.isActive = active === 'true';

    // Filter by organization if not SUPER_ADMIN
    if (role !== 'SUPER_ADMIN') {
      where.OR = [
        { organizationId: organizationId },
        { organizationId: null } // Show global templates too
      ];
    }

    const templates = await prisma.letterTemplate.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    res.json(templates);
  } catch (error) {
    next(error);
  }
};

export const getTemplateById = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const id = (Array.isArray(req.params.id) ? req.params.id[0] : req.params.id) as string;
    const { organizationId, role } = req.user!;

    const template = await prisma.letterTemplate.findUnique({
      where: { id },
    });

    if (!template) return res.status(404).json({ message: 'Template not found' });

    // Authorization check
    if (role !== 'SUPER_ADMIN' && template.organizationId && template.organizationId !== organizationId) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    res.json(template);
  } catch (error) {
    next(error);
  }
};

export const createTemplate = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const validatedData = templateSchema.parse(req.body);
    const { organizationId, role } = req.user!;

    const template = await prisma.letterTemplate.create({
      data: {
        ...validatedData,
        organizationId: role === 'SUPER_ADMIN' ? null : organizationId
      },
    });

    res.status(201).json(template);
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: 'Validation error', errors: error.flatten() });
    }
    // Prisma unique constraint error
    if ((error as any).code === 'P2002') {
      return res.status(400).json({ message: 'Template name already exists' });
    }
    next(error);
  }
};

export const updateTemplate = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = (Array.isArray(req.params.id) ? req.params.id[0] : req.params.id) as string;

    const validatedData = templateSchema.partial().parse(req.body);

    const template = await prisma.letterTemplate.update({
      where: { id },
      data: validatedData,
    });

    res.json(template);
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: 'Validation error', errors: error.flatten() });
    }
    if ((error as any).code === 'P2025') {
      return res.status(404).json({ message: 'Template not found' });
    }
    next(error);
  }
};

export const deleteTemplate = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = (Array.isArray(req.params.id) ? req.params.id[0] : req.params.id) as string;

    await prisma.letterTemplate.delete({
      where: { id },
    });

    res.json({ message: 'Template deleted successfully' });
  } catch (error: unknown) {
    if ((error as any).code === 'P2025') {
      return res.status(404).json({ message: 'Template not found' });
    }
    next(error);
  }
};

















// import { Request, Response } from 'express';
// import { z } from 'zod';
// import prisma from '../../config/db';

// const templateSchema = z.object({
//     name: z.string().min(1),
//     letterType: z.enum(['HIERARCHICAL', 'CROSS_STRUCTURE', 'STAFF', 'C_STAFF', 'HEAD_OFFICE', 'GUEST']),
//     content: z.string().min(1),
//     isActive: z.boolean().optional(),
// });

// export const getTemplates = async (req: Request, res: Response) => {
//     try {
//         const { type, active } = req.query;

//         const where: any = {};
//         if (type) where.letterType = type;
//         if (active !== undefined) where.isActive = active === 'true';

//         const templates = await prisma.letterTemplate.findMany({
//             where,
//             orderBy: { createdAt: 'desc' },
//         });

//         res.json(templates);
//     } catch (error) {
//         console.error('Error fetching templates:', error);
//         res.status(500).json({ message: 'Failed to fetch templates' });
//     }
// };

// export const getTemplateById = async (req: Request, res: Response) => {
//     try {
//         // const { id } = req.params;
//         const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

//         const template = await prisma.letterTemplate.findUnique({
//             where: { id },
//         });

//         if (!template) {
//             return res.status(404).json({ message: 'Template not found' });
//         }

//         res.json(template);
//     } catch (error) {
//         console.error('Error fetching template:', error);
//         res.status(500).json({ message: 'Failed to fetch template' });
//     }
// };

// export const createTemplate = async (req: Request, res: Response) => {
//     try {
//         const validatedData = templateSchema.parse(req.body);

//         const template = await prisma.letterTemplate.create({
//             data: validatedData,
//         });

//         res.status(201).json(template);
//     } catch (error: any) {
//         if (error instanceof z.ZodError) {
//             return res.status(400).json({ message: 'Validation error', errors: error.errors });
//         }
//         if (error.code === 'P2002') {
//             return res.status(400).json({ message: 'Template name already exists' });
//         }
//         console.error('Error creating template:', error);
//         res.status(500).json({ message: 'Failed to create template' });
//     }
// };

// export const updateTemplate = async (req: Request, res: Response) => {
//     try {
//         // const { id } = req.params;
//         const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

//         const validatedData = templateSchema.partial().parse(req.body);

//         const template = await prisma.letterTemplate.update({
//             where: { id },
//             data: validatedData,
//         });

//         res.json(template);
//     } catch (error: any) {
//         if (error instanceof z.ZodError) {
//             return res.status(400).json({ message: 'Validation error', errors: error.errors });
//         }
//         if (error.code === 'P2025') {
//             return res.status(404).json({ message: 'Template not found' });
//         }
//         console.error('Error updating template:', error);
//         res.status(500).json({ message: 'Failed to update template' });
//     }
// };

// export const deleteTemplate = async (req: Request, res: Response) => {
//     try {
//         // const { id } = req.params;
//         const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

//         await prisma.letterTemplate.delete({
//             where: { id },
//         });

//         res.json({ message: 'Template deleted successfully' });
//     } catch (error: any) {
//         if (error.code === 'P2025') {
//             return res.status(404).json({ message: 'Template not found' });
//         }
//         console.error('Error deleting template:', error);
//         res.status(500).json({ message: 'Failed to delete template' });
//     }
// };
