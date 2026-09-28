import { CodeChefAdapter } from './codechef.js';
import { CodeforcesAdapter } from './codeforces.js';
import { GFGAdapter } from './gfg.js';
import { GitHubAdapter } from './github.js';
import { HackerRankAdapter } from './hackerrank.js';
import { LeetCodeAdapter } from './leetcode.js';
class UnimplementedAdapter {
    platform;
    constructor(platform) {
        this.platform = platform;
    }
    async validateUsername() {
        return { valid: false, reason: `${this.platform} adapter is not implemented yet` };
    }
    async fetchActivity() {
        return { problems: [], daily: [] };
    }
}
export const platformAdapters = {
    CODEFORCES: new CodeforcesAdapter(),
    LEETCODE: new LeetCodeAdapter(),
    GFG: new GFGAdapter(),
    CODECHEF: new CodeChefAdapter(),
    HACKERRANK: new HackerRankAdapter(),
    GITHUB: new GitHubAdapter(),
};
export function getAdapter(platform) {
    return platformAdapters[platform];
}
