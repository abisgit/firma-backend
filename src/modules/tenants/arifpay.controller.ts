import { Request, Response, NextFunction } from 'express';
import prisma from '../../config/db';
import { CreateArifPaySessionSchema } from './arifpay.schema';
import axios from 'axios';

const ARIFPAY_API_URL = 'https://gateway.arifpay.net/api/checkout/session';
const ARIFPAY_API_KEY = process.env.ARIFPAY_API_KEY || 'YOUR_ARIFPAY_API_KEY';

export const createCheckoutSession = async (req: any, res: Response, next: NextFunction) => {
    try {
        const data = CreateArifPaySessionSchema.parse(req.body);
        const { organizationId } = req.user; // Assuming auth middleware is used

        // 1. Calculate total amount if not provided or to verify
        const totalAmount = data.items.reduce((acc, item) => acc + (item.price * item.quantity), 0);
        
        // 1.5 Validate if invoice exists
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
        if (validInvoiceId) {
            const existingCheckout = await prisma.arifPayCheckout.findUnique({
                where: { invoiceId: validInvoiceId }
            });
            if (existingCheckout) {
                await prisma.arifPayCheckout.delete({
                    where: { id: existingCheckout.id }
                });
            }
        }

        const checkout = await prisma.arifPayCheckout.create({
            data: {
                organizationId,
                paymentMethods: data.paymentMethods,
                amount: totalAmount,
                currency: data.currency,
                status: 'PENDING',
                items: data.items as any,
                beneficiaries: data.beneficiaries as any,
                phone: data.phone,
                email: data.email,
                cancelUrl: data.cancelUrl,
                successUrl: data.successUrl,
                errorUrl: data.errorUrl,
                notifyUrl: data.notifyUrl,
                expireDate: new Date(data.expireDate),
                nonce: data.nonce,
                lang: data.lang,
                invoiceId: validInvoiceId
            }
        });

        // 3. Call ArifPay API
        try {
            const response = await axios.post(ARIFPAY_API_URL, data, {
                headers: {
                    'Content-Type': 'application/json',
                    'x-arifpay-key': ARIFPAY_API_KEY
                }
            });

            if (response.data && response.data.data) {
                const { sessionId, checkoutUrl } = response.data.data;

                // Update our record with the ArifPay session info
                await prisma.arifPayCheckout.update({
                    where: { id: checkout.id },
                    data: {
                        sessionId,
                        checkoutUrl
                    }
                });

                return res.status(201).json({
                    sessionId,
                    checkoutUrl,
                    internalId: checkout.id
                });
            } else {
                throw new Error('Invalid response from ArifPay');
            }
        } catch (apiError: any) {
            console.error('ArifPay API Error:', apiError.response?.data || apiError.message);

            // Update status to FAILED in our DB
            await prisma.arifPayCheckout.update({
                where: { id: checkout.id },
                data: { status: 'FAILED' }
            });

            return res.status(500).json({
                error: 'Failed to create ArifPay session',
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

export const handleArifPayWebhook = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { sessionId, transactionStatus, transaction, paymentMethod } = req.body;

        const checkout = await prisma.arifPayCheckout.findUnique({
            where: { sessionId }
        });

        if (!checkout) {
            return res.status(404).json({ error: 'Checkout session not found' });
        }

        const isSuccess = transactionStatus === 'SUCCESS';
        const transactionId = transaction?.transactionId || null;

        await prisma.arifPayCheckout.update({
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
                    paymentMethod: paymentMethod || 'ARIFPAY',
                    transactionNumber: transactionId
                }
            });
        }

        res.json({ message: 'Webhook processed successfully' });
    } catch (error) {
        console.error('Webhook Error:', error);
        next(error);
    }
};
