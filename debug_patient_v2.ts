import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';
dotenv.config();

const prisma = new PrismaClient();

async function main() {
    const patientId = '0a4d87c6-e9af-47e4-b656-4be74c8b9fa3';
    console.log('Searching for Patient:', patientId);

    const patient = await prisma.patient.findFirst({
        where: {
            OR: [
                { id: patientId },
                { patientId: patientId }
            ]
        }
    });

    if (patient) {
        console.log('--- PATIENT FOUND ---');
        console.log('ID:', patient.id);
        console.log('Code:', patient.patientId);
        console.log('Name:', patient.fullName);
        console.log('Organization ID:', patient.organizationId);

        const org = await prisma.organization.findUnique({
            where: { id: patient.organizationId }
        });
        console.log('Organization Name:', org?.name);

        const users = await prisma.user.findMany({
            where: { organizationId: patient.organizationId, role: 'ORG_ADMIN' }
        });
        console.log('Admins for this Org:', users.map(u => u.email).join(', '));
    } else {
        console.log('--- NO PATIENT FOUND ---');
        const allPatients = await prisma.patient.findMany({ take: 5 });
        console.log('Sample Patient IDs in DB:', allPatients.map(p => p.id));
    }
}

main()
    .catch(e => {
        console.error('ERROR during debug:');
        console.error(e);
    })
    .finally(async () => await prisma.$disconnect());
