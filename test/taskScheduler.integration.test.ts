import { randomUUID } from 'node:crypto';
import { Queue } from 'bullmq';
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import Task, { ITask, TaskType } from '../src/models/task.model.js';
import { loadRecurringTasks } from '../src/workers/taskScheduler.js';

const testQueue = vi.hoisted(() => ({ queue: undefined as Queue | undefined }));

vi.mock('../src/workers/taskQueue.js', () => ({
    get taskQueue() {
        return testQueue.queue;
    },
}));

// Use a unique queue: never load, execute, or delete application jobs.
describe.skipIf(!process.env.TEST_REDIS_URI)('recurring task restoration with Redis', () => {
    let queue: Queue;

    beforeAll(async () => {
        queue = new Queue(`director-restart-test-${randomUUID()}`, {
            connection: { url: process.env.TEST_REDIS_URI! },
        });
        testQueue.queue = queue;
        await queue.waitUntilReady();
    });

    afterEach(async () => {
        await queue.obliterate({ force: true });
    });

    afterAll(async () => {
        await queue.close();
    });

    async function createRecurringTask(overrides: Partial<ITask> = {}) {
        return Task.create({
            script: 'sum',
            inputArgs: { a: 1, b: 2 },
            type: TaskType.RECURRING,
            enabled: true,
            startDate: new Date(Date.now() - 90_000),
            interval: 60_000,
            ...overrides,
        });
    }

    async function seedOverdueJob(task: ITask) {
        return queue.upsertJobScheduler(
            `recurring-task-${task._id}`,
            { every: task.interval!, startDate: new Date(Date.now() - 60_000) },
            { name: 'execute-recurring-task', data: { taskId: task._id.toString() } },
        );
    }

    it('replaces a due job retained in Redis with the next anchored occurrence', async () => {
        const task = await createRecurringTask();
        const overdueJob = await seedOverdueJob(task);
        expect(await overdueJob!.getState()).toBe('waiting');

        await loadRecurringTasks();

        const scheduler = await queue.getJobScheduler(`recurring-task-${task._id}`);
        expect(scheduler!.next).toBe(task.startDate!.getTime() + 120_000);
        expect(await queue.getWaitingCount()).toBe(0);
        expect(await queue.getDelayedCount()).toBe(1);
        expect(await queue.getJob(overdueJob!.id!)).toBeUndefined();

        // Repeated restarts before the next occurrence must keep the same date.
        await loadRecurringTasks();
        expect((await queue.getJobScheduler(`recurring-task-${task._id}`))!.next).toBe(
            scheduler!.next,
        );
        expect(await queue.getWaitingCount()).toBe(0);
        expect(await queue.getDelayedCount()).toBe(1);
    });

    it('restores an anchored schedule when Redis has no saved scheduler', async () => {
        const task = await createRecurringTask({
            anchorDate: new Date(Date.now() - 75_000),
        });

        await loadRecurringTasks();

        expect((await queue.getJobScheduler(`recurring-task-${task._id}`))!.next).toBe(
            task.anchorDate!.getTime() + 120_000,
        );
        expect(await queue.getWaitingCount()).toBe(0);
    });

    it('discards a delayed occurrence that expired while the worker was stopped', async () => {
        const task = await createRecurringTask();
        const oldJob = await queue.upsertJobScheduler(
            `recurring-task-${task._id}`,
            { every: task.interval!, startDate: new Date(Date.now() + 100) },
            { name: 'execute-recurring-task', data: { taskId: task._id.toString() } },
        );
        await new Promise((resolve) => setTimeout(resolve, 150));
        expect(await oldJob!.getState()).toBe('delayed');

        await loadRecurringTasks();

        expect(await queue.getJob(oldJob!.id!)).toBeUndefined();
        expect((await queue.getJobScheduler(`recurring-task-${task._id}`))!.next).toBe(
            task.startDate!.getTime() + 120_000,
        );
        expect(await queue.getWaitingCount()).toBe(0);
        expect(await queue.getDelayedCount()).toBe(1);
    });

    it('restores enabled tasks whose start date is still in the future', async () => {
        const task = await createRecurringTask({ startDate: new Date(Date.now() + 60_000) });

        await loadRecurringTasks();

        expect((await queue.getJobScheduler(`recurring-task-${task._id}`))!.next).toBe(
            task.startDate!.getTime(),
        );
        expect(await queue.getWaitingCount()).toBe(0);
        expect(await queue.getDelayedCount()).toBe(1);
    });

    it.each([-30_000, 10_000])(
        'removes old occurrences when there are no runs left before endDate (offset %i)',
        async (endOffset) => {
            const task = await createRecurringTask({ endDate: new Date(Date.now() + endOffset) });
            await seedOverdueJob(task);

            await loadRecurringTasks();

            expect(await queue.getJobScheduler(`recurring-task-${task._id}`)).toBeUndefined();
            expect(await queue.getWaitingCount()).toBe(0);
            expect(await queue.getDelayedCount()).toBe(0);
        },
    );

    it('does not recreate disabled or immediate tasks', async () => {
        await createRecurringTask({ enabled: false });
        await Task.create({ script: 'sum', type: TaskType.IMMEDIATE, enabled: true });

        await loadRecurringTasks();

        expect(await queue.getJobSchedulersCount()).toBe(0);
        expect(await queue.getWaitingCount()).toBe(0);
    });

    it('fails restoration if an old schedule cannot be removed', async () => {
        await createRecurringTask();
        const remove = vi
            .spyOn(queue, 'removeJobScheduler')
            .mockRejectedValueOnce(new Error('Redis unavailable'));
        try {
            await expect(loadRecurringTasks()).rejects.toThrow('Redis unavailable');
        } finally {
            remove.mockRestore();
        }
    });
});
