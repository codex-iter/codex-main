export function toISTDate(input) {
    const date = input instanceof Date ? input : new Date(input);
    const formatter = new Intl.DateTimeFormat('en-CA', {
        timeZone: 'Asia/Kolkata',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
    });
    const parts = formatter.formatToParts(date);
    const year = parts.find((part) => part.type === 'year')?.value;
    const month = parts.find((part) => part.type === 'month')?.value;
    const day = parts.find((part) => part.type === 'day')?.value;
    return [year, month, day].filter(Boolean).join('-');
}
export function monthRange(month) {
    const [rawYear, rawMonth] = month.split('-');
    const year = Number(rawYear);
    const monthNumber = Number(rawMonth);
    if (!Number.isFinite(year) || !Number.isFinite(monthNumber)) {
        throw new Error(`Invalid month value: ${month}`);
    }
    const start = `${String(year)}-${String(monthNumber).padStart(2, '0')}-01`;
    const endOfMonth = new Date(Date.UTC(year, monthNumber, 0));
    const endDay = String(endOfMonth.getUTCDate()).padStart(2, '0');
    const end = `${year}-${String(monthNumber).padStart(2, '0')}-${endDay}`;
    return { start, end };
}
