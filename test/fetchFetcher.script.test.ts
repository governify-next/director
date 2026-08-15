import { Types } from 'mongoose';
import { afterEach, describe, expect, it, vi } from 'vitest';
import fetchFetcher from '../src/scripts/fetchFetcher.js';
import { TaskExecutionContext } from '../src/types/script.js';

describe('fetchFetcher script', () => {
    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it('captures the fetcher at the exact scheduled time using the temporal contract', async () => {
        const fetchMock = vi
            .fn()
            .mockResolvedValueOnce({ ok: true })
            .mockResolvedValueOnce({
                json: async () => ({
                    success: true,
                    data: { status: 'COMPLETED' },
                }),
            });
        vi.stubGlobal('fetch', fetchMock);

        const scheduledAt = new Date('2026-08-12T10:15:30.000Z');
        const logger = { info: vi.fn() } as unknown as TaskExecutionContext['logger'];

        await fetchFetcher.exec(
            {
                fetcherId: 'FT_GQL_ZENHUB_ISSUES',
                fetcherConfig: { workspaceId: 'workspace-id' },
                orgId: 'organization-id',
                scopeId: 'scope-id',
                agColId: 'agreement-collection-id',
                versionNumber: 3,
            },
            {
                taskId: new Types.ObjectId(),
                scheduledAt,
                logger,
            },
        );

        expect(fetchMock).toHaveBeenCalledTimes(2);
        const [url, request] = fetchMock.mock.calls[1];
        expect(url).toBe(
            'http://localhost:5904/api/v1/fetchers/FT_GQL_ZENHUB_ISSUES/fetchResults/generate?isAsync=false',
        );
        expect(request).toMatchObject({ method: 'POST' });
        expect(JSON.parse(request.body)).toEqual({
            temporalContext: {
                effectiveAt: scheduledAt.toISOString(),
                mode: 'CAPTURE',
            },
            fetcherConfig: { workspaceId: 'workspace-id' },
        });
    });
});
