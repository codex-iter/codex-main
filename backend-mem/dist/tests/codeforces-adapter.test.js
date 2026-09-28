import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { CodeforcesAdapter } from '../src/adapters/codeforces.js';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
function readFixture(name) {
    const filePath = path.resolve(__dirname, '..', 'fixtures', 'codeforces', name);
    return JSON.parse(readFileSync(filePath, 'utf8'));
}
describe('Codeforces adapter', () => {
    it('parses the real official API payloads from the saved fixtures', () => {
        const adapter = new CodeforcesAdapter();
        const userInfo = readFixture('user-info.json');
        const statusInfo = readFixture('user-status.json');
        expect(adapter.parseUserInfo(userInfo)).toContain('jiangly');
        expect(adapter.parseStatus(statusInfo).length).toBeGreaterThan(0);
        expect(adapter.parseStatus(statusInfo).filter((entry) => entry.verdict === 'OK').length).toBeGreaterThan(0);
    });
});
