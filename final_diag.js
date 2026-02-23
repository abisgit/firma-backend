const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const prisma = new PrismaClient();

async function main() {
    try {
        console.log('Database Check Initialized...');
        const patientCount = await prisma.patient.count();
        console.log('Total Patients in DB:', patientCount);

        const targetId = '0a4d87c6-e9af-47e4-b656-4be74c8b9fa3';
        const patient = await prisma.patient.findFirst({
            where: {
                OR: [
                    { id: targetId },
                    { patientId: targetId }
                ]
            }
        });

        if (patient) {
            console.log('--- FOUND TARGET PATIENT ---');
            console.log('UUID:', patient.id);
            console.log('Code:', patient.patientId);
            console.log('Name:', patient.fullName);
            console.log('Org ID:', patient.organizationId);
        } else {
            console.log('--- TARGET PATIENT NOT FOUND ---');
            const samples = await prisma.patient.findMany({
                take: 3,
                select: { id: true, patientId: true, fullName: true, organizationId: true }
            });
            console.log('Sample Data in DB:', JSON.stringify(samples, null, 2));
        }

    } catch (err) {
        console.error('DATABASE ERROR:', err.message);
        if (err.code) console.error('Error Code:', err.code);
    } finally {
        await prisma.$disconnect();
    }
}

main();
