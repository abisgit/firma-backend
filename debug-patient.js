const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkPatient() {
    const id = '0a4d87c6-e9af-47e4-b656-4be74c8b9fa3';
    console.log('Checking patient with ID:', id);
    try {
        const patient = await prisma.patient.findFirst({
            where: {
                OR: [
                    { id: id },
                    { patientId: id }
                ]
            }
        });

        if (!patient) {
            console.log('Patient not found in any organization.');
            const allPatients = await prisma.patient.findMany({ take: 5 });
            console.log('Some existing patients:', allPatients.map(p => ({ id: p.id, name: p.fullName, orgId: p.organizationId })));
            return;
        }

        console.log('Patient found:', {
            id: patient.id,
            fullName: patient.fullName,
            organizationId: patient.organizationId
        });

        // Try to fetch relations to see where it breaks
        console.log('Fetching relations...');
        const [medicalRecords, appointments, transactions, prescriptions] = await Promise.all([
            prisma.medicalRecord.findMany({
                where: { patientId: patient.id },
                include: { doctor: true }
            }),
            prisma.appointment.findMany({
                where: { patientId: patient.id },
                include: { doctor: true }
            }),
            prisma.healthcareTransaction.findMany({
                where: { patientId: patient.id }
            }),
            prisma.prescription.findMany({
                where: { patientId: patient.id },
                include: {
                    doctor: true,
                    items: { include: { medicine: true } }
                }
            })
        ]);
        console.log('Medical Records count:', medicalRecords.length);
        console.log('Appointments count:', appointments.length);
        console.log('Transactions count:', transactions.length);
        console.log('Prescriptions count:', prescriptions.length);

    } catch (err) {
        console.error('ERROR during check:', err);
    } finally {
        await prisma.$disconnect();
    }
}

checkPatient();
