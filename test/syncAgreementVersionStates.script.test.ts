import { Types } from 'mongoose';
import { afterEach, describe, expect, it, vi } from 'vitest';
import syncAgreementVersionStates from '../src/scripts/syncAgreementVersionStates.js';
import { getScriptByName } from '../src/repositories/script.repository.js';
import { TaskExecutionContext } from '../src/types/script.js';
import { bootEnv } from '../src/config/bootConfig.js';
import * as serviceAuthentication from '../src/utils/serviceAuthentication.js';
import { ExternalServiceError, ValidationError } from '../src/utils/customErrors.js';

const input = {
    orgName: 'organization name',
    orgId: 'organization-id',
    scopeId: 'scope/id',
    agColId: 'collection/id',
    agreementVersion: 'auditableVersion',
    lookbackMs: 3_600_000,
};

const createContext = (): TaskExecutionContext => ({
    taskId: new Types.ObjectId(),
    scheduledAt: new Date('2026-08-15T00:15:30.123Z'),
    logger: { info: vi.fn() } as unknown as TaskExecutionContext['logger'],
});

afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
});

describe('syncAgreementVersionStates script', () => {
    it.each([2, 'auditableVersion'])(
        'sends the scheduled lookback range to Reporter for version %s',
        async (agreementVersion) => {
            const data = { statePoints: 2, metricPoints: 4, totalPoints: 6, batches: 1 };
            const fetchMock = vi.fn().mockResolvedValue({
                ok: true,
                status: 200,
                json: async () => ({ success: true, data }),
            });
            vi.stubGlobal('fetch', fetchMock);
            const headers = {
                'Content-Type': 'application/json',
                Authorization: 'Bearer test-token',
            };
            vi.spyOn(serviceAuthentication, 'getServiceHeaders').mockReturnValue(headers);
            // A delayed run must still use scheduledAt, not the current execution time.
            vi.spyOn(Date, 'now').mockReturnValue(new Date('2026-08-16T12:00:00Z').getTime());
            const context = createContext();

            const script = getScriptByName('syncAgreementVersionStates');
            expect(script).toBe(syncAgreementVersionStates);
            const result = await script!.exec({ ...input, agreementVersion }, context);

            expect(fetchMock).toHaveBeenCalledExactlyOnceWith(
                `${bootEnv.REPORTER_SERVICE_URL.replace(/\/+$/, '')}/api/v1/influx/organizations/organization%20name/scopes/scope%2Fid/agreementCollections/collection%2Fid/agreementVersions/${agreementVersion}/states/sync`,
                {
                    method: 'POST',
                    headers,
                    body: JSON.stringify({
                        updatedFrom: '2026-08-14T23:15:30.123Z',
                        updatedTo: '2026-08-15T00:15:30.123Z',
                    }),
                },
            );
            expect(context.scheduledAt.toISOString()).toBe('2026-08-15T00:15:30.123Z');
            expect(result).toEqual(data);
        },
    );

    it.each([
        undefined,
        0,
        -1,
        1.5,
        '3600000',
        Number.POSITIVE_INFINITY,
        Number.MAX_SAFE_INTEGER + 1,
    ])('rejects invalid lookbackMs %s before contacting Reporter', async (lookbackMs) => {
        const fetchMock = vi.fn();
        vi.stubGlobal('fetch', fetchMock);
        await expect(
            syncAgreementVersionStates.exec({ ...input, lookbackMs }, createContext()),
        ).rejects.toThrow();
        expect(fetchMock).not.toHaveBeenCalled();
    });

    it.each([
        { orgName: undefined },
        { orgId: undefined },
        { scopeId: undefined },
        { agColId: undefined },
        { agreementVersion: undefined },
        { agreementVersion: 0 },
        { agreementVersion: 1.5 },
        { agreementVersion: '2' },
    ])('rejects invalid agreement metadata: %j', (overrides) => {
        expect(
            syncAgreementVersionStates.inputSchema.safeParse({ ...input, ...overrides }).success,
        ).toBe(false);
    });

    it('rejects a lookback that would produce a date outside the supported range', async () => {
        const fetchMock = vi.fn();
        vi.stubGlobal('fetch', fetchMock);
        await expect(
            syncAgreementVersionStates.exec(
                { ...input, lookbackMs: Number.MAX_SAFE_INTEGER },
                createContext(),
            ),
        ).rejects.toBeInstanceOf(ValidationError);
        expect(fetchMock).not.toHaveBeenCalled();
    });

    it.each([
        { ok: false, status: 500, result: { success: true, data: {} } },
        { ok: true, status: 200, result: { success: false, message: 'Sync failed' } },
        { ok: true, status: 200, result: { success: true } },
        { ok: true, status: 200, result: null },
    ])(
        'fails the execution when Reporter does not confirm success: %j',
        async ({ ok, status, result }) => {
            vi.stubGlobal(
                'fetch',
                vi.fn().mockResolvedValue({ ok, status, json: async () => result }),
            );
            const context = createContext();
            await expect(syncAgreementVersionStates.exec(input, context)).rejects.toBeInstanceOf(
                ExternalServiceError,
            );
            expect(context.logger.info).toHaveBeenCalledTimes(1);
        },
    );

    it('fails the execution when Reporter is unreachable', async () => {
        vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Connection refused')));
        await expect(syncAgreementVersionStates.exec(input, createContext())).rejects.toThrow(
            'Reporter service is unavailable',
        );
    });

    it('fails the execution when Reporter returns invalid JSON', async () => {
        vi.stubGlobal(
            'fetch',
            vi.fn().mockResolvedValue({
                ok: false,
                status: 502,
                json: async () => {
                    throw new SyntaxError('Invalid JSON');
                },
            }),
        );
        await expect(syncAgreementVersionStates.exec(input, createContext())).rejects.toThrow(
            'Reporter returned an invalid response',
        );
    });
});
