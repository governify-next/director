import { Types } from 'mongoose';
import { afterEach, describe, expect, it, vi } from 'vitest';
import generateConsolidatedStates from '../src/scripts/generateConsolidatedStates.js';
import { TaskExecutionContext } from '../src/types/script.js';

describe('generateConsolidatedStates script', () => {
    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it('starts asynchronous consolidated-state generation using CAPTURE and KEEP', async () => {
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
            'http://localhost:5902/api/v1/organizations/organization/scopes/scope-id/agreementCollections/agreement-collection-id/agreementVersions/2/states/consolidated/generate?isAsync=true',
        );
        expect(request).toMatchObject({ method: 'POST' });
        expect(JSON.parse(request.body)).toEqual({
            date: scheduledAt.toISOString(),
            temporalMode: 'CAPTURE',
            ifExists: 'KEEP',
            signatureIds: [signatureId],
        });
        expect(result).toBe(
            `Asynchronous consolidated-state generation accepted for signature ${signatureId}`,
        );
    });

    it('accepts a positive agreementVersion or auditableVersion and requires a string signatureId', () => {
        const baseInput = {
            orgName: 'organization',
            scopeId: 'scope-id',
            orgId: 'organization-id',
            agColId: 'agreement-collection-id',
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
        ).toBe(true);
        expect(
            generateConsolidatedStates.inputSchema.safeParse({
                ...baseInput,
                agreementVersion: 2,
                signatureId: 123,
            }).success,
        ).toBe(false);
    });
});
