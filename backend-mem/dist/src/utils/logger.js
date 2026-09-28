export function logAdapterCall({ platform, username, action, outcome, durationMs, error }) {
    const safeError = error instanceof Error ? error.message.replace(/Bearer\s+[A-Za-z0-9._-]+/gi, 'Bearer [REDACTED]') : typeof error === 'string' ? error.replace(/Bearer\s+[A-Za-z0-9._-]+/gi, 'Bearer [REDACTED]') : undefined;
    console.info(JSON.stringify({
        event: 'adapter_call',
        platform,
        username,
        action,
        outcome,
        durationMs,
        ...(safeError ? { error: safeError } : {}),
    }));
}
export async function withAdapterLogging(platform, username, action, fn) {
    const startedAt = Date.now();
    try {
        const result = await fn();
        logAdapterCall({ platform, username, action, outcome: 'success', durationMs: Date.now() - startedAt });
        return result;
    }
    catch (error) {
        logAdapterCall({
            platform,
            username,
            action,
            outcome: 'error',
            durationMs: Date.now() - startedAt,
            error,
        });
        throw error;
    }
}
