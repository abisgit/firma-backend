const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const p = await prisma.patient.findMany({
        take: 5,
        select: { id: true, patientId: true, fullName: true, organizationId: true }
    });
    console.log('PATIENTS:', JSON.stringify(p, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
