const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
    try {
        const orgs = await prisma.organization.findMany({
            where: { code: 'ST-PAULS' }
        });
        console.log('ST-PAULS Organizations:', JSON.stringify(orgs, null, 2));

        const admins = await prisma.user.findMany({
            where: { email: 'admin@hospital.test' }
        });
        console.log('Hospital Admin User:', JSON.stringify(admins, null, 2));

    } catch (err) {
        console.error('ERROR:', err.message);
    } finally {
        await prisma.$disconnect();
        await pool.end();
    }
}

main();
