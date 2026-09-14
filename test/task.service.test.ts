import { afterEach, describe, expect, it, vi } from 'vitest';
import * as taskService from '../src/services/task.service.js';
import * as taskRepository from '../src/repositories/task.repository.js';
import * as taskScheduler from '../src/workers/taskScheduler.js';
import Task, { TaskType } from '../src/models/task.model.js';

afterEach(() => {
    vi.restoreAllMocks();
});

describe('task service deduplication', () => {
    it('schedules only the first creation and returns the existing task afterwards', async () => {
        const scheduleTaskSpy = vi.spyOn(taskScheduler, 'scheduleTask').mockResolvedValue();
        const taskInput = {
            script: 'sum',
            inputArgs: { a: 5, b: 8 },
            type: TaskType.IMMEDIATE,
            enabled: true,
        };

        const firstTaskCreation = await taskService.createTask(taskInput);
        const secondTaskCreation = await taskService.createTask(taskInput);

        expect(firstTaskCreation.created).toBe(true);
        expect(secondTaskCreation.created).toBe(false);
        expect(secondTaskCreation.task._id.toString()).toBe(firstTaskCreation.task._id.toString());
        expect(firstTaskCreation.task.inputArgs).toEqual(taskInput.inputArgs);
        expect(firstTaskCreation.task.toJSON()).not.toHaveProperty('deduplicationKey');
        expect(scheduleTaskSpy).toHaveBeenCalledOnce();
    });

    it('removes a newly stored task when scheduling fails', async () => {
        vi.spyOn(taskScheduler, 'scheduleTask').mockRejectedValue(new Error('Redis unavailable'));
        const removeTaskSpy = vi.spyOn(taskScheduler, 'removeTask').mockResolvedValue();

        await expect(
            taskService.createTask({
                script: 'sum',
                inputArgs: { a: 5, b: 8 },
                type: TaskType.IMMEDIATE,
                enabled: true,
            }),
        ).rejects.toThrow('Redis unavailable');

        expect(removeTaskSpy).toHaveBeenCalledOnce();
        expect(await Task.countDocuments()).toBe(0);
    });

    it('disables and unschedules an equivalent enabled task when requested', async () => {
        const existingTask = await new Task({
            script: 'sum',
            inputArgs: { a: 5, b: 8 },
            type: TaskType.IMMEDIATE,
            enabled: true,
        }).save();
        const scheduleTaskSpy = vi.spyOn(taskScheduler, 'scheduleTask').mockResolvedValue();
        const removeTaskSpy = vi.spyOn(taskScheduler, 'removeTask').mockResolvedValue();

        const taskCreation = await taskService.createTask({
            script: 'sum',
            inputArgs: { a: 5, b: 8 },
            type: TaskType.IMMEDIATE,
            enabled: false,
        });

        expect(taskCreation.created).toBe(false);
        expect(taskCreation.task._id.toString()).toBe(existingTask._id.toString());
        expect(taskCreation.task.enabled).toBe(false);
        expect(scheduleTaskSpy).not.toHaveBeenCalled();
        expect(removeTaskSpy).toHaveBeenCalledOnce();
    });

    it('enables and schedules an equivalent disabled task when requested', async () => {
        const existingTask = await new Task({
            script: 'sum',
            inputArgs: { a: 5, b: 8 },
            type: TaskType.IMMEDIATE,
            enabled: false,
        }).save();
        const scheduleTaskSpy = vi.spyOn(taskScheduler, 'scheduleTask').mockResolvedValue();
        const removeTaskSpy = vi.spyOn(taskScheduler, 'removeTask').mockResolvedValue();

        const taskCreation = await taskService.createTask({
            script: 'sum',
            inputArgs: { a: 5, b: 8 },
            type: TaskType.IMMEDIATE,
            enabled: true,
        });

        expect(taskCreation.created).toBe(false);
        expect(taskCreation.task._id.toString()).toBe(existingTask._id.toString());
        expect(taskCreation.task.enabled).toBe(true);
        expect(scheduleTaskSpy).toHaveBeenCalledOnce();
        expect(removeTaskSpy).not.toHaveBeenCalled();
    });

    it('does nothing when an equivalent task already has the requested enabled state', async () => {
        const existingTask = await new Task({
            script: 'sum',
            inputArgs: { a: 5, b: 8 },
            type: TaskType.IMMEDIATE,
            enabled: true,
        }).save();
        const updateTaskSpy = vi.spyOn(taskRepository, 'updateTask');
        const scheduleTaskSpy = vi.spyOn(taskScheduler, 'scheduleTask').mockResolvedValue();
        const removeTaskSpy = vi.spyOn(taskScheduler, 'removeTask').mockResolvedValue();

        const taskCreation = await taskService.createTask({
            script: 'sum',
            inputArgs: { a: 5, b: 8 },
            type: TaskType.IMMEDIATE,
            enabled: true,
        });

        expect(taskCreation.created).toBe(false);
        expect(taskCreation.task._id.toString()).toBe(existingTask._id.toString());
        expect(updateTaskSpy).not.toHaveBeenCalled();
        expect(scheduleTaskSpy).not.toHaveBeenCalled();
        expect(removeTaskSpy).not.toHaveBeenCalled();
    });

    it('stores only input arguments declared by the script schema', async () => {
        vi.spyOn(taskScheduler, 'scheduleTask').mockResolvedValue();

        const taskCreation = await taskService.createTask({
            script: 'generateConsolidatedStates',
            inputArgs: {
                orgName: 'organization',
                scopeId: 'scope-id',
                agColName: 'legacy-agreement-name',
                orgId: 'organization-id',
                agColId: 'agreement-collection-id',
                agreementVersion: 1,
                signatureId: 'signature-id',
            },
            type: TaskType.IMMEDIATE,
            enabled: true,
        });

        expect(taskCreation.task.inputArgs).toEqual({
            orgName: 'organization',
            scopeId: 'scope-id',
            orgId: 'organization-id',
            agColId: 'agreement-collection-id',
            agreementVersion: 1,
            signatureId: 'signature-id',
        });
        expect(taskCreation.task.inputArgs).not.toHaveProperty('agColName');
    });
});
