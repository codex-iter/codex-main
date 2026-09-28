import axios from 'axios';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { requestJson } from '../src/utils/http.js';
vi.mock('axios', () => ({
    default: {
        request: vi.fn(),
        isAxiosError: (error) => Boolean(error?.isAxiosError),
    },
}));
describe('HTTP client', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });
    it('retries once on a server error and resolves the second response', async () => {
        const mockedRequest = vi.mocked(axios.request);
        mockedRequest
            .mockRejectedValueOnce({ isAxiosError: true, response: { status: 500 } })
            .mockResolvedValueOnce({ data: { ok: true } });
        await expect(requestJson('https://example.com')).resolves.toEqual({ ok: true });
        expect(mockedRequest).toHaveBeenCalledTimes(2);
    });
});
