import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    console.log('Seeding banks...');

    const bankData = [
        { name: 'Commercial Bank of Ethiopia (CBE)', accountNumber: '1000123456789' },
        { name: 'Awash Bank', accountNumber: '251100001234' },
        { name: 'Dashen Bank', accountNumber: '543210000987' },
        { name: 'Bank of Abyssinia', accountNumber: '888877770000' },
        { name: 'Wegagen Bank', accountNumber: '111122223333' },
        { name: 'Hibret Bank', accountNumber: '444455556666' },
        { name: 'Nib International Bank', accountNumber: '777788889999' },
        { name: 'Zemen Bank', accountNumber: '999900001111' }
    ];

    for (const data of bankData) {
        const existing = await prisma.bank.findFirst({
            where: { name: data.name }
        });

        if (!existing) {
            await prisma.bank.create({
                data: {
                    name: data.name,
                    accountNumber: data.accountNumber,
                    isActive: true
                }
            });
            console.log(`Created bank: ${data.name}`);
        } else {
            console.log(`Bank already exists: ${data.name}`);
        }
    }

    console.log('Banks seeding finished');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
