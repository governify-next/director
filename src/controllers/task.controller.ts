import { Request, Response, NextFunction } from 'express';
import * as taskService from '../services/task.service.js';
import { sendSuccess } from '../utils/standardResponse.js';
import { NotFoundError } from '../utils/customErrors.js';

export const createTask = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const task = await taskService.createTask(req.body);
        return sendSuccess(res, { data: task, httpStatus: 201, message: 'Task created' });
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
