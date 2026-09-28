import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { LeetCodeAdapter } from '../src/adapters/leetcode.js';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
function readFixture(name) {
    const filePath = path.resolve(__dirname, '..', 'fixtures', 'leetcode', name);
    return readFileSync(filePath, 'utf8');
}
describe('LeetCode adapter', () => {
    it('parses the real API shapes from the saved fixtures', () => {
        const adapter = new LeetCodeAdapter();
        const userPayload = JSON.parse(readFixture('user.json'));
        const solvedPayload = JSON.parse(readFixture('solved.json'));
        const calendarPayload = JSON.parse(readFixture('calendar.json'));
        expect(adapter.parseUser(userPayload)).toMatchObject({ username: 'jiangly' });
        expect(adapter.parseSolved(solvedPayload)).toEqual([]);
        expect(adapter.parseCalendar(calendarPayload)).toEqual({
            activeYears: [],
            streak: 0,
            totalActiveDays: 0,
            submissionCalendar: {},
        });
    });
});
