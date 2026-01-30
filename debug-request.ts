import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    const id = 'ae0efebc-6c96-466f-9c9f-161dc5b7a3c0';
    console.log('Checking registration request:', id);
    const request = await prisma.registrationRequest.findUnique({ where: { id } });
    console.log('Request data:', JSON.stringify(request, null, 2));

    if (request) {
        const existingOrg = await prisma.organization.findUnique({ where: { code: request.orgCode } });
        console.log('Existing Org with code', request.orgCode, ':', existingOrg ? 'Found' : 'Not Found');

        const existingUser = await prisma.user.findUnique({ where: { email: request.officialEmail } });
        console.log('Existing User with email', request.officialEmail, ':', existingUser ? 'Found' : 'Not Found');
    }
}

main().finally(() => prisma.$disconnect());
