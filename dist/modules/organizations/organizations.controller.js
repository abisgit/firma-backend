"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createOrganization = exports.getOrganizations = void 0;
const db_1 = __importDefault(require("../../config/db"));
const zod_1 = require("zod");
const orgSchema = zod_1.z.object({
    name: zod_1.z.string(),
    code: zod_1.z.string(),
    type: zod_1.z.enum(['MINISTRY', 'AGENCY', 'REGION']),
});
const getOrganizations = async (req, res, next) => {
    try {
        const orgs = await db_1.default.organization.findMany();
        res.json(orgs);
    }
    catch (error) {
        next(error);
    }
};
exports.getOrganizations = getOrganizations;
const createOrganization = async (req, res, next) => {
    try {
        const data = orgSchema.parse(req.body);
        const org = await db_1.default.organization.create({
            data,
        });
        res.status(201).json(org);
    }
    catch (error) {
        next(error);
    }
};
exports.createOrganization = createOrganization;
