import { describe, expect, it } from 'vitest';
import { type Request, type Response, type NextFunction } from 'express';
import {
    validateTask,
    validateTaskDeleteFilters,
    validateTaskFilters,
} from '../src/middlewares/task.validator.js';
import { ValidationError } from '../src/utils/customErrors.js';

async function runValidator(
    validator: typeof validateTask | typeof validateTaskFilters | typeof validateTaskDeleteFilters,
    body: Record<string, unknown>,
) {
    const req = { body } as Request;
    const res = {} as Response;
    let error: unknown;

    for (const middleware of validator.slice(0, -1)) {
        await (middleware as { run: (req: Request) => Promise<unknown> }).run(req);
    }

    const finalMiddleware = validator[validator.length - 1] as (
        req: Request,
        res: Response,
        next: NextFunction,
    ) => void;

    finalMiddleware(req, res, (nextError?: unknown) => {
        error = nextError;
    });

    return { body: req.body, error };
}

async function runValidateTask(body: Record<string, unknown>) {
    return runValidator(validateTask, body);
}

async function runValidateTaskFilters(body: Record<string, unknown>) {
    return runValidator(validateTaskFilters, body);
}

async function runValidateTaskDeleteFilters(body: Record<string, unknown>) {
    return runValidator(validateTaskDeleteFilters, body);
}

describe('validateTask', () => {
    it('filters past runDates from programmed tasks', async () => {
        const pastRunDate = new Date(Date.now() - 60_000).toISOString();
        const firstFutureRunDate = new Date(Date.now() + 60_000).toISOString();
        const secondFutureRunDate = new Date(Date.now() + 120_000).toISOString();

        const result = await runValidateTask({
            script: 'sum',
            inputArgs: { a: 1, b: 2 },
            type: 'PROGRAMMED',
            enabled: true,
            runDates: [pastRunDate, firstFutureRunDate, secondFutureRunDate],
        });

        expect(result.error).toBeUndefined();
        expect(result.body.runDates).toEqual([firstFutureRunDate, secondFutureRunDate]);
    });

    it('fails programmed tasks when all runDates are in the past', async () => {
        const result = await runValidateTask({
            script: 'sum',
            inputArgs: { a: 1, b: 2 },
            type: 'PROGRAMMED',
            enabled: true,
            runDates: [
                new Date(Date.now() - 120_000).toISOString(),
                new Date(Date.now() - 60_000).toISOString(),
            ],
        });

        expect(result.error).toBeInstanceOf(ValidationError);
        expect((result.error as ValidationError).details).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    msg: 'runDates must contain at least one future date',
                    path: 'runDates',
                }),
            ]),
        );
    });
});

describe('validateTaskFilters', () => {
    it('rejects Mongo operators in inputArgs filters', async () => {
        const result = await runValidateTaskFilters({
            inputArgs: {
                fetcherId: { $ne: null },
            },
        });

        expect(result.error).toBeInstanceOf(ValidationError);
        expect((result.error as ValidationError).details).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    msg: 'inputArgs.fetcherId contains unsafe key "$ne"',
                    path: 'inputArgs',
                }),
            ]),
        );
    });

    it('rejects dotted inputArgs filter keys', async () => {
        const result = await runValidateTaskFilters({
            inputArgs: {
                'fetcherConfig.workspaceId': 'workspace-1',
            },
        });

        expect(result.error).toBeInstanceOf(ValidationError);
        expect((result.error as ValidationError).details).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    msg: 'inputArgs contains unsafe key "fetcherConfig.workspaceId"',
                    path: 'inputArgs',
                }),
            ]),
        );
    });
});

describe('validateTaskDeleteFilters', () => {
    it('requires at least one filter for delete-by-filter requests', async () => {
        const result = await runValidateTaskDeleteFilters({});

        expect(result.error).toBeInstanceOf(ValidationError);
        expect((result.error as ValidationError).details).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    msg: 'at least one filter is required to delete tasks',
                    path: '',
                }),
            ]),
        );
    });

    it('accepts safe delete-by-filter requests', async () => {
        const result = await runValidateTaskDeleteFilters({
            script: 'fetchFetcher',
            inputArgs: {
                fetcherConfig: {
                    workspaceId: 'workspace-1',
                },
            },
            enabled: true,
        });

        expect(result.error).toBeUndefined();
    });
});
