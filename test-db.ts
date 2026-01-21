import "dotenv/config";
import { PrismaClient } from '@prisma/client';

async function test() {
    const url = process.env.DATABASE_URL;
    console.log("DATABASE_URL:", url);

    const prisma = new PrismaClient({
        datasources: {
            db: {
                url: url
            }
        }
    });

    try {
        await prisma.$connect();
        console.log("Connected successfully");
    } catch (err: any) {
        console.error("Connection failed:", err.message || err);
    } finally {
        await prisma.$disconnect();
    }
}

test();
