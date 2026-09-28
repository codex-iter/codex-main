import { z } from 'zod';
import { config } from '../config.js';
import { requestJson } from '../utils/http.js';
import { withAdapterLogging } from '../utils/logger.js';
const gfgProfileSchema = z.object({
    userName: z.string().optional(),
    username: z.string().optional(),
    status: z.string().optional(),
}).passthrough();
const gfgProblemSchema = z.object({
    question: z.string().optional(),
    questionUrl: z.string().optional(),
    difficulty: z.string().optional(),
    slug: z.string().optional(),
}).passthrough();
const gfgSolvedProblemsSchema = z.object({
    userName: z.string().optional(),
    username: z.string().optional(),
    problems: z.array(gfgProblemSchema).default([]),
    status: z.string().optional(),
}).passthrough();
export class GFGAdapter {
    platform = 'GFG';
    parseProfile(payload) {
        const parsed = gfgProfileSchema.safeParse(payload);
        if (!parsed.success) {
            return {};
        }
        return { username: parsed.data.userName ?? parsed.data.username };
    }
    parseProblems(payload) {
        const parsed = gfgSolvedProblemsSchema.safeParse(payload);
        if (!parsed.success) {
            return [];
        }
        return parsed.data.problems;
    }
    async validateUsername(username) {
        return withAdapterLogging(this.platform, username, 'validateUsername', async () => {
            const baseUrl = `${config.gfgApiBase}/${encodeURIComponent(username)}`;
            const payload = await requestJson(baseUrl);
            const parsed = this.parseProfile(payload);
            if (!parsed.username) {
                return { valid: false, reason: 'GFG profile was not found' };
            }
            return { valid: parsed.username.toLowerCase() === username.toLowerCase() };
        });
    }
    async fetchActivity(username) {
        return withAdapterLogging(this.platform, username, 'fetchActivity', async () => {
            const url = `${config.gfgApiBase}/${encodeURIComponent(username)}/solved-problems`;
            const payload = await requestJson(url);
            const problems = this.parseProblems(payload);
            const normalized = problems.map((problem) => ({
                problemId: problem.slug ?? `${problem.question ?? username}-${problem.questionUrl ?? 'gfg'}`,
                title: problem.question ?? 'Unknown GFG problem',
                difficulty: problem.difficulty ?? null,
                tags: [],
                solvedAt: new Date().toISOString(),
                url: problem.questionUrl ?? `https://www.geeksforgeeks.org/problems/${problem.slug ?? ''}`,
            }));
            return { problems: normalized, daily: [] };
        });
    }
}
