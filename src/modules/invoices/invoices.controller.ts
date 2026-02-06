import { Request, Response, NextFunction } from 'express';
import prisma from '../../config/db';
import { z } from 'zod';
import { SubscriptionTier, InvoiceStatus } from '@prisma/client';

const PRICING: Record<SubscriptionTier, number> = {
    STARTER: 99,
    CONSORTIUM: 299,
    NATIONAL: 999,
    ENTERPRISE_LITE: 499
};

const submitPaymentSchema = z.object({
    paymentMethod: z.string(),
    transactionNumber: z.string(),
    tier: z.nativeEnum(SubscriptionTier).optional(),
});

export const getInvoice = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const orgId = req.params.orgId as string;

        // 1. Always look for an existing outstanding collection first (Unpaid or Pending)
        let invoice = await prisma.invoice.findFirst({
            where: {
                organizationId: orgId,
                status: { in: [InvoiceStatus.UNPAID, InvoiceStatus.PENDING] }
            },
            orderBy: { createdAt: 'desc' }
        });

        if (invoice) return res.json(invoice);

        // 2. No outstanding invoice fround. Check institutional status.
        const org = await prisma.organization.findUnique({ where: { id: orgId } });
        if (!org) return res.status(404).json({ message: 'Organization not found' });

        const isCurrentlyActive = org.isActive && (!org.expirationDate || new Date(org.expirationDate) > new Date());

        // 3. If institutional status is Inactive or Expired, create a NEW renewal bill (UNPAID)
        // This ensures they see the payment form instead of a historical "PAID" record.
        if (!isCurrentlyActive) {
            invoice = await prisma.invoice.create({
                data: {
                    invoiceNumber: `INV-${Date.now()}-${org.code}`,
                    organizationId: orgId,
                    amount: PRICING[org.subscriptionTier] || 99,
                    tier: org.subscriptionTier,
                    status: InvoiceStatus.UNPAID
                }
            });
            return res.json(invoice);
        }

        // 4. If they are active and healthy, show their latest PAID bill so they see "Verified"
        invoice = await prisma.invoice.findFirst({
            where: { organizationId: orgId, status: InvoiceStatus.PAID },
            orderBy: { createdAt: 'desc' }
        });

        // 5. Extreme fallback: Tenant is active in DB but somehow has zero invoice history.
        // We return null so the UI can show a "No historical billing" state or handle it gracefully.
        res.json(invoice);
    } catch (error) {
        next(error);
    }
};

export const updateInvoiceTier = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const id = req.params.id as string;
        const { tier } = req.body;

        if (!PRICING[tier as SubscriptionTier]) {
            return res.status(400).json({ message: 'Invalid tier' });
        }

        const invoice = await prisma.invoice.update({
            where: { id },
            data: {
                tier: tier as SubscriptionTier,
                amount: PRICING[tier as SubscriptionTier]
            }
        });

        res.json(invoice);
    } catch (error) {
        next(error);
    }
};

export const submitPayment = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const id = req.params.id as string;
        const data = submitPaymentSchema.parse(req.body);

        const invoice = await prisma.invoice.update({
            where: { id },
            data: {
                paymentMethod: data.paymentMethod,
                transactionNumber: data.transactionNumber,
                status: InvoiceStatus.PENDING,
                tier: data.tier || undefined,
                amount: data.tier ? PRICING[data.tier] : undefined
            }
        });

        res.json(invoice);
    } catch (error) {
        next(error);
    }
};

export const getAllInvoices = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const invoices = await prisma.invoice.findMany({
            include: { organization: true },
            orderBy: { createdAt: 'desc' }
        });
        res.json(invoices);
    } catch (error) {
        next(error);
    }
};

export const approveInvoice = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const id = req.params.id as string;

        const invoice = await prisma.invoice.findUnique({
            where: { id },
            include: { organization: true }
        });

        if (!invoice) return res.status(404).json({ message: 'Invoice not found' });

        // Update invoice status
        const updatedInvoice = await prisma.invoice.update({
            where: { id },
            data: {
                status: InvoiceStatus.PAID,
                paidAt: new Date()
            }
        });

        // Update organization status and tier
        await prisma.organization.update({
            where: { id: invoice.organizationId },
            data: {
                isActive: true,
                subscriptionTier: invoice.tier,
                expirationDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // +30 days example
            }
        });

        res.json(updatedInvoice);
    } catch (error) {
        next(error);
    }
};
