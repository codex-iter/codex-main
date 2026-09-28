import { z } from 'zod';
import { config } from '../config.js';
import { requestJson } from '../utils/http.js';
import { withAdapterLogging } from '../utils/logger.js';
const githubContributionSchema = z.object({
    date: z.string().optional(),
    contributionCount: z.number().optional(),
}).passthrough();
const githubWeeksSchema = z.object({
    contributionDays: z.array(githubContributionSchema).default([]),
}).passthrough();
const githubCalendarSchema = z.object({
    totalContributions: z.number().optional(),
    weeks: z.array(githubWeeksSchema).default([]),
}).passthrough();
const githubUserSchema = z.object({
    login: z.string().optional(),
    contributionsCollection: z.object({
        contributionCalendar: githubCalendarSchema.optional(),
    }).passthrough().optional(),
}).passthrough();
const githubGraphqlSchema = z.object({
    data: z.object({
        user: githubUserSchema.nullable().optional(),
    }).passthrough(),
}).passthrough();
export class GitHubAdapter {
    platform = 'GITHUB';
    parseCalendar(payload) {
        const parsed = githubGraphqlSchema.safeParse(payload);
        if (!parsed.success || !parsed.data.data?.user?.contributionsCollection?.contributionCalendar) {
            return [];
        }
        const calendar = parsed.data.data.user.contributionsCollection.contributionCalendar;
        const daily = calendar.weeks.flatMap((week) => week.contributionDays.flatMap((day) => {
            const count = Number(day.contributionCount ?? 0);
            if (!day.date || count <= 0) {
                return [];
            }
            return [{ date: day.date, count }];
        }));
        return daily;
    }
    async validateUsername(username) {
        return withAdapterLogging(this.platform, username, 'validateUsername', async () => {
            if (!config.githubToken) {
                return { valid: false, reason: 'GITHUB_TOKEN is missing; GitHub contribution sync cannot run without an authenticated token' };
            }
            const url = 'https://api.github.com/graphql';
            const payload = await requestJson(url, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${config.githubToken}`,
                    'Content-Type': 'application/json',
                },
                data: {
                    query: `query($login:String!) { user(login:$login){ login } }`,
                    variables: { login: username },
                },
            });
            const parsed = githubGraphqlSchema.safeParse(payload);
            if (!parsed.success || !parsed.data.data?.user?.login) {
                return { valid: false, reason: 'GitHub username not found or token is invalid' };
            }
            return { valid: parsed.data.data.user.login.toLowerCase() === username.toLowerCase() };
        });
    }
    async fetchActivity(username) {
        return withAdapterLogging(this.platform, username, 'fetchActivity', async () => {
            if (!config.githubToken) {
                throw new Error('GITHUB_TOKEN is missing; GitHub contribution sync cannot fetch data without an authenticated token');
            }
            const url = 'https://api.github.com/graphql';
            const payload = await requestJson(url, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${config.githubToken}`,
                    'Content-Type': 'application/json',
                },
                data: {
                    query: `query($login:String!) { user(login:$login){ contributionsCollection { contributionCalendar { totalContributions weeks { contributionDays { date contributionCount } } } } } }`,
                    variables: { login: username },
                },
            });
            return { problems: [], daily: this.parseCalendar(payload) };
        });
    }
}
