import { describe, expect, it } from 'vitest';
import { type Request, type Response, type NextFunction } from 'express';
import { validateTask } from '../src/middlewares/task.validator.js';
import { ValidationError } from '../src/utils/customErrors.js';

async function runValidateTask(body: Record<string, unknown>) {
    const req = { body } as Request;
    const res = {} as Response;
    let error: unknown;

    for (const middleware of validateTask.slice(0, -1)) {
        await (middleware as { run: (req: Request) => Promise<unknown> }).run(req);
    }

    const finalMiddleware = validateTask[validateTask.length - 1] as (
        req: Request,
        res: Response,
        next: NextFunction,
    ) => void;

    finalMiddleware(req, res, (nextError?: unknown) => {
        error = nextError;
    });

    return { body: req.body, error };
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
