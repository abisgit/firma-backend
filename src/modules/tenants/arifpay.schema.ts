import { z } from 'zod';

export const ArifPayItemSchema = z.object({
    name: z.string(),
    quantity: z.number().int().nonnegative(),
    price: z.number().nonnegative(),
    description: z.string().optional().nullable()
});

export const ArifPayBeneficiarySchema = z.object({
    accountNumber: z.string(),
    bank: z.string(),
    amount: z.number().nonnegative()
});

export const CreateArifPaySessionSchema = z.object({
    cancelUrl: z.string().url(),
    phone: z.string(),
    email: z.string().email(),
    nonce: z.string(),
    successUrl: z.string().url(),
    errorUrl: z.string().url(),
    notifyUrl: z.string().url(),
    paymentMethods: z.array(z.string()),
    expireDate: z.string().refine((val) => !isNaN(Date.parse(val)), {
        message: "Invalid date format",
    }),
    items: z.array(ArifPayItemSchema),
    beneficiaries: z.array(ArifPayBeneficiarySchema),
    lang: z.string().default('EN'),
    currency: z.string().default('USD'),
    invoiceId: z.string().optional()
});

export type ArifPayItem = z.infer<typeof ArifPayItemSchema>;
export type ArifPayBeneficiary = z.infer<typeof ArifPayBeneficiarySchema>;
export type CreateArifPaySessionInput = z.infer<typeof CreateArifPaySessionSchema>;

export interface ArifPaySessionResponse {
    sessionId: string;
    checkoutUrl: string;
    // Add other fields based on ArifPay documentation if available
}
