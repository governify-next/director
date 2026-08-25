import { NextFunction, Request, Response } from 'express';
import { afterEach, describe, expect, it, vi } from 'vitest';
import * as taskController from '../src/controllers/task.controller.js';
import * as taskService from '../src/services/task.service.js';

afterEach(() => {
    vi.restoreAllMocks();
});

describe('task creation controller', () => {
    it.each([
        { created: true, expectedStatus: 201, expectedMessage: 'Task created' },
        { created: false, expectedStatus: 200, expectedMessage: 'Task already exists' },
    ])(
        'returns $expectedStatus when created is $created',
        async ({ created, expectedStatus, expectedMessage }) => {
            vi.spyOn(taskService, 'createTask').mockResolvedValue({
                task: { _id: 'task-id' },
                created,
            } as never);
            const json = vi.fn();
            const status = vi.fn(() => ({ json }));
            const request = { body: { script: 'sum' } } as Request;
            const response = { status } as unknown as Response;
            const next = vi.fn() as unknown as NextFunction;

            await taskController.createTask(request, response, next);

            expect(status).toHaveBeenCalledWith(expectedStatus);
            expect(json).toHaveBeenCalledWith(
                expect.objectContaining({
                    message: expectedMessage,
                    httpStatus: expectedStatus,
                    data: { _id: 'task-id' },
                }),
            );
            expect(next).not.toHaveBeenCalled();
        },
    );
});
