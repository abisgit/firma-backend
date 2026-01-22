"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteTemplate = exports.updateTemplate = exports.createTemplate = exports.getTemplateById = exports.getTemplates = void 0;
const zod_1 = require("zod");
const db_1 = __importDefault(require("../../config/db"));
const templateSchema = zod_1.z.object({
    name: zod_1.z.string().min(1),
    letterType: zod_1.z.enum(['HIERARCHICAL', 'CROSS_STRUCTURE', 'STAFF', 'C_STAFF', 'HEAD_OFFICE', 'GUEST']),
    content: zod_1.z.string().min(1),
    isActive: zod_1.z.boolean().optional(),
});
const getTemplates = async (req, res) => {
    try {
        const { type, active } = req.query;
        const where = {};
        if (type)
            where.letterType = type;
        if (active !== undefined)
            where.isActive = active === 'true';
        const templates = await db_1.default.letterTemplate.findMany({
            where,
            orderBy: { createdAt: 'desc' },
        });
        res.json(templates);
    }
    catch (error) {
        console.error('Error fetching templates:', error);
        res.status(500).json({ message: 'Failed to fetch templates' });
    }
};
exports.getTemplates = getTemplates;
const getTemplateById = async (req, res) => {
    try {
        const { id } = req.params;
        const template = await db_1.default.letterTemplate.findUnique({
            where: { id },
        });
        if (!template) {
            return res.status(404).json({ message: 'Template not found' });
        }
        res.json(template);
    }
    catch (error) {
        console.error('Error fetching template:', error);
        res.status(500).json({ message: 'Failed to fetch template' });
    }
};
exports.getTemplateById = getTemplateById;
const createTemplate = async (req, res) => {
    try {
        const validatedData = templateSchema.parse(req.body);
        const template = await db_1.default.letterTemplate.create({
            data: validatedData,
        });
        res.status(201).json(template);
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            return res.status(400).json({ message: 'Validation error', errors: error.errors });
        }
        if (error.code === 'P2002') {
            return res.status(400).json({ message: 'Template name already exists' });
        }
        console.error('Error creating template:', error);
        res.status(500).json({ message: 'Failed to create template' });
    }
};
exports.createTemplate = createTemplate;
const updateTemplate = async (req, res) => {
    try {
        const { id } = req.params;
        const validatedData = templateSchema.partial().parse(req.body);
        const template = await db_1.default.letterTemplate.update({
            where: { id },
            data: validatedData,
        });
        res.json(template);
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            return res.status(400).json({ message: 'Validation error', errors: error.errors });
        }
        if (error.code === 'P2025') {
            return res.status(404).json({ message: 'Template not found' });
        }
        console.error('Error updating template:', error);
        res.status(500).json({ message: 'Failed to update template' });
    }
};
exports.updateTemplate = updateTemplate;
const deleteTemplate = async (req, res) => {
    try {
        const { id } = req.params;
        await db_1.default.letterTemplate.delete({
            where: { id },
        });
        res.json({ message: 'Template deleted successfully' });
    }
    catch (error) {
        if (error.code === 'P2025') {
            return res.status(404).json({ message: 'Template not found' });
        }
        console.error('Error deleting template:', error);
        res.status(500).json({ message: 'Failed to delete template' });
    }
};
exports.deleteTemplate = deleteTemplate;
