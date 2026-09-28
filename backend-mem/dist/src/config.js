import dotenv from 'dotenv';
dotenv.config();
export const config = {
    port: Number(process.env.PORT ?? '4000'),
    nodeEnv: process.env.NODE_ENV ?? 'development',
    adminKey: process.env.ADMIN_KEY ?? 'change-me',
    cronSchedule: process.env.CRON_SCHEDULE ?? '0 */6 * * *',
    databaseUrl: process.env.DATABASE_URL ?? 'postgresql://postgres:postgres@localhost:5432/club_tracker?schema=public',
    frontendOrigin: process.env.FRONTEND_ORIGIN ?? 'http://localhost:5173',
    leetCodeApiBase: process.env.LEETCODE_API_BASE ?? 'https://leetcode-api-pied.vercel.app',
    codeforcesApiBase: process.env.CODEFORCES_API_BASE ?? 'https://codeforces.com/api',
    gfgApiBase: process.env.GFG_API_BASE ?? 'https://gfg-stats.tashif.codes',
    codechefApiBase: process.env.CODECHEF_API_BASE ?? 'https://codechef-stats.tashif.codes',
    hackerrankApiBase: process.env.HACKERRANK_API_BASE ?? 'https://hackerrank-stats.tashif.codes',
    githubToken: process.env.GITHUB_TOKEN ?? '',
};
