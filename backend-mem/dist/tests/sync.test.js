import { describe, expect, it, vi } from 'vitest';
import * as registry from '../src/adapters/registry.js';
vi.mock('../src/adapters/registry.js', () => ({
    getAdapter: vi.fn(),
}));
import { syncMember } from '../src/services/sync.js';
describe('sync service', () => {
    it('produces identical daily rows when the same sync is run twice', async () => {
        vi.mocked(registry.getAdapter).mockReturnValue({
            platform: 'CODEFORCES',
            validateUsername: async () => ({ valid: true }),
            fetchActivity: async () => ({
                problems: [
                    {
                        problemId: '2268:F',
                        title: 'Deglado',
                        difficulty: 'Hard',
                        tags: ['constructive algorithms'],
                        solvedAt: '2026-09-27T14:32:00.000Z',
                        url: 'https://codeforces.com/problemset/problem/2268/F',
                    },
                ],
                daily: [],
            }),
        });
        const mockPrisma = {
            platformAccount: {
                findUnique: vi.fn().mockResolvedValue({ baselineDone: false }),
                upsert: vi.fn(async ({ update, create }) => ({ ...create, ...update })),
            },
            solvedProblem: {
                upsert: vi.fn(async ({ update, create }) => ({ ...create, ...update })),
                groupBy: vi.fn(async () => [{ solvedDate: new Date('2026-09-27T00:00:00.000Z'), _count: { solvedDate: 1 } }]),
            },
            dailyActivity: {
                deleteMany: vi.fn(async () => ({ count: 1 })),
                upsert: vi.fn(async ({ update, create }) => ({ ...create, ...update })),
            },
        };
        await syncMember(mockPrisma, 'member-1', 'CODEFORCES', 'jiangly');
        const firstRun = mockPrisma.dailyActivity.upsert.mock.calls.map(([arg]) => ({
            date: arg.create.date.toISOString(),
            count: arg.create.count,
            kind: arg.create.kind,
        }));
        await syncMember(mockPrisma, 'member-1', 'CODEFORCES', 'jiangly');
        const secondRun = mockPrisma.dailyActivity.upsert.mock.calls.slice(firstRun.length).map(([arg]) => ({
            date: arg.create.date.toISOString(),
            count: arg.create.count,
            kind: arg.create.kind,
        }));
        expect(secondRun).toEqual(firstRun);
    });
    it('keeps GFG baseline entries out of the daily count until new items appear', async () => {
        vi.mocked(registry.getAdapter).mockReturnValue({
            platform: 'GFG',
            validateUsername: async () => ({ valid: true }),
            fetchActivity: async () => ({
                problems: [
                    { problemId: 'gfg:1', title: 'Array basics', difficulty: 'Easy', tags: ['array'], solvedAt: '2026-09-28T10:00:00.000Z', url: 'https://example.com/p1' },
                    { problemId: 'gfg:2', title: 'Linked list', difficulty: 'Medium', tags: ['linked-list'], solvedAt: '2026-09-28T11:00:00.000Z', url: 'https://example.com/p2' },
                ],
                daily: [],
            }),
        });
        const baselineUpsert = vi.fn(async ({ update, create }) => ({ ...create, ...update }));
        const dailyUpsert = vi.fn(async ({ update, create }) => ({ ...create, ...update }));
        const mockPrisma = {
            platformAccount: {
                findUnique: vi.fn().mockResolvedValue({ baselineDone: false }),
                upsert: baselineUpsert,
            },
            solvedProblem: {
                findMany: vi.fn().mockResolvedValue([]),
                upsert: vi.fn(async ({ update, create }) => ({ ...create, ...update })),
            },
            dailyActivity: {
                upsert: dailyUpsert,
            },
        };
        await syncMember(mockPrisma, 'member-1', 'GFG', 'mohit');
        expect(baselineUpsert).toHaveBeenCalled();
        const baselineUpdate = baselineUpsert.mock.calls[0]?.[0]?.update;
        expect(baselineUpdate?.baselineDone).toBe(true);
        expect(dailyUpsert).not.toHaveBeenCalled();
    });
});
