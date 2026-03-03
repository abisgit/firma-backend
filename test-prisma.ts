import prisma from './src/config/db';
console.log(Object.keys(prisma).filter(k => k.toLowerCase().includes('payment')));
process.exit(0);
