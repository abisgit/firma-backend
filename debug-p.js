const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
    try {
        console.log('--- DB Check ---');
        const id = '0a4d87c6-e9af-47e4-b656-4be74c8b9fa3';

        const p1 = await prisma.patient.findUnique({ where: { id } }).catch(e => ({ error: e.message }));
        console.log('Find by id result:', p1 ? (p1.id ? 'Found' : 'Error: ' + p1.error) : 'Not Found');

        const p2 = await prisma.patient.findUnique({ where: { patientId: id } }).catch(e => ({ error: e.message }));
        console.log('Find by patientId result:', p2 ? (p2.id ? 'Found' : 'Error: ' + p2.error) : 'Not Found');

        if (p1 && p1.id) {
            console.log('Patient found with ID. Details:', { id: p1.id, fullName: p1.fullName, orgId: p1.organizationId });
        }
    } catch (err) {
        console.error('Outer error:', err);
    } finally {
        await prisma.$disconnect();
    }
}

check();
