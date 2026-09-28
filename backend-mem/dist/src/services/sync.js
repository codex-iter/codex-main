import { getAdapter } from '../adapters/registry.js';
import { sleep } from '../utils/sleep.js';
import { toISTDate } from '../utils/time.js';
const problemPlatforms = new Set(['CODEFORCES', 'LEETCODE', 'GFG']);
const heatmapPlatforms = new Set(['CODECHEF', 'HACKERRANK', 'GITHUB']);
export async function syncMember(prisma, memberId, platform, username) {
    const adapter = getAdapter(platform);
    try {
        const validation = await adapter.validateUsername(username);
        const currentAccount = await prisma.platformAccount.findUnique({
            where: { memberId_platform: { memberId, platform } },
            select: { consecutiveFailures: true },
        });
        const syncStatus = validation.reason?.toLowerCase().includes('token') ? 'failed' : 'private';
        if (!validation.valid) {
            const nextFailures = syncStatus === 'failed' ? (currentAccount?.consecutiveFailures ?? 0) + 1 : 0;
            await prisma.platformAccount.upsert({
                where: { memberId_platform: { memberId, platform } },
                update: { username, lastSyncStatus: syncStatus, lastError: validation.reason ?? 'invalid username', lastSyncedAt: new Date(), consecutiveFailures: nextFailures },
                create: { memberId, platform, username, lastSyncStatus: syncStatus, lastError: validation.reason ?? 'invalid username', lastSyncedAt: new Date(), consecutiveFailures: nextFailures },
            });
            return { ok: false, status: syncStatus, lastError: validation.reason ?? 'invalid username' };
        }
        const { problems, daily } = await adapter.fetchActivity(username);
        const syncAccount = await prisma.platformAccount.findUnique({
            where: { memberId_platform: { memberId, platform } },
            select: { baselineDone: true },
        });
        if (platform === 'GFG') {
            const existingProblems = await prisma.solvedProblem.findMany({
                where: { memberId, platform },
                select: { problemId: true },
            });
            const seenIds = new Set(existingProblems.map((entry) => entry.problemId));
            if (!syncAccount?.baselineDone) {
                for (const problem of problems) {
                    await prisma.solvedProblem.upsert({
                        where: { memberId_platform_problemId: { memberId, platform, problemId: problem.problemId } },
                        update: {
                            title: problem.title,
                            difficulty: problem.difficulty,
                            tags: problem.tags,
                            solvedAt: new Date(problem.solvedAt),
                            solvedDate: new Date('1970-01-01T00:00:00.000Z'),
                            url: problem.url,
                            dateSource: 'detected',
                        },
                        create: {
                            memberId,
                            platform,
                            problemId: problem.problemId,
                            title: problem.title,
                            difficulty: problem.difficulty,
                            tags: problem.tags,
                            solvedAt: new Date(problem.solvedAt),
                            solvedDate: new Date('1970-01-01T00:00:00.000Z'),
                            url: problem.url,
                            dateSource: 'detected',
                        },
                    });
                }
                await prisma.platformAccount.upsert({
                    where: { memberId_platform: { memberId, platform } },
                    update: { baselineDone: true, username, lastSyncStatus: 'ok', lastSyncedAt: new Date(), lastError: null },
                    create: { memberId, platform, username, baselineDone: true, lastSyncStatus: 'ok', lastSyncedAt: new Date(), lastError: null },
                });
                return { ok: true, status: 'ok' };
            }
            const newlySeen = problems.filter((problem) => !seenIds.has(problem.problemId));
            for (const problem of newlySeen) {
                await prisma.solvedProblem.upsert({
                    where: { memberId_platform_problemId: { memberId, platform, problemId: problem.problemId } },
                    update: {
                        title: problem.title,
                        difficulty: problem.difficulty,
                        tags: problem.tags,
                        solvedAt: new Date(problem.solvedAt),
                        solvedDate: new Date(`${toISTDate(problem.solvedAt)}T00:00:00Z`),
                        url: problem.url,
                        dateSource: 'detected',
                    },
                    create: {
                        memberId,
                        platform,
                        problemId: problem.problemId,
                        title: problem.title,
                        difficulty: problem.difficulty,
                        tags: problem.tags,
                        solvedAt: new Date(problem.solvedAt),
                        solvedDate: new Date(`${toISTDate(problem.solvedAt)}T00:00:00Z`),
                        url: problem.url,
                        dateSource: 'detected',
                    },
                });
            }
            const countsByDate = new Map();
            for (const problem of newlySeen) {
                const date = toISTDate(problem.solvedAt);
                countsByDate.set(date, (countsByDate.get(date) ?? 0) + 1);
            }
            for (const [date, count] of countsByDate.entries()) {
                await prisma.dailyActivity.upsert({
                    where: { memberId_platform_date: { memberId, platform, date: new Date(`${date}T00:00:00Z`) } },
                    update: { count, kind: 'problems' },
                    create: { memberId, platform, date: new Date(`${date}T00:00:00Z`), count, kind: 'problems' },
                });
            }
        }
        else {
            for (const problem of problems) {
                await prisma.solvedProblem.upsert({
                    where: {
                        memberId_platform_problemId: {
                            memberId,
                            platform,
                            problemId: problem.problemId,
                        },
                    },
                    update: {
                        title: problem.title,
                        difficulty: problem.difficulty,
                        tags: problem.tags,
                        solvedAt: new Date(problem.solvedAt),
                        solvedDate: new Date(`${toISTDate(problem.solvedAt)}T00:00:00Z`),
                        url: problem.url,
                        dateSource: 'platform',
                    },
                    create: {
                        memberId,
                        platform,
                        problemId: problem.problemId,
                        title: problem.title,
                        difficulty: problem.difficulty,
                        tags: problem.tags,
                        solvedAt: new Date(problem.solvedAt),
                        solvedDate: new Date(`${toISTDate(problem.solvedAt)}T00:00:00Z`),
                        url: problem.url,
                        dateSource: 'platform',
                    },
                });
            }
            if (problemPlatforms.has(platform)) {
                const rows = await prisma.solvedProblem.groupBy({
                    by: ['solvedDate'],
                    where: { memberId, platform },
                    _count: { solvedDate: true },
                });
                const derived = rows.map((row) => ({
                    date: toISTDate(row.solvedDate),
                    count: row._count.solvedDate,
                }));
                await prisma.dailyActivity.deleteMany({ where: { memberId, platform } });
                for (const row of derived) {
                    const date = `${row.date}T00:00:00Z`;
                    await prisma.dailyActivity.upsert({
                        where: { memberId_platform_date: { memberId, platform, date: new Date(date) } },
                        update: { count: row.count, kind: 'problems' },
                        create: { memberId, platform, date: new Date(date), count: row.count, kind: 'problems' },
                    });
                }
            }
            else if (daily.length > 0) {
                for (const entry of daily) {
                    await prisma.dailyActivity.upsert({
                        where: { memberId_platform_date: { memberId, platform, date: new Date(`${entry.date}T00:00:00Z`) } },
                        update: { count: entry.count, kind: platform === 'GITHUB' ? 'contributions' : 'submissions' },
                        create: { memberId, platform, date: new Date(`${entry.date}T00:00:00Z`), count: entry.count, kind: platform === 'GITHUB' ? 'contributions' : 'submissions' },
                    });
                }
            }
        }
        const finalStatus = daily.length === 0 && heatmapPlatforms.has(platform) ? 'no_data' : 'ok';
        await prisma.platformAccount.upsert({
            where: { memberId_platform: { memberId, platform } },
            update: {
                username,
                lastSyncedAt: new Date(),
                lastSyncStatus: finalStatus,
                lastError: finalStatus === 'ok' ? null : 'No daily data returned for this platform',
                baselineDone: platform === 'GFG' ? true : undefined,
                consecutiveFailures: 0,
            },
            create: {
                memberId,
                platform,
                username,
                lastSyncedAt: new Date(),
                lastSyncStatus: finalStatus,
                lastError: finalStatus === 'ok' ? null : 'No daily data returned for this platform',
                baselineDone: platform === 'GFG',
                consecutiveFailures: 0,
            },
        });
        return { ok: finalStatus === 'ok', status: finalStatus };
    }
    catch (error) {
        const message = error instanceof Error ? error.message : 'unknown sync failure';
        const status = 'failed';
        const previousFailureCount = await prisma.platformAccount.findUnique({
            where: { memberId_platform: { memberId, platform } },
            select: { consecutiveFailures: true },
        });
        const nextFailureCount = (previousFailureCount?.consecutiveFailures ?? 0) + 1;
        await prisma.platformAccount.upsert({
            where: { memberId_platform: { memberId, platform } },
            update: {
                username,
                lastSyncedAt: new Date(),
                lastSyncStatus: status,
                lastError: message,
                consecutiveFailures: nextFailureCount,
            },
            create: {
                memberId,
                platform,
                username,
                lastSyncedAt: new Date(),
                lastSyncStatus: status,
                lastError: message,
                consecutiveFailures: nextFailureCount,
            },
        });
        return { ok: false, status, lastError: message };
    }
}
export async function syncAll(prisma) {
    const accounts = await prisma.platformAccount.findMany({
        select: {
            id: true,
            memberId: true,
            platform: true,
            username: true,
            baselineDone: true,
            lastSyncStatus: true,
            lastError: true,
        },
    });
    let membersOk = 0;
    let membersFailed = 0;
    const errorLog = [];
    for (let index = 0; index < accounts.length; index += 1) {
        if (index > 0) {
            await sleep(1500);
        }
        const account = accounts[index];
        if (!account) {
            continue;
        }
        const result = await syncMember(prisma, account.memberId, account.platform, account.username);
        if (result.ok) {
            membersOk += 1;
        }
        else {
            membersFailed += 1;
            errorLog.push(`${account.memberId}:${account.platform}:${result.lastError ?? 'unknown error'}`);
        }
    }
    return {
        membersTotal: accounts.length,
        membersOk,
        membersFailed,
        errorLog,
    };
}
