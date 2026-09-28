import { describe, expect, it } from 'vitest';
import { buildCollectiveCalendar, buildCollectiveDay, buildSummary } from '../src/services/aggregation.js';
describe('collective aggregation queries', () => {
    it('fills every day in the month and keeps non-active days at zero', () => {
        const rows = [
            { memberId: 'm1', platform: 'CODEFORCES', date: '2026-09-01', count: 2, kind: 'problems' },
            { memberId: 'm2', platform: 'CODECHEF', date: '2026-09-01', count: 1, kind: 'submissions' },
            { memberId: 'm1', platform: 'LEETCODE', date: '2026-09-08', count: 1, kind: 'problems' },
            { memberId: 'm3', platform: 'GITHUB', date: '2026-09-08', count: 4, kind: 'contributions' },
            { memberId: 'm2', platform: 'CODEFORCES', date: '2026-08-31', count: 5, kind: 'problems' },
        ];
        const calendar = buildCollectiveCalendar('2026-09', rows);
        expect(calendar.length).toBe(30);
        expect(calendar[0]).toEqual({ date: '2026-09-01', totalProblems: 3, activeMembers: 2 });
        expect(calendar[7]).toEqual({ date: '2026-09-08', totalProblems: 1, activeMembers: 1 });
        expect(calendar.find((day) => day.date === '2026-09-02')).toEqual({ date: '2026-09-02', totalProblems: 0, activeMembers: 0 });
    });
    it('returns the day view with per-member counts and problem titles', () => {
        const rows = [
            { memberId: 'm1', platform: 'CODEFORCES', date: '2026-09-15', count: 2, kind: 'problems' },
            { memberId: 'm2', platform: 'LEETCODE', date: '2026-09-15', count: 1, kind: 'problems' },
            { memberId: 'm2', platform: 'CODECHEF', date: '2026-09-15', count: 1, kind: 'submissions' },
        ];
        const problemRows = [
            { memberId: 'm1', platform: 'CODEFORCES', title: 'Array Split', difficulty: 'Easy', url: 'https://example.com/a', solvedDate: '2026-09-15' },
            { memberId: 'm1', platform: 'CODEFORCES', title: 'Tree Repair', difficulty: 'Hard', url: 'https://example.com/b', solvedDate: '2026-09-15' },
            { memberId: 'm2', platform: 'LEETCODE', title: 'Two Sum', difficulty: 'Easy', url: 'https://example.com/c', solvedDate: '2026-09-15' },
        ];
        const result = buildCollectiveDay('2026-09-15', rows, problemRows);
        const firstMember = result.members[0];
        expect(result.members).toHaveLength(2);
        expect(firstMember.memberId).toBe('m1');
        expect(firstMember.platformCounts).toEqual({ CODEFORCES: 2 });
        expect(firstMember.problems).toEqual([
            { platform: 'CODEFORCES', title: 'Array Split', difficulty: 'Easy', url: 'https://example.com/a' },
            { platform: 'CODEFORCES', title: 'Tree Repair', difficulty: 'Hard', url: 'https://example.com/b' },
        ]);
    });
    it('keeps count-only platform data even when no problem details are available', () => {
        const rows = [
            { memberId: 'm3', platform: 'GITHUB', date: '2026-09-20', count: 7, kind: 'contributions' },
            { memberId: 'm3', platform: 'CODECHEF', date: '2026-09-20', count: 3, kind: 'submissions' },
        ];
        const result = buildCollectiveDay('2026-09-20', rows, []);
        expect(result.members).toHaveLength(1);
        expect(result.members[0]?.platformCounts).toEqual({ GITHUB: 7, CODECHEF: 3 });
        expect(result.members[0]?.problems).toEqual([]);
    });
    it('computes summary totals and streaks across month boundaries and IST date edges', () => {
        const rows = [
            { memberId: 'm1', platform: 'CODEFORCES', date: '2026-09-01', count: 1, kind: 'problems' },
            { memberId: 'm2', platform: 'CODEFORCES', date: '2026-09-02', count: 2, kind: 'problems' },
            { memberId: 'm1', platform: 'CODEFORCES', date: '2026-09-03', count: 3, kind: 'problems' },
            { memberId: 'm2', platform: 'LEETCODE', date: '2026-09-05', count: 1, kind: 'problems' },
            { memberId: 'm1', platform: 'CODECHEF', date: '2026-09-06', count: 1, kind: 'submissions' },
            { memberId: 'm2', platform: 'CODEFORCES', date: '2026-09-07', count: 2, kind: 'problems' },
        ];
        const summary = buildSummary('2026-09', rows, undefined, false, new Date('2026-09-07T12:00:00Z'));
        expect(summary.totalProblems).toBe(10);
        expect(summary.activeMembers).toBe(2);
        expect(summary.averagePerActiveMember).toBe(5);
        expect(summary.mostActiveDay).toEqual({ date: '2026-09-03', totalProblems: 3 });
        expect(summary.longestClubStreak).toBe(3);
        expect(summary.currentClubStreak).toBe(3);
    });
});
