import { z } from 'zod';
import { config } from '../config.js';
import { requestJson } from '../utils/http.js';
import { withAdapterLogging } from '../utils/logger.js';
const codeforcesUserInfoSchema = z.object({
    status: z.string(),
    result: z.array(z.object({
        handle: z.string(),
    }).passthrough()),
}).passthrough();
const codeforcesStatusItemSchema = z.object({
    contestId: z.number().optional(),
    creationTimeSeconds: z.number().optional(),
    problem: z.object({
        contestId: z.number().optional(),
        index: z.string().optional(),
        name: z.string().optional(),
        rating: z.number().optional(),
        tags: z.array(z.string()).optional(),
    }).passthrough(),
    verdict: z.string().optional(),
}).passthrough();
const codeforcesStatusSchema = z.object({
    status: z.string(),
    result: z.array(codeforcesStatusItemSchema),
}).passthrough();
export class CodeforcesAdapter {
    platform = 'CODEFORCES';
    parseUserInfo(payload) {
        const parsed = codeforcesUserInfoSchema.safeParse(payload);
        if (!parsed.success) {
            return [];
        }
        return parsed.data.result.map((entry) => entry.handle);
    }
    parseStatus(payload) {
        const parsed = codeforcesStatusSchema.safeParse(payload);
        if (!parsed.success) {
            return [];
        }
        return parsed.data.result;
    }
    async validateUsername(username) {
        return withAdapterLogging(this.platform, username, 'validateUsername', async () => {
            const url = `${config.codeforcesApiBase}/user.info?handles=${encodeURIComponent(username)}`;
            const payload = await requestJson(url);
            const handles = this.parseUserInfo(payload);
            if (handles.length === 0) {
                return { valid: false, reason: 'username not found on Codeforces' };
            }
            return { valid: handles.some((handle) => handle.toLowerCase() === username.toLowerCase()) };
        });
    }
    async fetchActivity(username) {
        return withAdapterLogging(this.platform, username, 'fetchActivity', async () => {
            const url = `${config.codeforcesApiBase}/user.status?handle=${encodeURIComponent(username)}`;
            const payload = await requestJson(url);
            const entries = this.parseStatus(payload).filter((entry) => entry.verdict === 'OK');
            const deduped = new Map();
            for (const entry of entries) {
                const problem = entry.problem;
                const contestId = problem?.contestId ?? entry.contestId;
                const problemIndex = problem?.index;
                if (typeof contestId !== 'number' || typeof problemIndex !== 'string') {
                    continue;
                }
                const key = `${contestId}:${problemIndex}`;
                const acceptedAt = new Date((entry.creationTimeSeconds ?? 0) * 1000).toISOString();
                const candidate = {
                    problemId: key,
                    title: problem?.name ?? `${contestId}-${problemIndex}`,
                    difficulty: this.convertDifficulty(problem?.rating),
                    tags: problem?.tags ?? [],
                    solvedAt: acceptedAt,
                    url: `https://codeforces.com/problemset/problem/${contestId}/${problemIndex}`,
                };
                const current = deduped.get(key);
                if (!current || new Date(candidate.solvedAt).getTime() < new Date(current.solvedAt).getTime()) {
                    deduped.set(key, candidate);
                }
            }
            return {
                problems: Array.from(deduped.values()),
                daily: [],
            };
        });
    }
    convertDifficulty(rating) {
        if (typeof rating !== 'number') {
            return null;
        }
        if (rating >= 2600) {
            return 'Hard';
        }
        if (rating >= 2000) {
            return 'Medium';
        }
        if (rating >= 1400) {
            return 'Easy';
        }
        return null;
    }
}
