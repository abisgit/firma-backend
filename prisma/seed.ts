import "dotenv/config";
import { PrismaClient, Role, OrganizationType } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import bcrypt from 'bcrypt';

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
    const passwordHash = await bcrypt.hash('admin123', 10);

    // Create a Ministry
    const mof = await prisma.organization.upsert({
        where: { code: 'MOF' },
        update: {},
        create: {
            name: 'Ministry of Finance',
            code: 'MOF',
            type: OrganizationType.MINISTRY,
        },
    });

    // Create Super Admin
    await prisma.user.upsert({
        where: { email: 'admin@firma.gov' },
        update: {},
        create: {
            fullName: 'System Super Admin',
            email: 'admin@firma.gov',
            passwordHash,
            role: Role.SUPER_ADMIN,
        },
    });

    // Create Org Admin for MOF
    await prisma.user.upsert({
        where: { email: 'mof_admin@firma.gov' },
        update: {},
        create: {
            fullName: 'MOF Administrator',
            email: 'mof_admin@firma.gov',
            passwordHash,
            role: Role.ORG_ADMIN,
            organizationId: mof.id,
        },
    });

    console.log('✅ Seed data created successfully');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
        await pool.end();
    });
