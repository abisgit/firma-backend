"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateArifPaySessionSchema = exports.ArifPayBeneficiarySchema = exports.ArifPayItemSchema = void 0;
const zod_1 = require("zod");
exports.ArifPayItemSchema = zod_1.z.object({
    name: zod_1.z.string(),
    quantity: zod_1.z.number().int().nonnegative(),
    price: zod_1.z.number().nonnegative(),
    description: zod_1.z.string().optional().nullable()
});
exports.ArifPayBeneficiarySchema = zod_1.z.object({
    accountNumber: zod_1.z.string(),
    bank: zod_1.z.string(),
    amount: zod_1.z.number().nonnegative()
});
exports.CreateArifPaySessionSchema = zod_1.z.object({
    cancelUrl: zod_1.z.string().url(),
    phone: zod_1.z.string(),
    email: zod_1.z.string().email(),
    nonce: zod_1.z.string(),
    successUrl: zod_1.z.string().url(),
    errorUrl: zod_1.z.string().url(),
    notifyUrl: zod_1.z.string().url(),
    paymentMethods: zod_1.z.array(zod_1.z.string()),
    expireDate: zod_1.z.string().refine((val) => !isNaN(Date.parse(val)), {
        message: "Invalid date format",
    }),
    items: zod_1.z.array(exports.ArifPayItemSchema),
    beneficiaries: zod_1.z.array(exports.ArifPayBeneficiarySchema),
    lang: zod_1.z.string().default('EN'),
    currency: zod_1.z.string().default('USD'),
    invoiceId: zod_1.z.string().optional()
});
