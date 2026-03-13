"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleArifPayWebhook = exports.createCheckoutSession = void 0;
const db_1 = __importDefault(require("../../config/db"));
const arifpay_schema_1 = require("./arifpay.schema");
const axios_1 = __importDefault(require("axios"));
const ARIFPAY_API_URL = 'https://gateway.arifpay.net/api/checkout/session';
const ARIFPAY_API_KEY = process.env.ARIFPAY_API_KEY || 'YOUR_ARIFPAY_API_KEY';
const createCheckoutSession = async (req, res, next) => {
    try {
        const data = arifpay_schema_1.CreateArifPaySessionSchema.parse(req.body);
        const { organizationId } = req.user; // Assuming auth middleware is used
        // 1. Calculate total amount if not provided or to verify
        const totalAmount = data.items.reduce((acc, item) => acc + (item.price * item.quantity), 0);
        // 1.5 Validate if invoice exists
        let validInvoiceId = undefined;
        if (data.invoiceId && data.invoiceId !== "REPLACE_WITH_VALID_INVOICE_ID") {
            const invoice = await db_1.default.invoice.findUnique({
                where: { id: data.invoiceId }
            });
            if (!invoice) {
                return res.status(400).json({ error: 'Provided invoiceId does not exist.' });
            }
            validInvoiceId = data.invoiceId;
        }
        // 2. Create the record in our database
        const checkout = await db_1.default.arifPayCheckout.create({
            data: {
                organizationId,
                paymentMethods: data.paymentMethods,
                amount: totalAmount,
                currency: data.currency,
                status: 'PENDING',
                items: data.items,
                beneficiaries: data.beneficiaries,
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
            const response = await axios_1.default.post(ARIFPAY_API_URL, data, {
                headers: {
                    'Content-Type': 'application/json',
                    'x-arifpay-key': ARIFPAY_API_KEY
                }
            });
            if (response.data && response.data.data) {
                const { sessionId, checkoutUrl } = response.data.data;
                // Update our record with the ArifPay session info
                await db_1.default.arifPayCheckout.update({
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
            }
            else {
                throw new Error('Invalid response from ArifPay');
            }
        }
        catch (apiError) {
            console.error('ArifPay API Error:', apiError.response?.data || apiError.message);
            // Update status to FAILED in our DB
            await db_1.default.arifPayCheckout.update({
                where: { id: checkout.id },
                data: { status: 'FAILED' }
            });
            return res.status(500).json({
                error: 'Failed to create ArifPay session',
                details: apiError.response?.data || apiError.message
            });
        }
    }
    catch (error) {
        if (error.name === 'ZodError') {
            return res.status(400).json({ error: 'Validation failed', details: error.errors });
        }
        next(error);
    }
};
exports.createCheckoutSession = createCheckoutSession;
const handleArifPayWebhook = async (req, res, next) => {
    try {
        const { sessionId, transactionStatus, transaction, paymentMethod } = req.body;
        const checkout = await db_1.default.arifPayCheckout.findUnique({
            where: { sessionId }
        });
        if (!checkout) {
            return res.status(404).json({ error: 'Checkout session not found' });
        }
        const isSuccess = transactionStatus === 'SUCCESS';
        const transactionId = transaction?.transactionId || null;
        await db_1.default.arifPayCheckout.update({
            where: { id: checkout.id },
            data: {
                status: isSuccess ? 'SUCCESS' : 'FAILED',
                updatedAt: new Date()
            }
        });
        // If it was linked to an invoice, update the invoice too
        if (checkout.invoiceId && isSuccess) {
            await db_1.default.invoice.update({
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
    }
    catch (error) {
        console.error('Webhook Error:', error);
        next(error);
    }
};
exports.handleArifPayWebhook = handleArifPayWebhook;
