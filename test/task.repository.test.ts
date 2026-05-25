import { describe, expect, it } from 'vitest';
import Task, { TaskType } from '../src/models/task.model.js';
import { getTasksByFilters } from '../src/repositories/task.repository.js';

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
