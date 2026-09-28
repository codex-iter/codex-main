import cors from 'cors';
import express from 'express';
import { z } from 'zod';
import { getAdapter } from '../adapters/registry.js';
import { config } from '../config.js';
import { syncAll, syncMember } from '../services/sync.js';
import { buildCollectiveCalendar, buildCollectiveDay, buildSummary, monthDateList } from '../services/aggregation.js';
import { monthRange } from '../utils/time.js';
const platformEnum = z.enum(['CODEFORCES', 'LEETCODE', 'GFG', 'CODECHEF', 'HACKERRANK', 'GITHUB']);
const platformParamSchema = z.preprocess((value) => (typeof value === 'string' && value.trim() === '' ? undefined : value), platformEnum.optional());
const monthParamSchema = z.string().regex(/^\d{4}-\d{2}$/);
const dateParamSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
function buildError(code, message, details) {
    return {
        error: {
            code,
            message,
            ...(details ? { details } : {}),
        },
    };
}
function parseQuery(schema, req) {
    const result = schema.safeParse(req.query);
    if (!result.success) {
        return null;
    }
    return result.data;
}
function parseBody(schema, req) {
    const result = schema.safeParse(req.body);
    if (!result.success) {
        return null;
    }
    return result.data;
}
const rateLimitWindowMs = Number(process.env.RATE_LIMIT_WINDOW_MS ?? '60000');
const rateLimitMaxRequests = Number(process.env.RATE_LIMIT_MAX_REQUESTS ?? '5');
const clientAttempts = new Map();
function rateLimit(req, res, next) {
    const ip = req.ip ?? req.headers['x-forwarded-for']?.toString() ?? 'local';
    const now = Date.now();
    const current = clientAttempts.get(ip);
    if (!current || current.resetAt <= now) {
        clientAttempts.set(ip, { count: 1, resetAt: now + rateLimitWindowMs });
        next();
        return;
    }
    if (current.count >= rateLimitMaxRequests) {
        res.status(429).json(buildError('RATE_LIMITED', 'Too many join attempts. Please try again later.'));
        return;
    }
    current.count += 1;
    clientAttempts.set(ip, current);
    next();
}
function ensureAdmin(req, res, next) {
    const header = req.headers['x-admin-key'];
    if (header !== config.adminKey) {
        res.status(401).json(buildError('UNAUTHORIZED', 'Missing or invalid x-admin-key header.'));
        return;
    }
    next();
}
function publicCache(_req, res, next) {
    if (_req.method === 'GET' && !_req.path.startsWith('/admin') && !_req.path.startsWith('/docs') && !_req.path.startsWith('/openapi')) {
        res.setHeader('Cache-Control', 'public, max-age=300, s-maxage=300');
    }
    next();
}
function parseMemberPlatforms(input) {
    if (!Array.isArray(input)) {
        return [];
    }
    return input
        .map((entry) => {
        if (typeof entry !== 'object' || entry === null) {
            return null;
        }
        const candidate = entry;
        const platform = candidate.platform;
        const username = candidate.username;
        if (typeof platform !== 'string' || typeof username !== 'string') {
            return null;
        }
        return { platform: platform, username: username.trim() };
    })
        .filter((entry) => entry !== null);
}
export function createApiRouter(prisma) {
    const router = express.Router();
    router.use(cors({
        origin: (origin, callback) => {
            if (!origin) {
                callback(null, true);
                return;
            }
            const allowedOrigins = (config.frontendOrigin ?? 'http://localhost:5173')
                .split(',')
                .map((entry) => entry.trim())
                .filter(Boolean);
            if (allowedOrigins.includes(origin)) {
                callback(null, true);
                return;
            }
            callback(new Error('Not allowed by CORS'));
        },
        credentials: true,
    }));
    router.use(publicCache);
    router.get('/health', (_req, res) => {
        res.json({ ok: true, env: config.nodeEnv });
    });
    router.get('/members', async (_req, res) => {
        const members = await prisma.member.findMany({
            where: { isActive: true },
            orderBy: [{ displayName: 'asc' }, { joinedAt: 'asc' }],
            select: {
                id: true,
                slug: true,
                displayName: true,
                isActive: true,
                joinedAt: true,
            },
        });
        res.json({ members });
    });
    router.get('/members/:slug/stats', async (req, res) => {
        const parsedMonth = monthParamSchema.safeParse(req.query.month);
        if (!parsedMonth.success) {
            res.status(400).json(buildError('INVALID_QUERY', 'The month query must be in YYYY-MM format.'));
            return;
        }
        const member = await prisma.member.findUnique({
            where: { slug: req.params.slug },
            select: { id: true, slug: true, displayName: true, isActive: true, joinedAt: true },
        });
        if (!member) {
            res.status(404).json(buildError('NOT_FOUND', 'Member not found.'));
            return;
        }
        const month = parsedMonth.data;
        const { start, end } = monthRange(month);
        const rows = await prisma.dailyActivity.findMany({
            where: {
                memberId: member.id,
                date: {
                    gte: new Date(`${start}T00:00:00Z`),
                    lte: new Date(`${end}T23:59:59Z`),
                },
                kind: { in: ['problems', 'submissions'] },
            },
            orderBy: { date: 'asc' },
        });
        const problemRows = await prisma.solvedProblem.findMany({
            where: {
                memberId: member.id,
                solvedDate: {
                    gte: new Date(`${start}T00:00:00Z`),
                    lte: new Date(`${end}T23:59:59Z`),
                },
            },
            orderBy: { solvedAt: 'desc' },
        });
        const dailyCounts = monthDateList(month).map((date) => ({
            date,
            count: rows.filter((row) => row.date.toISOString().slice(0, 10) === date).reduce((sum, row) => sum + row.count, 0),
        }));
        const platformBreakdown = rows.reduce((acc, row) => {
            acc[row.platform] = (acc[row.platform] ?? 0) + row.count;
            return acc;
        }, {});
        const difficultyCounts = {
            easy: problemRows.filter((row) => row.difficulty === 'Easy').length,
            medium: problemRows.filter((row) => row.difficulty === 'Medium').length,
            hard: problemRows.filter((row) => row.difficulty === 'Hard').length,
        };
        const difficultyAvailable = problemRows.some((row) => typeof row.difficulty === 'string');
        const activeDays = dailyCounts.filter((day) => day.count > 0).length;
        const streakDates = dailyCounts.filter((day) => day.count > 0).map((day) => day.date);
        const streaks = (() => {
            const unique = [...new Set(streakDates)];
            let longest = 0;
            let current = 0;
            let run = 0;
            let previous = null;
            for (const date of unique) {
                if (previous && Number(new Date(`${date}T00:00:00Z`).getTime() - new Date(`${previous}T00:00:00Z`).getTime()) / 86400000 === 1) {
                    run += 1;
                }
                else {
                    run = 1;
                }
                longest = Math.max(longest, run);
                previous = date;
            }
            let cursor = new Date(`${unique[unique.length - 1] ?? monthRange(month).end}T00:00:00Z`);
            const activeSet = new Set(unique);
            while (activeSet.has(new Date(cursor.getTime()).toISOString().slice(0, 10))) {
                current += 1;
                cursor.setUTCDate(cursor.getUTCDate() - 1);
            }
            return { current, longest };
        })();
        res.json({
            member: {
                id: member.id,
                slug: member.slug,
                displayName: member.displayName,
                isActive: member.isActive,
                joinedAt: member.joinedAt,
            },
            month,
            daily: dailyCounts,
            totalProblems: dailyCounts.reduce((sum, day) => sum + day.count, 0),
            activeDays,
            platformBreakdown,
            difficultyBreakdown: difficultyAvailable ? difficultyCounts : null,
            streaks,
        });
    });
    router.get('/members/:slug/problems', async (req, res) => {
        const monthResult = monthParamSchema.safeParse(req.query.month);
        if (!monthResult.success) {
            res.status(400).json(buildError('INVALID_QUERY', 'The month query must be in YYYY-MM format.'));
            return;
        }
        const platformResult = platformParamSchema.safeParse(req.query.platform);
        if (!platformResult.success) {
            res.status(400).json(buildError('INVALID_QUERY', 'The platform value is invalid.'));
            return;
        }
        const difficulty = typeof req.query.difficulty === 'string' ? req.query.difficulty.trim() : undefined;
        const member = await prisma.member.findUnique({
            where: { slug: req.params.slug },
            select: { id: true },
        });
        if (!member) {
            res.status(404).json(buildError('NOT_FOUND', 'Member not found.'));
            return;
        }
        const month = monthResult.data;
        const { start, end } = monthRange(month);
        const problems = await prisma.solvedProblem.findMany({
            where: {
                memberId: member.id,
                solvedDate: {
                    gte: new Date(`${start}T00:00:00Z`),
                    lte: new Date(`${end}T23:59:59Z`),
                },
                ...(platformResult.data ? { platform: platformResult.data } : {}),
                ...(difficulty ? { difficulty } : {}),
            },
            orderBy: { solvedAt: 'desc' },
        });
        res.json({
            month,
            problems: problems.map((problem) => ({
                id: problem.id,
                platform: problem.platform,
                title: problem.title,
                difficulty: problem.difficulty,
                tags: problem.tags,
                solvedAt: problem.solvedAt,
                solvedDate: problem.solvedDate,
                url: problem.url,
                dateSource: problem.dateSource,
            })),
        });
    });
    router.get('/collective/calendar', async (req, res) => {
        const monthResult = monthParamSchema.safeParse(req.query.month);
        if (!monthResult.success) {
            res.status(400).json(buildError('INVALID_QUERY', 'The month query must be in YYYY-MM format.'));
            return;
        }
        const platformResult = platformParamSchema.safeParse(req.query.platform);
        if (!platformResult.success) {
            res.status(400).json(buildError('INVALID_QUERY', 'The platform value is invalid.'));
            return;
        }
        const includeContributions = req.query.includeContributions === 'true';
        const month = monthResult.data;
        const { start, end } = monthRange(month);
        const rows = await prisma.dailyActivity.findMany({
            where: {
                date: {
                    gte: new Date(`${start}T00:00:00Z`),
                    lte: new Date(`${end}T23:59:59Z`),
                },
                ...(platformResult.data ? { platform: platformResult.data } : {}),
                kind: { in: includeContributions ? ['problems', 'submissions', 'contributions'] : ['problems', 'submissions'] },
            },
        });
        const calendar = buildCollectiveCalendar(month, rows.map((row) => ({
            memberId: row.memberId,
            platform: row.platform,
            date: row.date,
            count: row.count,
            kind: row.kind,
        })), platformResult.data, includeContributions);
        res.json({ month, calendar });
    });
    router.get('/collective/day', async (req, res) => {
        const dateResult = dateParamSchema.safeParse(req.query.date);
        if (!dateResult.success) {
            res.status(400).json(buildError('INVALID_QUERY', 'The date query must be in YYYY-MM-DD format.'));
            return;
        }
        const date = dateResult.data;
        const rows = await prisma.dailyActivity.findMany({
            where: {
                date: new Date(`${date}T00:00:00Z`),
                kind: { in: ['problems', 'submissions', 'contributions'] },
            },
            orderBy: { memberId: 'asc' },
        });
        const memberIds = [...new Set(rows.map((row) => row.memberId))];
        const members = await prisma.member.findMany({
            where: { id: { in: memberIds } },
            select: { id: true, slug: true, displayName: true },
        });
        const memberMap = new Map(members.map((member) => [member.id, member]));
        const problemRows = await prisma.solvedProblem.findMany({
            where: {
                solvedDate: new Date(`${date}T00:00:00Z`),
                memberId: { in: memberIds },
            },
        });
        const result = buildCollectiveDay(date, rows.map((row) => ({
            memberId: row.memberId,
            platform: row.platform,
            date: row.date,
            count: row.count,
            kind: row.kind,
        })), problemRows.map((problem) => ({
            memberId: problem.memberId,
            platform: problem.platform,
            title: problem.title,
            difficulty: problem.difficulty,
            url: problem.url,
            solvedDate: problem.solvedDate,
        })));
        const hydratedMembers = result.members.map((member) => ({
            ...member,
            slug: memberMap.get(member.memberId)?.slug ?? '',
            displayName: memberMap.get(member.memberId)?.displayName ?? 'Unknown member',
        }));
        res.json({ date, members: hydratedMembers });
    });
    router.get('/collective/summary', async (req, res) => {
        const monthResult = monthParamSchema.safeParse(req.query.month);
        if (!monthResult.success) {
            res.status(400).json(buildError('INVALID_QUERY', 'The month query must be in YYYY-MM format.'));
            return;
        }
        const month = monthResult.data;
        const { start, end } = monthRange(month);
        const rows = await prisma.dailyActivity.findMany({
            where: {
                date: {
                    gte: new Date(`${start}T00:00:00Z`),
                    lte: new Date(`${end}T23:59:59Z`),
                },
                kind: { in: ['problems', 'submissions'] },
            },
        });
        const summary = buildSummary(month, rows.map((row) => ({
            memberId: row.memberId,
            platform: row.platform,
            date: row.date,
            count: row.count,
            kind: row.kind,
        })));
        res.json(summary);
    });
    router.get('/leaderboard', async (req, res) => {
        const monthResult = monthParamSchema.safeParse(req.query.month);
        if (!monthResult.success) {
            res.status(400).json(buildError('INVALID_QUERY', 'The month query must be in YYYY-MM format.'));
            return;
        }
        const platformResult = platformParamSchema.safeParse(req.query.platform);
        if (!platformResult.success) {
            res.status(400).json(buildError('INVALID_QUERY', 'The platform value is invalid.'));
            return;
        }
        const month = monthResult.data;
        const { start, end } = monthRange(month);
        const rows = await prisma.dailyActivity.findMany({
            where: {
                date: {
                    gte: new Date(`${start}T00:00:00Z`),
                    lte: new Date(`${end}T23:59:59Z`),
                },
                ...(platformResult.data ? { platform: platformResult.data } : {}),
                kind: { in: ['problems', 'submissions'] },
            },
        });
        const totals = new Map();
        for (const row of rows) {
            const existing = totals.get(row.memberId) ?? {
                memberId: row.memberId,
                totalProblems: 0,
                activeDays: new Set(),
                displayName: '',
                slug: '',
            };
            existing.totalProblems += row.count;
            if (row.count > 0) {
                existing.activeDays.add(row.date.toISOString().slice(0, 10));
            }
            totals.set(row.memberId, existing);
        }
        const memberIds = Array.from(totals.keys());
        const members = await prisma.member.findMany({
            where: { id: { in: memberIds } },
            select: { id: true, slug: true, displayName: true },
        });
        for (const member of members) {
            const current = totals.get(member.id);
            if (current) {
                current.displayName = member.displayName;
                current.slug = member.slug;
            }
        }
        const leaderboard = Array.from(totals.values())
            .map((entry) => ({
            rank: 0,
            memberId: entry.memberId,
            slug: entry.slug,
            displayName: entry.displayName,
            totalProblems: entry.totalProblems,
            activeDays: entry.activeDays.size,
        }))
            .sort((a, b) => b.totalProblems - a.totalProblems || b.activeDays - a.activeDays || a.displayName.localeCompare(b.displayName));
        leaderboard.forEach((entry, index) => {
            entry.rank = index + 1;
        });
        res.json({ month, leaderboard });
    });
    const memberCreateSchema = z.object({
        displayName: z.string().trim().min(2).max(100),
        platformAccounts: z.array(z.object({
            platform: platformEnum,
            username: z.string().trim().min(1),
        })).min(1).optional(),
        platforms: z.array(z.object({
            platform: platformEnum,
            username: z.string().trim().min(1),
        })).min(1).optional(),
    });
    router.post('/members', rateLimit, async (req, res) => {
        const parsedBody = parseBody(memberCreateSchema, req);
        if (!parsedBody) {
            res.status(400).json(buildError('INVALID_BODY', 'The request body is invalid. Provide displayName and at least one platform username.'));
            return;
        }
        const candidates = parseMemberPlatforms(parsedBody.platformAccounts ?? parsedBody.platforms ?? []);
        if (candidates.length === 0) {
            res.status(400).json(buildError('INVALID_BODY', 'At least one valid platform username is required.'));
            return;
        }
        const validationErrors = [];
        for (const candidate of candidates) {
            const adapter = getAdapter(candidate.platform);
            try {
                const validation = await adapter.validateUsername(candidate.username);
                if (!validation.valid) {
                    validationErrors.push({
                        platform: candidate.platform,
                        username: candidate.username,
                        message: validation.reason ?? 'The profile could not be validated.',
                    });
                }
            }
            catch (error) {
                validationErrors.push({
                    platform: candidate.platform,
                    username: candidate.username,
                    message: error instanceof Error ? error.message : 'The platform request failed while validating this username.',
                });
            }
        }
        if (validationErrors.length > 0) {
            res.status(400).json(buildError('INVALID_USERNAME', 'One or more usernames could not be validated.', validationErrors));
            return;
        }
        const slugSeed = parsedBody.displayName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60) || 'member';
        const existingSlugs = await prisma.member.findMany({
            where: { slug: { startsWith: slugSeed } },
            select: { slug: true },
        });
        const used = new Set(existingSlugs.map((entry) => entry.slug));
        let slug = slugSeed;
        let counter = 2;
        while (used.has(slug)) {
            slug = `${slugSeed}-${counter}`;
            counter += 1;
        }
        const member = await prisma.member.create({
            data: {
                slug,
                displayName: parsedBody.displayName,
                isActive: true,
            },
        });
        await Promise.all(candidates.map((candidate) => prisma.platformAccount.create({
            data: {
                memberId: member.id,
                platform: candidate.platform,
                username: candidate.username,
                baselineDone: false,
                lastSyncStatus: 'ok',
                lastError: null,
            },
        })));
        res.status(201).json({
            member: {
                id: member.id,
                slug: member.slug,
                displayName: member.displayName,
                isActive: member.isActive,
                joinedAt: member.joinedAt,
            },
            platformAccounts: candidates,
        });
    });
    router.get('/admin/members', ensureAdmin, async (_req, res) => {
        const members = await prisma.member.findMany({
            orderBy: { displayName: 'asc' },
            include: { platformAccounts: true },
        });
        res.json({
            members: members.map((member) => ({
                ...member,
                platformAccounts: member.platformAccounts.map((account) => ({
                    ...account,
                    health: account.consecutiveFailures >= 3 ? 'at-risk' : 'healthy',
                })),
            })),
        });
    });
    router.put('/admin/members/:id', ensureAdmin, async (req, res) => {
        const memberId = req.params.id;
        if (typeof memberId !== 'string' || memberId.length === 0) {
            res.status(400).json(buildError('INVALID_ID', 'The member id is invalid.'));
            return;
        }
        const updateSchema = z.object({
            displayName: z.string().trim().min(2).max(100).optional(),
            isActive: z.boolean().optional(),
        });
        const parsed = parseBody(updateSchema, req);
        if (!parsed) {
            res.status(400).json(buildError('INVALID_BODY', 'The body is invalid.'));
            return;
        }
        const member = await prisma.member.update({
            where: { id: memberId },
            data: parsed,
        });
        res.json({ member });
    });
    router.put('/admin/members/:id/accounts/:platform', ensureAdmin, async (req, res) => {
        const memberId = req.params.id;
        if (typeof memberId !== 'string' || memberId.length === 0) {
            res.status(400).json(buildError('INVALID_ID', 'The member id is invalid.'));
            return;
        }
        const platformResult = platformEnum.safeParse(req.params.platform);
        if (!platformResult.success) {
            res.status(400).json(buildError('INVALID_PLATFORM', 'The platform route parameter is invalid.'));
            return;
        }
        const platform = platformResult.data;
        const updateSchema = z.object({ username: z.string().trim().min(1) });
        const parsed = parseBody(updateSchema, req);
        if (!parsed) {
            res.status(400).json(buildError('INVALID_BODY', 'The username update payload is invalid.'));
            return;
        }
        const account = await prisma.platformAccount.update({
            where: { memberId_platform: { memberId, platform } },
            data: { username: parsed.username },
        });
        res.json({ account });
    });
    router.delete('/admin/members/:id', ensureAdmin, async (req, res) => {
        const memberId = req.params.id;
        if (typeof memberId !== 'string' || memberId.length === 0) {
            res.status(400).json(buildError('INVALID_ID', 'The member id is invalid.'));
            return;
        }
        await prisma.member.delete({ where: { id: memberId } });
        res.json({ ok: true });
    });
    router.post('/admin/sync', ensureAdmin, async (req, res) => {
        const body = req.body;
        if (body?.memberId) {
            const member = await prisma.member.findUnique({
                where: { id: body.memberId },
                include: { platformAccounts: true },
            });
            if (!member) {
                res.status(404).json(buildError('NOT_FOUND', 'Member not found.'));
                return;
            }
            const results = await Promise.all(member.platformAccounts.map((account) => syncMember(prisma, member.id, account.platform, account.username)));
            res.json({ memberId: member.id, results });
            return;
        }
        const result = await syncAll(prisma);
        res.json(result);
    });
    router.get('/admin/sync-runs', ensureAdmin, async (_req, res) => {
        const runs = await prisma.syncRun.findMany({
            orderBy: { startedAt: 'desc' },
            take: 20,
        });
        res.json({ runs });
    });
    router.get('/docs', (_req, res) => {
        const html = `<!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="UTF-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <title>Club Coding Tracker API</title>
          <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui.css" />
          <style>
            html, body { margin: 0; padding: 0; background: #0f172a; color: #e2e8f0; }
            #swagger-ui { max-width: 1200px; margin: 0 auto; padding: 24px; }
          </style>
        </head>
        <body>
          <div id="swagger-ui"></div>
          <script src="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui-bundle.js"></script>
          <script>
            window.onload = () => {
              window.ui = SwaggerUIBundle({
                url: '/openapi.json',
                dom_id: '#swagger-ui',
                deepLinking: true,
                presets: [SwaggerUIBundle.presets.apis, SwaggerUIBundle.Snapshot],
              });
            };
          </script>
        </body>
      </html>`;
        res.type('html').send(html);
    });
    router.get('/openapi.json', (_req, res) => {
        const spec = {
            openapi: '3.0.0',
            info: {
                title: 'Club Coding Tracker API',
                version: '1.0.0',
            },
            servers: [{ url: 'http://localhost:4000' }],
            paths: {
                '/members': {
                    get: { summary: 'List active members' },
                    post: { summary: 'Create a member with validated platform usernames' },
                },
                '/members/{slug}/stats': {
                    get: { summary: 'Get monthly stats for one member' },
                },
                '/members/{slug}/problems': {
                    get: { summary: 'List problems for a member in a month' },
                },
                '/collective/calendar': {
                    get: { summary: 'Get the club activity calendar for a month' },
                },
                '/collective/day': {
                    get: { summary: 'Get the active members and problem details for a day' },
                },
                '/collective/summary': {
                    get: { summary: 'Get club summary for a month' },
                },
                '/leaderboard': {
                    get: { summary: 'Get problem leaderboard for a month' },
                },
                '/health': {
                    get: { summary: 'Health endpoint' },
                },
            },
        };
        res.json(spec);
    });
    return router;
}
