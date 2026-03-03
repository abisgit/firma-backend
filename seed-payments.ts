import prisma from './src/config/db';
import { PaymentType, InvoiceStatus } from '@prisma/client';

async function seed() {
    const student = await prisma.student.findUnique({
        where: { admissionNumber: 'STU-2024-001' },
        include: { user: true }
    });

    if (!student) {
        console.log('Student not found');
        return;
    }

    const educationPayments = [
        {
            studentId: student.id,
            type: PaymentType.TUITION_FEE,
            amount: 1500,
            description: 'Spring Semester 2024',
            organizationId: student.user.organizationId!,
            status: InvoiceStatus.UNPAID
        },
        {
            studentId: student.id,
            type: PaymentType.LAB_FEES,
            amount: 200,
            description: 'Chemistry Lab Fee',
            organizationId: student.user.organizationId!,
            status: InvoiceStatus.UNPAID
        },
        {
            studentId: student.id,
            type: PaymentType.LIBRARY_FINE,
            amount: 15,
            description: 'Overdue: "Clean Code"',
            organizationId: student.user.organizationId!,
            status: InvoiceStatus.PAID,
            paymentDate: new Date()
        },
        {
            studentId: student.id,
            type: PaymentType.BUS_FEE,
            amount: 500,
            description: 'Monthly Transport - March',
            organizationId: student.user.organizationId!,
            status: InvoiceStatus.PENDING,
            transactionNumber: 'TX-123456789'
        }
    ];

    for (const payment of educationPayments) {
        await prisma.educationPayment.create({
            data: payment
        });
    }

    console.log('✅ Seeded education payments');
}

seed().catch(console.error).finally(() => process.exit(0));
