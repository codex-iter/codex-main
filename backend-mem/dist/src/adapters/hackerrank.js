import { z } from 'zod';
import { config } from '../config.js';
import { requestJson } from '../utils/http.js';
import { withAdapterLogging } from '../utils/logger.js';
const hackerrankBaseSchema = z.object({
    status: z.string().optional(),
    username: z.string().optional(),
    submissionCalendar: z.record(z.number()).optional(),
    dailyContributions: z.array(z.object({
        date: z.string().optional(),
        count: z.number().optional(),
    }).passthrough()).default([]),
    data: z.object({
        totalSolved: z.number().optional(),
        totalActiveDays: z.number().optional(),
    }).passthrough().optional(),
}).passthrough();
export class HackerRankAdapter {
    platform = 'HACKERRANK';
    parseSummary(payload) {
        const parsed = hackerrankBaseSchema.safeParse(payload);
        if (!parsed.success) {
            return {};
        }
        const submissionCalendar = parsed.data.submissionCalendar ?? {};
        return { username: parsed.data.username, submissionCalendar: Object.fromEntries(Object.entries(submissionCalendar).map(([key, value]) => [key, Number(value)])) };
    }
    parseDaily(payload) {
        const parsed = hackerrankBaseSchema.safeParse(payload);
        if (!parsed.success) {
            return [];
        }
        const entries = parsed.data.submissionCalendar ?? {};
        return Object.entries(entries)
            .filter(([, count]) => Number(count) > 0)
            .map(([date, count]) => ({ date, count: Number(count) }));
    }
    async validateUsername(username) {
        return withAdapterLogging(this.platform, username, 'validateUsername', async () => {
            const url = `${config.hackerrankApiBase}/${encodeURIComponent(username)}`;
            const payload = await requestJson(url);
            const parsed = this.parseSummary(payload);
            if (!parsed.username) {
                return { valid: false, reason: 'HackerRank profile was not found' };
            }
            return { valid: parsed.username.toLowerCase() === username.toLowerCase() };
        });
    }
    async fetchActivity(username) {
        return withAdapterLogging(this.platform, username, 'fetchActivity', async () => {
            const baseUrl = `${config.hackerrankApiBase}/${encodeURIComponent(username)}`;
            const payload = await requestJson(baseUrl);
            const daily = this.parseDaily(payload);
            return { problems: [], daily };
        });
    }
}
