"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.approveInvoice = exports.getAllInvoices = exports.submitPayment = exports.updateInvoiceTier = exports.getInvoice = void 0;
const db_1 = __importDefault(require("../../config/db"));
const zod_1 = require("zod");
const client_1 = require("@prisma/client");
const PRICING = {
    STARTER: 99,
    CONSORTIUM: 299,
    NATIONAL: 999,
    ENTERPRISE_LITE: 499
};
const submitPaymentSchema = zod_1.z.object({
    paymentMethod: zod_1.z.string(),
    transactionNumber: zod_1.z.string(),
    tier: zod_1.z.nativeEnum(client_1.SubscriptionTier).optional(),
});
const getInvoice = async (req, res, next) => {
    try {
        const orgId = req.params.orgId;
        // 1. Always look for an existing outstanding collection first (Unpaid or Pending)
        let invoice = await db_1.default.invoice.findFirst({
            where: {
                organizationId: orgId,
                status: { in: [client_1.InvoiceStatus.UNPAID, client_1.InvoiceStatus.PENDING] }
            },
            orderBy: { createdAt: 'desc' }
        });
        if (invoice)
            return res.json(invoice);
        // 2. No outstanding invoice fround. Check institutional status.
        const org = await db_1.default.organization.findUnique({ where: { id: orgId } });
        if (!org)
            return res.status(404).json({ message: 'Organization not found' });
        const isCurrentlyActive = org.isActive && (!org.expirationDate || new Date(org.expirationDate) > new Date());
        // 3. If institutional status is Inactive or Expired, create a NEW renewal bill (UNPAID)
        // This ensures they see the payment form instead of a historical "PAID" record.
        if (!isCurrentlyActive) {
            invoice = await db_1.default.invoice.create({
                data: {
                    invoiceNumber: `INV-${Date.now()}-${org.code}`,
                    organizationId: orgId,
                    amount: PRICING[org.subscriptionTier] || 99,
                    tier: org.subscriptionTier,
                    status: client_1.InvoiceStatus.UNPAID
                }
            });
            return res.json(invoice);
        }
        // 4. If they are active and healthy, show their latest PAID bill so they see "Verified"
        invoice = await db_1.default.invoice.findFirst({
            where: { organizationId: orgId, status: client_1.InvoiceStatus.PAID },
            orderBy: { createdAt: 'desc' }
        });
        // 5. Extreme fallback: Tenant is active in DB but somehow has zero invoice history.
        // We return null so the UI can show a "No historical billing" state or handle it gracefully.
        res.json(invoice);
    }
    catch (error) {
        next(error);
    }
};
exports.getInvoice = getInvoice;
const updateInvoiceTier = async (req, res, next) => {
    try {
        const id = req.params.id;
        const { tier } = req.body;
        if (!PRICING[tier]) {
            return res.status(400).json({ message: 'Invalid tier' });
        }
        const invoice = await db_1.default.invoice.update({
            where: { id },
            data: {
                tier: tier,
                amount: PRICING[tier]
            }
        });
        res.json(invoice);
    }
    catch (error) {
        next(error);
    }
};
exports.updateInvoiceTier = updateInvoiceTier;
const submitPayment = async (req, res, next) => {
    try {
        const id = req.params.id;
        const data = submitPaymentSchema.parse(req.body);
        const invoice = await db_1.default.invoice.update({
            where: { id },
            data: {
                paymentMethod: data.paymentMethod,
                transactionNumber: data.transactionNumber,
                status: client_1.InvoiceStatus.PENDING,
                tier: data.tier || undefined,
                amount: data.tier ? PRICING[data.tier] : undefined
            }
        });
        res.json(invoice);
    }
    catch (error) {
        next(error);
    }
};
exports.submitPayment = submitPayment;
const getAllInvoices = async (req, res, next) => {
    try {
        const invoices = await db_1.default.invoice.findMany({
            include: { organization: true },
            orderBy: { createdAt: 'desc' }
        });
        res.json(invoices);
    }
    catch (error) {
        next(error);
    }
};
exports.getAllInvoices = getAllInvoices;
const approveInvoice = async (req, res, next) => {
    try {
        const id = req.params.id;
        const invoice = await db_1.default.invoice.findUnique({
            where: { id },
            include: { organization: true }
        });
        if (!invoice)
            return res.status(404).json({ message: 'Invoice not found' });
        // Update invoice status
        const updatedInvoice = await db_1.default.invoice.update({
            where: { id },
            data: {
                status: client_1.InvoiceStatus.PAID,
                paidAt: new Date()
            }
        });
        // Update organization status and tier
        await db_1.default.organization.update({
            where: { id: invoice.organizationId },
            data: {
                isActive: true,
                subscriptionTier: invoice.tier,
                expirationDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // +30 days example
            }
        });
        res.json(updatedInvoice);
    }
    catch (error) {
        next(error);
    }
};
exports.approveInvoice = approveInvoice;
