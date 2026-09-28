import axios from 'axios';
import { sleep } from './sleep.js';
const DEFAULT_TIMEOUT = 15000;
const MAX_RETRIES = 2;
export async function requestJson(url, config = {}) {
    let attempt = 0;
    while (attempt <= MAX_RETRIES) {
        try {
            const response = await axios.request({
                url,
                timeout: DEFAULT_TIMEOUT,
                ...config,
            });
            return response.data;
        }
        catch (error) {
            const shouldRetry = attempt < MAX_RETRIES && shouldRetryRequest(error);
            if (!shouldRetry) {
                throw error;
            }
            const backoffMs = 500 * 2 ** attempt;
            await sleep(backoffMs);
            attempt += 1;
        }
    }
    throw new Error(`Request to ${url} failed after retries.`);
}
function shouldRetryRequest(error) {
    if (!axios.isAxiosError(error)) {
        return false;
    }
    const status = error.response?.status ?? 0;
    return status === 429 || status >= 500 || error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT';
}
