const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const prisma = new PrismaClient();

async function main() {
    console.log('--- DATABASE PATIENT DUMP ---');
    try {
        const patients = await prisma.patient.findMany({
            select: { id: true, patientId: true, fullName: true, organizationId: true }
        });
        console.log(JSON.stringify(patients, null, 2));

        console.log('\n--- ORGANIZATIONS ---');
        const orgs = await prisma.organization.findMany({
            select: { id: true, name: true }
        });
        console.log(JSON.stringify(orgs, null, 2));
    } catch (e) {
        console.error('Database query failed:', e);
    }
}

main().catch(console.error).finally(() => prisma.$disconnect());
