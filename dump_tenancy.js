const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
    try {
        console.log('--- ALL PATIENTS ---');
        const patients = await prisma.patient.findMany({
            select: {
                id: true,
                patientId: true,
                fullName: true,
                organizationId: true,
                organization: {
                    select: { name: true }
                }
            }
        });
        console.log(JSON.stringify(patients, null, 2));

        console.log('--- ALL USERS ---');
        const users = await prisma.user.findMany({
            select: {
                email: true,
                organizationId: true,
                organization: {
                    select: { name: true }
                }
            }
        });
        console.log(JSON.stringify(users, null, 2));

    } catch (err) {
        console.error('ERROR:', err.message);
    } finally {
        await prisma.$disconnect();
        await pool.end();
    }
}

main();
