import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    const patientId = '0a4d87c6-e9af-47e4-b656-4be74c8b9fa3';
    const patient = await prisma.patient.findFirst({
        where: {
            OR: [
                { id: patientId },
                { patientId: patientId }
            ]
        }
    });

    if (patient) {
        console.log('Patient Found:');
        console.log('ID:', patient.id);
        console.log('PatientID Code:', patient.patientId);
        console.log('Name:', patient.fullName);
        console.log('Organization ID:', patient.organizationId);

        const org = await prisma.organization.findUnique({
            where: { id: patient.organizationId }
        });
        console.log('Organization Name:', org?.name);
    } else {
        console.log('No patient found with ID or patientId:', patientId);
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
