import express from 'express';
import { PrismaClient } from '@prisma/client';
import { config } from './config.js';
import { createApiRouter } from './routes/public.js';
import { startScheduler } from './scheduler/cron.js';
const prisma = new PrismaClient({ datasourceUrl: config.databaseUrl });
const app = express();
app.use(express.json({ limit: '1mb' }));
app.use(createApiRouter(prisma));
startScheduler(prisma);
app.listen(config.port, () => {
    console.log(`Backend running on http://localhost:${config.port}`);
});
