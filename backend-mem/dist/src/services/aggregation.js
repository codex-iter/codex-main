import { toISTDate } from '../utils/time.js';
export function normalizeDate(value) {
    if (value instanceof Date) {
        return toISTDate(value);
    }
    if (typeof value === 'string' && value.length >= 10) {
        return value.slice(0, 10);
    }
    return String(value);
}
export function monthDateList(month) {
    const [yearValue, monthValue] = month.split('-').map(Number);
    const year = Number(yearValue);
    const monthNumber = Number(monthValue);
    if (!Number.isInteger(year) || !Number.isInteger(monthNumber) || monthNumber < 1 || monthNumber > 12) {
        throw new Error(`Invalid month value: ${month}`);
    }
    const daysInMonth = new Date(Date.UTC(year, monthNumber, 0)).getUTCDate();
    const dates = [];
    for (let day = 1; day <= daysInMonth; day += 1) {
        const iso = new Date(Date.UTC(year, monthNumber - 1, day));
        dates.push(toISTDate(iso));
    }
    return dates;
}
export function buildCollectiveCalendar(month, rows, platformFilter, includeContributions = false) {
    const relevantKinds = includeContributions ? ['problems', 'submissions', 'contributions'] : ['problems', 'submissions'];
    const totals = new Map();
    const activeMembers = new Map();
    for (const row of rows) {
        const rowDate = normalizeDate(row.date);
        if (platformFilter && row.platform !== platformFilter) {
            continue;
        }
        if (!relevantKinds.includes(row.kind)) {
            continue;
        }
        if (!monthDateList(month).includes(rowDate)) {
            continue;
        }
        totals.set(rowDate, (totals.get(rowDate) ?? 0) + row.count);
        if (row.count > 0) {
            const members = activeMembers.get(rowDate) ?? new Set();
            members.add(row.memberId);
            activeMembers.set(rowDate, members);
        }
    }
    return monthDateList(month).map((date) => ({
        date,
        totalProblems: totals.get(date) ?? 0,
        activeMembers: activeMembers.get(date)?.size ?? 0,
    }));
}
export function buildCollectiveDay(date, rows, problemRows, platformFilter) {
    const relevantRows = rows.filter((row) => {
        const rowDate = normalizeDate(row.date);
        if (rowDate !== date) {
            return false;
        }
        if (platformFilter && row.platform !== platformFilter) {
            return false;
        }
        return row.kind === 'problems' || row.kind === 'submissions' || row.kind === 'contributions';
    });
    const memberMap = new Map();
    for (const row of relevantRows) {
        const entry = memberMap.get(row.memberId) ?? {
            memberId: row.memberId,
            slug: '',
            displayName: '',
            totalProblems: 0,
            platformCounts: {},
            problems: [],
        };
        if (row.kind === 'problems' || row.kind === 'submissions') {
            entry.totalProblems += row.count;
        }
        entry.platformCounts[row.platform] = (entry.platformCounts[row.platform] ?? 0) + row.count;
        memberMap.set(row.memberId, entry);
    }
    for (const problem of problemRows) {
        const problemDate = normalizeDate(problem.solvedDate);
        if (problemDate !== date) {
            continue;
        }
        if (platformFilter && problem.platform !== platformFilter) {
            continue;
        }
        const current = memberMap.get(problem.memberId);
        if (!current) {
            continue;
        }
        current.problems.push({
            platform: problem.platform,
            title: problem.title,
            difficulty: problem.difficulty,
            url: problem.url,
        });
    }
    const members = Array.from(memberMap.values())
        .filter((member) => member.totalProblems > 0)
        .map((member) => ({
        ...member,
        problems: member.problems.sort((a, b) => a.title.localeCompare(b.title)),
    }))
        .sort((a, b) => b.totalProblems - a.totalProblems || a.displayName.localeCompare(b.displayName));
    return { date, members };
}
export function calculateClubStreaks(activeDates) {
    const uniqueDates = [...new Set(activeDates)].sort();
    if (uniqueDates.length === 0) {
        return { current: 0, longest: 0 };
    }
    let longest = 0;
    let run = 0;
    let previous = null;
    for (const date of uniqueDates) {
        if (previous && diffDays(previous, date) === 1) {
            run += 1;
        }
        else {
            run = 1;
        }
        longest = Math.max(longest, run);
        previous = date;
    }
    let current = 0;
    let cursor = new Date(`${uniqueDates[uniqueDates.length - 1]}T00:00:00Z`);
    const activeSet = new Set(uniqueDates);
    while (activeSet.has(toISTDate(cursor))) {
        current += 1;
        cursor = addDaysToDate(cursor, -1);
    }
    return { current, longest };
}
export function buildSummary(month, rows, platformFilter, includeContributions = false, todayOverride) {
    const calendar = buildCollectiveCalendar(month, rows, platformFilter, includeContributions);
    const totalProblems = calendar.reduce((sum, day) => sum + day.totalProblems, 0);
    const activeMembers = new Set(rows
        .filter((row) => {
        if (platformFilter && row.platform !== platformFilter) {
            return false;
        }
        if (!includeContributions && row.kind === 'contributions') {
            return false;
        }
        if (row.kind !== 'problems' && row.kind !== 'submissions' && !(includeContributions && row.kind === 'contributions')) {
            return false;
        }
        return monthDateList(month).includes(normalizeDate(row.date)) && row.count > 0;
    })
        .map((row) => row.memberId));
    const averagePerActiveMember = activeMembers.size > 0 ? Number((totalProblems / activeMembers.size).toFixed(2)) : 0;
    const mostActiveDay = calendar.reduce((best, day) => {
        if (!best || day.totalProblems > best.totalProblems) {
            return { date: day.date, totalProblems: day.totalProblems };
        }
        if (day.totalProblems === best.totalProblems && day.date < best.date) {
            return { date: day.date, totalProblems: day.totalProblems };
        }
        return best;
    }, null);
    const activeDayDates = calendar.filter((day) => day.totalProblems > 0).map((day) => day.date);
    const streaks = calculateClubStreaks(activeDayDates);
    const today = todayOverride ?? new Date();
    const todayDate = toISTDate(today);
    const latestActive = activeDayDates[activeDayDates.length - 1] ?? null;
    const currentClubStreak = latestActive && (latestActive === todayDate || latestActive === addDays(todayDate, -1))
        ? streaks.current
        : activeDayDates.length > 0 && latestActive && latestActive <= todayDate
            ? streaks.current
            : 0;
    return {
        date: `${month}-01`,
        totalProblems,
        activeMembers: activeMembers.size,
        averagePerActiveMember,
        mostActiveDay,
        currentClubStreak,
        longestClubStreak: streaks.longest,
    };
}
function diffDays(firstDate, secondDate) {
    const first = new Date(`${firstDate}T00:00:00Z`);
    const second = new Date(`${secondDate}T00:00:00Z`);
    return Math.round((second.getTime() - first.getTime()) / (1000 * 60 * 60 * 24));
}
function addDays(input, delta) {
    const date = new Date(`${input}T00:00:00Z`);
    date.setUTCDate(date.getUTCDate() + delta);
    return toISTDate(date);
}
function addDaysToDate(input, delta) {
    const next = new Date(input.getTime());
    next.setUTCDate(next.getUTCDate() + delta);
    return next;
}
