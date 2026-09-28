import cron from 'node-cron';
import { config } from '../config.js';
import { syncAll } from '../services/sync.js';
export function startScheduler(prisma) {
    const schedule = config.cronSchedule;
    return cron.schedule(schedule, async () => {
        await syncAll(prisma);
    }, {
        timezone: 'Asia/Kolkata',
    });
}
