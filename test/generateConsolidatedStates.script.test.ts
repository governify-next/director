import { Types } from 'mongoose';
import { afterEach, describe, expect, it, vi } from 'vitest';
import generateConsolidatedStates from '../src/scripts/generateConsolidatedStates.js';
import { TaskExecutionContext } from '../src/types/script.js';

describe('generateConsolidatedStates script', () => {
    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it('generates consolidated states at the scheduled time using CAPTURE and KEEP', async () => {
        const fetchMock = vi.fn().mockResolvedValue({
            json: async () => ({
                success: true,
                data: [{ status: 'COMPLETED' }],
            }),
        });
        vi.stubGlobal('fetch', fetchMock);

        const scheduledAt = new Date('2026-08-15T10:15:30.000Z');
        const signatureId = new Types.ObjectId().toString();
        const logger = { info: vi.fn() } as unknown as TaskExecutionContext['logger'];

        const result = await generateConsolidatedStates.exec(
            {
                orgName: 'organization',
                scopeId: 'scope-id',
                agColName: 'agreement',
                orgId: 'organization-id',
                agColId: 'agreement-collection-id',
                agreementVersion: 2,
                versionNumber: 7,
                signatureId,
            },
            {
                taskId: new Types.ObjectId(),
                scheduledAt,
                logger,
            },
        );

        expect(fetchMock).toHaveBeenCalledOnce();
        const [url, request] = fetchMock.mock.calls[0];
        expect(url).toBe(
            'http://localhost:5902/api/v1/organizations/organization/scopes/scope-id/agreementCollections/agreement/agreementVersions/2/states/consolidated/generate?isAsync=false',
        );
        expect(request).toMatchObject({ method: 'POST' });
        expect(JSON.parse(request.body)).toEqual({
            date: scheduledAt.toISOString(),
            temporalMode: 'CAPTURE',
            ifExists: 'KEEP',
            signatureIds: [signatureId],
        });
        expect(result).toBe('1 states successfully generated');
    });

    it('requires a fixed positive agreementVersion and a valid signatureId', () => {
        const baseInput = {
            orgName: 'organization',
            scopeId: 'scope-id',
            agColName: 'agreement',
            orgId: 'organization-id',
            agColId: 'agreement-collection-id',
            versionNumber: 7,
            signatureId: new Types.ObjectId().toString(),
        };

        expect(
            generateConsolidatedStates.inputSchema.safeParse({
                ...baseInput,
                agreementVersion: 2,
            }).success,
        ).toBe(true);
        expect(
            generateConsolidatedStates.inputSchema.safeParse({
                ...baseInput,
                agreementVersion: 0,
            }).success,
        ).toBe(false);
        expect(
            generateConsolidatedStates.inputSchema.safeParse({
                ...baseInput,
                agreementVersion: 'auditableVersion',
            }).success,
        ).toBe(false);
        expect(
            generateConsolidatedStates.inputSchema.safeParse({
                ...baseInput,
                agreementVersion: 2,
                signatureId: 'not-an-object-id',
            }).success,
        ).toBe(false);
    });
});
