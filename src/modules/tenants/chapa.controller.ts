import { Request, Response, NextFunction } from 'express';
import prisma from '../../config/db';
import { CreateChapaSessionSchema } from './chapa.schema';
import axios from 'axios';

const CHAPA_API_URL = 'https://api.chapa.co/v1/transaction/initialize';
const CHAPA_SECRET_KEY = process.env.CHAPA_SECRET_KEY || 'YOUR_CHAPA_SECRET_KEY';

export const createChapaCheckoutSession = async (req: any, res: Response, next: NextFunction) => {
    try {
        const data = CreateChapaSessionSchema.parse(req.body);
        const { organizationId } = req.user; // Assuming auth middleware is used

        // 1. Validate if invoice exists
        let validInvoiceId: string | undefined = undefined;
        if (data.invoiceId && data.invoiceId !== "REPLACE_WITH_VALID_INVOICE_ID") {
            const invoice = await prisma.invoice.findUnique({
                where: { id: data.invoiceId }
            });
            if (!invoice) {
                return res.status(400).json({ error: 'Provided invoiceId does not exist.' });
            }
            validInvoiceId = data.invoiceId;
        }

        // 2. Create the record in our database
        // If an invoice is provided, first delete any previous checkout with the same invoiceId
        // since our schema has @unique on invoiceId for ChapaCheckout
        if (validInvoiceId) {
            const existingCheckout = await prisma.chapaCheckout.findUnique({
                where: { invoiceId: validInvoiceId }
            });
            if (existingCheckout) {
                await prisma.chapaCheckout.delete({
                    where: { id: existingCheckout.id }
                });
            }
        }

        const checkout = await prisma.chapaCheckout.create({
            data: {
                organizationId,
                tx_ref: data.tx_ref,
                amount: data.amount,
                currency: data.currency,
                status: 'PENDING',
                email: data.email,
                first_name: data.first_name,
                last_name: data.last_name,
                phone_number: data.phone_number,
                customTitle: data.custom_title,
                description: data.description,
                returnUrl: data.return_url,
                callbackUrl: data.callback_url,
                invoiceId: validInvoiceId
            }
        });

        // 3. Call Chapa API
        const payload = {
            amount: data.amount.toString(),
            currency: data.currency,
            email: data.email,
            first_name: data.first_name,
            last_name: data.last_name,
            phone_number: data.phone_number,
            tx_ref: data.tx_ref,
            callback_url: data.callback_url,
            return_url: data.return_url,
            customization: {
                title: data.custom_title,
                description: data.description
            }
        };

        try {
            const response = await axios.post(CHAPA_API_URL, payload, {
                headers: {
                    'Authorization': `Bearer ${CHAPA_SECRET_KEY}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.data && response.data.status === 'success') {
                const checkoutUrl = response.data.data.checkout_url;

                // Update our record with the Chapa checkout URL
                await prisma.chapaCheckout.update({
                    where: { id: checkout.id },
                    data: {
                        checkoutUrl
                    }
                });

                return res.status(201).json({
                    tx_ref: data.tx_ref,
                    checkoutUrl,
                    internalId: checkout.id
                });
            } else {
                throw new Error('Invalid response from Chapa');
            }
        } catch (apiError: any) {
            console.error('Chapa API Error:', apiError.response?.data || apiError.message);

            // Update status to FAILED in our DB
            await prisma.chapaCheckout.update({
                where: { id: checkout.id },
                data: { status: 'FAILED' }
            });

            return res.status(500).json({
                error: 'Failed to create Chapa session',
                details: apiError.response?.data || apiError.message
            });
        }

    } catch (error: any) {
        if (error.name === 'ZodError') {
            return res.status(400).json({ error: 'Validation failed', details: error.errors });
        }
        next(error);
    }
};

export const handleChapaWebhook = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { tx_ref, status } = req.body;

        const checkout = await prisma.chapaCheckout.findUnique({
            where: { tx_ref }
        });

        if (!checkout) {
            return res.status(404).json({ error: 'Checkout session not found' });
        }

        const isSuccess = status === 'success';

        await prisma.chapaCheckout.update({
            where: { id: checkout.id },
            data: {
                status: isSuccess ? 'SUCCESS' : 'FAILED',
                updatedAt: new Date()
            }
        });

        // If it was linked to an invoice, update the invoice too
        if (checkout.invoiceId && isSuccess) {
            await prisma.invoice.update({
                where: { id: checkout.invoiceId },
                data: {
                    status: 'PAID',
                    paidAt: new Date(),
                    paymentMethod: 'CHAPA',
                    transactionNumber: tx_ref
                }
            });
        }

        res.json({ message: 'Webhook processed successfully' });
    } catch (error) {
        console.error('Webhook Error:', error);
        next(error);
    }
};
