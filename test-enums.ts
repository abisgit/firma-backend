import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    console.log('Testing OrganizationType.EDUCATION...');
    try {
        const result = await prisma.$queryRaw`SELECT enum_range(NULL::"OrganizationType");`;
        console.log('DB Enum values:', JSON.stringify(result, null, 2));
    } catch (err) {
        console.error('Error querying enum:', err);
    }
}

main().finally(() => prisma.$disconnect());
