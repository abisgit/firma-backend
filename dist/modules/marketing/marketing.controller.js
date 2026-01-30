"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateLandingContent = exports.getLandingContent = void 0;
const db_1 = __importDefault(require("../../config/db"));
const getLandingContent = async (req, res, next) => {
    try {
        let content = await db_1.default.landingPageContent.findUnique({
            where: { id: 'hero' }
        });
        if (!content) {
            content = await db_1.default.landingPageContent.create({
                data: { id: 'hero' }
            });
        }
        res.json(content);
    }
    catch (error) {
        next(error);
    }
};
exports.getLandingContent = getLandingContent;
const updateLandingContent = async (req, res, next) => {
    try {
        const { heroTitle, heroDesc, featuresJson } = req.body;
        const content = await db_1.default.landingPageContent.upsert({
            where: { id: 'hero' },
            update: { heroTitle, heroDesc, featuresJson },
            create: { id: 'hero', heroTitle, heroDesc, featuresJson }
        });
        res.json(content);
    }
    catch (error) {
        next(error);
    }
};
exports.updateLandingContent = updateLandingContent;
