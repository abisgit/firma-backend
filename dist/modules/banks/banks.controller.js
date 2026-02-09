"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteBank = exports.updateBank = exports.createBank = exports.getActiveBanks = exports.getBanks = void 0;
const db_1 = __importDefault(require("../../config/db"));
const zod_1 = require("zod");
const bankSchema = zod_1.z.object({
    name: zod_1.z.string(),
    accountNumber: zod_1.z.string(),
    logoUrl: zod_1.z.string().optional().nullable(),
    isActive: zod_1.z.boolean().optional(),
});
const getBanks = async (req, res, next) => {
    try {
        const banks = await db_1.default.bank.findMany({
            orderBy: { name: 'asc' }
        });
        res.json(banks);
    }
    catch (error) {
        next(error);
    }
};
exports.getBanks = getBanks;
const getActiveBanks = async (req, res, next) => {
    try {
        const banks = await db_1.default.bank.findMany({
            where: { isActive: true },
            orderBy: { name: 'asc' }
        });
        res.json(banks);
    }
    catch (error) {
        next(error);
    }
};
exports.getActiveBanks = getActiveBanks;
const createBank = async (req, res, next) => {
    try {
        const data = bankSchema.parse(req.body);
        const bank = await db_1.default.bank.create({
            data
        });
        res.status(201).json(bank);
    }
    catch (error) {
        next(error);
    }
};
exports.createBank = createBank;
const updateBank = async (req, res, next) => {
    try {
        const id = req.params.id;
        const data = bankSchema.partial().parse(req.body);
        const bank = await db_1.default.bank.update({
            where: { id },
            data
        });
        res.json(bank);
    }
    catch (error) {
        next(error);
    }
};
exports.updateBank = updateBank;
const deleteBank = async (req, res, next) => {
    try {
        const id = req.params.id;
        await db_1.default.bank.delete({
            where: { id }
        });
        res.sendStatus(204);
    }
    catch (error) {
        next(error);
    }
};
exports.deleteBank = deleteBank;
