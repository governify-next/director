import { describe, expect, it } from 'vitest';
import Task, { TaskType } from '../src/models/task.model.js';
import { createTask, getTasksByFilters, updateTask } from '../src/repositories/task.repository.js';
import { DuplicateKeyError } from '../src/utils/customErrors.js';

describe('task repository filters', () => {
    it('filters tasks by optional fields and nested inputArgs', async () => {
        await Task.create([
            {
                script: 'fetchFetcher',
                inputArgs: {
                    fetcherId: 'FT_GQL_ZENHUB_ISSUES',
                    fetcherConfig: {
                        workspaceId: 'workspace-1',
                    },
                },
                type: TaskType.PROGRAMMED,
                enabled: true,
                runDates: [new Date(Date.now() + 60_000)],
            },
            {
                script: 'fetchFetcher',
                inputArgs: {
                    fetcherId: 'FT_GQL_ZENHUB_ISSUES',
                    fetcherConfig: {
                        workspaceId: 'workspace-2',
                    },
                },
                type: TaskType.PROGRAMMED,
                enabled: false,
                runDates: [new Date(Date.now() + 60_000)],
            },
        ]);

        const tasks = await getTasksByFilters({
            script: 'fetchFetcher',
            inputArgs: {
                fetcherConfig: {
                    workspaceId: 'workspace-1',
                },
            },
            type: TaskType.PROGRAMMED,
            enabled: true,
        });

        expect(tasks).toHaveLength(1);
        expect(tasks[0].inputArgs).toMatchObject({
            fetcherConfig: {
                workspaceId: 'workspace-1',
            },
        });
    });
});

describe('task deduplication', () => {
    it('reuses an equivalent task regardless of input key order or enabled state', async () => {
        await Task.init();
        const firstTaskCreation = await createTask({
            script: 'sum',
            inputArgs: { a: 1, b: 2 },
            type: TaskType.IMMEDIATE,
            enabled: true,
        });
        const secondTaskCreation = await createTask({
            script: 'sum',
            inputArgs: { b: 2, a: 1 },
            type: TaskType.IMMEDIATE,
            enabled: false,
        });

        expect(firstTaskCreation.created).toBe(true);
        expect(secondTaskCreation.created).toBe(false);
        expect(secondTaskCreation.task._id.toString()).toBe(firstTaskCreation.task._id.toString());
        expect(await Task.countDocuments()).toBe(1);
    });

    it('allows tasks with a different schedule', async () => {
        const startDate = new Date(Date.now() + 60_000);
        const firstTaskCreation = await createTask({
            script: 'sum',
            inputArgs: { a: 1, b: 2 },
            type: TaskType.RECURRING,
            enabled: true,
            startDate,
            interval: 60_000,
        });
        const secondTaskCreation = await createTask({
            script: 'sum',
            inputArgs: { a: 1, b: 2 },
            type: TaskType.RECURRING,
            enabled: true,
            startDate,
            interval: 120_000,
        });

        expect(firstTaskCreation.created).toBe(true);
        expect(secondTaskCreation.created).toBe(true);
        expect(await Task.countDocuments()).toBe(2);
    });

    it('prevents concurrent equivalent creations', async () => {
        await Task.init();
        const taskCreations = await Promise.all(
            Array.from({ length: 5 }, () =>
                createTask({
                    script: 'sum',
                    inputArgs: { a: 3, b: 4 },
                    type: TaskType.IMMEDIATE,
                    enabled: true,
                }),
            ),
        );

        expect(taskCreations.filter((taskCreation) => taskCreation.created)).toHaveLength(1);
        expect(new Set(taskCreations.map(({ task }) => task._id.toString())).size).toBe(1);
        expect(await Task.countDocuments()).toBe(1);
    });

    it('rejects an update that would duplicate another task', async () => {
        const firstTaskCreation = await createTask({
            script: 'sum',
            inputArgs: { a: 1, b: 2 },
            type: TaskType.IMMEDIATE,
            enabled: true,
        });
        const secondTaskCreation = await createTask({
            script: 'sum',
            inputArgs: { a: 3, b: 4 },
            type: TaskType.IMMEDIATE,
            enabled: true,
        });

        await expect(
            updateTask(secondTaskCreation.task._id.toString(), {
                inputArgs: firstTaskCreation.task.inputArgs,
            }),
        ).rejects.toBeInstanceOf(DuplicateKeyError);
        expect(await Task.countDocuments()).toBe(2);
    });
});
