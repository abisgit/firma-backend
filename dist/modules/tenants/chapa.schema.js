"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateChapaSessionSchema = void 0;
const zod_1 = require("zod");
exports.CreateChapaSessionSchema = zod_1.z.object({
    amount: zod_1.z.number().positive(),
    currency: zod_1.z.string().default('ETB'),
    email: zod_1.z.string().email(),
    first_name: zod_1.z.string(),
    last_name: zod_1.z.string(),
    phone_number: zod_1.z.string().optional(),
    tx_ref: zod_1.z.string(),
    callback_url: zod_1.z.string().url().optional(),
    return_url: zod_1.z.string().url().optional(),
    custom_title: zod_1.z.string().optional(),
    description: zod_1.z.string().optional(),
    invoiceId: zod_1.z.string().optional()
});
