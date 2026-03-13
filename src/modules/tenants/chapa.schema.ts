import { z } from 'zod';

export const CreateChapaSessionSchema = z.object({
    amount: z.number().positive(),
    currency: z.string().default('ETB'),
    email: z.string().email(),
    first_name: z.string(),
    last_name: z.string(),
    phone_number: z.string().optional(),
    tx_ref: z.string(),
    callback_url: z.string().url().optional(),
    return_url: z.string().url().optional(),
    custom_title: z.string().optional(),
    description: z.string().optional(),
    invoiceId: z.string().optional()
});

export type CreateChapaSessionInput = z.infer<typeof CreateChapaSessionSchema>;
