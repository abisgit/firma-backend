"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleChapaWebhook = exports.createChapaCheckoutSession = void 0;
const db_1 = __importDefault(require("../../config/db"));
const chapa_schema_1 = require("./chapa.schema");
const axios_1 = __importDefault(require("axios"));
const CHAPA_API_URL = 'https://api.chapa.co/v1/transaction/initialize';
const CHAPA_SECRET_KEY = process.env.CHAPA_SECRET_KEY || 'YOUR_CHAPA_SECRET_KEY';
const createChapaCheckoutSession = async (req, res, next) => {
    try {
        const data = chapa_schema_1.CreateChapaSessionSchema.parse(req.body);
        const { organizationId } = req.user; // Assuming auth middleware is used
        // 1. Validate if invoice exists
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
        const checkout = await db_1.default.chapaCheckout.create({
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
            const response = await axios_1.default.post(CHAPA_API_URL, payload, {
                headers: {
                    'Authorization': `Bearer ${CHAPA_SECRET_KEY}`,
                    'Content-Type': 'application/json'
                }
            });
            if (response.data && response.data.status === 'success') {
                const checkoutUrl = response.data.data.checkout_url;
                // Update our record with the Chapa checkout URL
                await db_1.default.chapaCheckout.update({
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
            }
            else {
                throw new Error('Invalid response from Chapa');
            }
        }
        catch (apiError) {
            console.error('Chapa API Error:', apiError.response?.data || apiError.message);
            // Update status to FAILED in our DB
            await db_1.default.chapaCheckout.update({
                where: { id: checkout.id },
                data: { status: 'FAILED' }
            });
            return res.status(500).json({
                error: 'Failed to create Chapa session',
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
exports.createChapaCheckoutSession = createChapaCheckoutSession;
const handleChapaWebhook = async (req, res, next) => {
    try {
        const { tx_ref, status } = req.body;
        const checkout = await db_1.default.chapaCheckout.findUnique({
            where: { tx_ref }
        });
        if (!checkout) {
            return res.status(404).json({ error: 'Checkout session not found' });
        }
        const isSuccess = status === 'success';
        await db_1.default.chapaCheckout.update({
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
                    paymentMethod: 'CHAPA',
                    transactionNumber: tx_ref
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
exports.handleChapaWebhook = handleChapaWebhook;
