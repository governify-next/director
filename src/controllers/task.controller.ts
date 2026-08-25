import { Request, Response, NextFunction } from 'express';
import * as taskService from '../services/task.service.js';
import { sendSuccess } from '../utils/standardResponse.js';
import { NotFoundError } from '../utils/customErrors.js';

export const createTask = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { task, created } = await taskService.createTask(req.body);
        return sendSuccess(res, {
            data: task,
            httpStatus: created ? 201 : 200,
            message: created ? 'Task created' : 'Task already exists',
        });
    } catch (err) {
        next(err);
    }
};

export const getTasks = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const tasks = await taskService.getTasks();
        return sendSuccess(res, { data: tasks });
    } catch (err) {
        next(err);
    }
};

export const searchTasks = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const tasks = await taskService.searchTasks(req.body ?? {});
        return sendSuccess(res, { data: tasks });
    } catch (err) {
        next(err);
    }
};

export const deleteTasksByFilters = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const result = await taskService.deleteTasksByFilters(req.body ?? {});
        return sendSuccess(res, { data: result, message: 'Tasks deleted' });
    } catch (err) {
        next(err);
    }
};

export const enableTasksByFilters = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const result = await taskService.enableTasksByFilters(req.body ?? {});
        return sendSuccess(res, { data: result, message: 'Tasks enabled' });
    } catch (err) {
        next(err);
    }
};

export const disableTasksByFilters = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const result = await taskService.disableTasksByFilters(req.body ?? {});
        return sendSuccess(res, { data: result, message: 'Tasks disabled' });
    } catch (err) {
        next(err);
    }
};

export const getTaskById = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const task = await taskService.getTaskById(req.params.id);
        if (!task) throw new NotFoundError('Task not found');
        return sendSuccess(res, { data: task });
    } catch (err) {
        next(err);
    }
};

export const updateTask = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const task = await taskService.updateTask(req.params.id, req.body);
        if (!task) throw new NotFoundError('Task not found');
        return sendSuccess(res, { data: task, message: 'Task updated' });
    } catch (err) {
        next(err);
    }
};

export const deleteTask = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const task = await taskService.deleteTask(req.params.id);
        if (!task) throw new NotFoundError('Task not found');
        return sendSuccess(res, { data: null, message: 'Task deleted' });
    } catch (err) {
        next(err);
    }
};

export const deleteAllTasks = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const result = await taskService.deleteAllTasks();
        return sendSuccess(res, { data: result, message: 'All tasks deleted' });
    } catch (err) {
        next(err);
    }
};

export const enableTask = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const task = await taskService.enableTask(req.params.id);
        if (!task) throw new NotFoundError('Task not found');
        return sendSuccess(res, { data: task, message: 'Task enabled' });
    } catch (err) {
        next(err);
    }
};

export const disableTask = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const task = await taskService.disableTask(req.params.id);
        if (!task) throw new NotFoundError('Task not found');
        return sendSuccess(res, { data: task, message: 'Task disabled' });
    } catch (err) {
        next(err);
    }
};

export const getTaskExecutions = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const executions = await taskService.getTaskExecutions(req.params.id);
        return sendSuccess(res, { data: executions });
    } catch (err) {
        next(err);
    }
};
