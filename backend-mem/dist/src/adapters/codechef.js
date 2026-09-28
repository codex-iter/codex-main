import { z } from 'zod';
import { config } from '../config.js';
import { requestJson } from '../utils/http.js';
import { withAdapterLogging } from '../utils/logger.js';
const codechefProfileSchema = z.object({
    success: z.boolean().optional(),
    status: z.number().optional(),
    handle: z.string().optional(),
    username: z.string().optional(),
    data: z.object({
        username: z.string().optional(),
        displayName: z.string().optional(),
    }).passthrough().optional(),
}).passthrough();
const codechefHeatmapSchema = z.object({
    success: z.boolean().optional(),
    heatMap: z.array(z.object({
        date: z.string().optional(),
        count: z.number().optional(),
        submissions: z.number().optional(),
    }).passthrough()).default([]),
}).passthrough();
const codechefRatingSchema = z.object({
    success: z.boolean().optional(),
    data: z.object({
        current: z.any().optional(),
        max: z.any().optional(),
        history: z.array(z.any()).default([]),
    }).passthrough().optional(),
}).passthrough();
export class CodeChefAdapter {
    platform = 'CODECHEF';
    parseProfile(payload) {
        const parsed = codechefProfileSchema.safeParse(payload);
        if (!parsed.success) {
            return {};
        }
        const username = parsed.data.handle ?? parsed.data.username ?? parsed.data.data?.username;
        return { username };
    }
    parseHeatmap(payload) {
        const parsed = codechefHeatmapSchema.safeParse(payload);
        if (!parsed.success) {
            return [];
        }
        return parsed.data.heatMap.flatMap((entry) => {
            const date = typeof entry.date === 'string' ? entry.date : typeof entry['day'] === 'string' ? entry['day'] : null;
            const count = Number(entry.count ?? entry.submissions ?? entry['value'] ?? 0);
            if (!date || Number.isNaN(count) || count <= 0) {
                return [];
            }
            return [{ date: String(date), count }];
        });
    }
    parseRating(payload) {
        const parsed = codechefRatingSchema.safeParse(payload);
        if (!parsed.success || !parsed.data.data) {
            return {};
        }
        return {
            current: parsed.data.data.current,
            max: parsed.data.data.max,
        };
    }
    async validateUsername(username) {
        return withAdapterLogging(this.platform, username, 'validateUsername', async () => {
            const profileUrl = `${config.codechefApiBase}/profile/${encodeURIComponent(username)}`;
            const payload = await requestJson(profileUrl);
            const parsed = this.parseProfile(payload);
            if (!parsed.username) {
                return { valid: false, reason: 'CodeChef profile was not found or is private' };
            }
            return { valid: parsed.username.toLowerCase() === username.toLowerCase() };
        });
    }
    async fetchActivity(username) {
        return withAdapterLogging(this.platform, username, 'fetchActivity', async () => {
            const [profile, heatmap, rating] = await Promise.all([
                requestJson(`${config.codechefApiBase}/profile/${encodeURIComponent(username)}`),
                requestJson(`${config.codechefApiBase}/heatmap/${encodeURIComponent(username)}?view=last_365`),
                requestJson(`${config.codechefApiBase}/rating/${encodeURIComponent(username)}`),
            ]);
            this.parseProfile(profile);
            const daily = this.parseHeatmap(heatmap);
            this.parseRating(rating);
            return { problems: [], daily };
        });
    }
}
