import { PrismaClient } from '@prisma/client';
import { config } from '../config.js';
import { syncAll } from '../services/sync.js';
async function main() {
    const prisma = new PrismaClient({ datasourceUrl: config.databaseUrl });
    try {
        const result = await syncAll(prisma);
        console.log(JSON.stringify(result, null, 2));
    }
    finally {
        await prisma.$disconnect();
    }
}
void main();
