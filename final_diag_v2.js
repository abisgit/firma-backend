const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
    try {
        console.log('Database Check Initialized (with PG adapter)...');
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
                take: 10,
                select: { id: true, patientId: true, fullName: true, organizationId: true }
            });
            console.log('Sample Data in DB:', JSON.stringify(samples, null, 2));
        }

    } catch (err) {
        console.error('DATABASE ERROR:', err.message);
    } finally {
        await prisma.$disconnect();
        await pool.end();
    }
}

main();
