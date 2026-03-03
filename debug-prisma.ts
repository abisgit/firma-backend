import prisma from './src/config/db';
console.log(Object.keys(prisma).filter(k => !k.startsWith('_')));
process.exit(0);
