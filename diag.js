require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        console.log('Using DB URL:', process.env.DATABASE_URL?.substring(0, 20) + '...');
        const count = await prisma.patient.count();
        console.log('Total Patients in DB:', count);

        const patients = await prisma.patient.findMany({
            take: 10,
            select: { id: true, patientId: true, fullName: true, organizationId: true }
        });
        console.log('Sample Patients:', JSON.stringify(patients, null, 2));

        const targetId = '0a4d87c6-e9af-47e4-b656-4be74c8b9fa3';
        const exact = await prisma.patient.findFirst({
            where: {
                OR: [
                    { id: targetId },
                    { patientId: targetId }
                ]
            }
        });
        console.log('Exact Match Search:', exact ? 'FOUND' : 'NOT FOUND');
        if (exact) console.log('Found Patient details:', JSON.stringify(exact, null, 2));

    } catch (err) {
        console.error('Error:', err);
    } finally {
        await prisma.$disconnect();
    }
}

main();
