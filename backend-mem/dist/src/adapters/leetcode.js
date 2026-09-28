import { z } from 'zod';
import { config } from '../config.js';
import { requestJson } from '../utils/http.js';
import { withAdapterLogging } from '../utils/logger.js';
const userSchema = z.object({
    username: z.string().optional(),
    error: z.string().optional(),
}).passthrough();
const solvedSchema = z.object({
    username: z.string().optional(),
    total_solved: z.number().optional(),
    solved_slugs: z.array(z.string()).default([]),
    solved: z.array(z.object({
        title: z.string().optional(),
        titleSlug: z.string().optional(),
        difficulty: z.string().optional(),
        timestamp: z.number().optional(),
        url: z.string().optional(),
        topicTags: z.array(z.object({ name: z.string().optional() }).passthrough()).default([]),
        tags: z.array(z.string()).default([]),
    }).passthrough()).default([]),
}).passthrough();
const submissionsArraySchema = z.array(z.object({
    title: z.string().optional(),
    titleSlug: z.string().optional(),
    difficulty: z.string().optional(),
    timestamp: z.number().optional(),
    url: z.string().optional(),
    topicTags: z.array(z.object({ name: z.string().optional() }).passthrough()).default([]),
    tags: z.array(z.string()).default([]),
}).passthrough()).default([]);
const calendarSchema = z.object({
    activeYears: z.array(z.number()).default([]),
    streak: z.number().int().default(0),
    totalActiveDays: z.number().int().default(0),
    dccBadges: z.array(z.unknown()).default([]),
    submissionCalendar: z.record(z.number()).default({}),
}).passthrough();
export class LeetCodeAdapter {
    platform = 'LEETCODE';
    parseUser(payload) {
        const parsed = userSchema.safeParse(payload);
        if (!parsed.success) {
            return {};
        }
        return { username: parsed.data.username };
    }
    parseSolved(payload) {
        const parsed = solvedSchema.safeParse(payload);
        if (!parsed.success) {
            return [];
        }
        return parsed.data.solved;
    }
    parseCalendar(payload) {
        const parsed = calendarSchema.safeParse(payload);
        if (!parsed.success) {
            return { activeYears: [], streak: 0, totalActiveDays: 0, submissionCalendar: {} };
        }
        return {
            activeYears: parsed.data.activeYears,
            streak: parsed.data.streak,
            totalActiveDays: parsed.data.totalActiveDays,
            submissionCalendar: Object.fromEntries(Object.entries(parsed.data.submissionCalendar).map(([key, value]) => [key, Number(value)])),
        };
    }
    async validateUsername(username) {
        return withAdapterLogging(this.platform, username, 'validateUsername', async () => {
            const url = `${config.leetCodeApiBase}/user/${encodeURIComponent(username)}`;
            const payload = await requestJson(url);
            const parsed = this.parseUser(payload);
            if (!parsed.username) {
                return { valid: false, reason: 'LeetCode profile was not found or is private' };
            }
            return { valid: parsed.username.toLowerCase() === username.toLowerCase() };
        });
    }
    async fetchActivity(username) {
        return withAdapterLogging(this.platform, username, 'fetchActivity', async () => {
            const userUrl = `${config.leetCodeApiBase}/user/${encodeURIComponent(username)}`;
            const solvedUrl = `${config.leetCodeApiBase}/user/${encodeURIComponent(username)}/solved`;
            const submissionsUrl = `${config.leetCodeApiBase}/user/${encodeURIComponent(username)}/submissions`;
            const calendarUrl = `${config.leetCodeApiBase}/user/${encodeURIComponent(username)}/calendar`;
            const [userPayload, solvedPayload, submissionsPayload, calendarPayload] = await Promise.all([
                requestJson(userUrl),
                requestJson(solvedUrl),
                requestJson(submissionsUrl),
                requestJson(calendarUrl),
            ]);
            const parsedSolved = this.parseSolved(solvedPayload);
            const parsedSubmissions = submissionsArraySchema.safeParse(submissionsPayload);
            const merged = [...parsedSolved, ...(parsedSubmissions.success ? parsedSubmissions.data : [])];
            const deduped = new Map();
            for (const entry of merged) {
                const problemId = entry.titleSlug ?? entry.title ?? 'unknown';
                const normalized = {
                    problemId,
                    title: entry.title ?? problemId,
                    difficulty: entry.difficulty ?? null,
                    tags: [
                        ...(entry.topicTags ?? []).map((tag) => tag.name ?? '').filter(Boolean),
                        ...(entry.tags ?? []).filter(Boolean),
                    ],
                    solvedAt: new Date((Number(entry.timestamp ?? 0) || Date.now()) * 1000).toISOString(),
                    url: entry.url ?? `https://leetcode.com/problems/${problemId}/`,
                };
                const current = deduped.get(problemId);
                if (!current || new Date(normalized.solvedAt).getTime() < new Date(current.solvedAt).getTime()) {
                    deduped.set(problemId, normalized);
                }
            }
            const calendar = this.parseCalendar(calendarPayload);
            const daily = Object.entries(calendar.submissionCalendar).map(([date, count]) => ({
                date,
                count: Number(count),
            }));
            return {
                problems: Array.from(deduped.values()),
                daily,
            };
        });
    }
}
