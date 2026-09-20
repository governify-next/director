import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const startup = vi.hoisted(() => ({
    connect: vi.fn(),
    recurring: vi.fn(),
    programmed: vi.fn(),
    cleanup: vi.fn(),
    worker: vi.fn(),
    listen: vi.fn(),
}));

vi.mock('../src/app.js', () => ({ default: { listen: startup.listen } }));
vi.mock('../src/db/mongo.js', () => ({ connectMongo: startup.connect }));
vi.mock('../src/workers/taskScheduler.js', () => ({
    loadRecurringTasks: startup.recurring,
    loadProgrammedTasks: startup.programmed,
}));
vi.mock('../src/workers/taskQueue.js', () => ({ startQueueCleanup: startup.cleanup }));
vi.mock('../src/workers/taskWorker.js', () => ({ startTaskWorker: startup.worker }));
vi.mock('../src/utils/serviceAuthentication.js', () => ({ fetchServiceToken: vi.fn() }));

describe('Director startup', () => {
    beforeEach(() => {
        vi.resetModules();
        for (const mock of Object.values(startup)) {
            mock.mockReset().mockResolvedValue(undefined);
        }
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('does not consume jobs or accept requests until schedules have been restored', async () => {
        const recurring = Promise.withResolvers<void>();
        const programmed = Promise.withResolvers<void>();
        startup.recurring.mockReturnValue(recurring.promise);
        startup.programmed.mockReturnValue(programmed.promise);

        await import('../src/server.js');
        await vi.waitFor(() => expect(startup.recurring).toHaveBeenCalledOnce());
        expect(startup.worker).not.toHaveBeenCalled();
        expect(startup.listen).not.toHaveBeenCalled();

        recurring.resolve();
        await vi.waitFor(() => expect(startup.programmed).toHaveBeenCalledOnce());
        expect(startup.worker).not.toHaveBeenCalled();

        programmed.resolve();
        await vi.waitFor(() => expect(startup.listen).toHaveBeenCalledOnce());
        expect(startup.worker).toHaveBeenCalledOnce();
        expect(startup.cleanup.mock.invocationCallOrder[0]).toBeLessThan(
            startup.worker.mock.invocationCallOrder[0],
        );
    });

    it('fails startup without consuming jobs when restoration fails', async () => {
        const exit = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);
        startup.recurring.mockRejectedValue(new Error('Redis unavailable'));

        await import('../src/server.js');

        await vi.waitFor(() => expect(exit).toHaveBeenCalledWith(1));
        expect(startup.worker).not.toHaveBeenCalled();
        expect(startup.listen).not.toHaveBeenCalled();
    });
});
