import * as taskRepository from '../repositories/task.repository.js';
import type { TaskFilters } from '../repositories/task.repository.js';
import * as scriptRepository from '../repositories/script.repository.js';
import * as taskScheduler from '../workers/taskScheduler.js';
import { ITask } from '../models/task.model.js';
import { ValidationError } from '../utils/customErrors.js';

export const createTask = async (data: Partial<ITask>) => {
    const script = scriptRepository.getScriptByName(data.script!);
    if (!script) {
        throw new Error('Script not found');
    }

    const parseResult = script.inputSchema.safeParse(data.inputArgs);
    if (!parseResult.success) {
        throw new ValidationError('Invalid inputArgs', parseResult.error.issues);
    }

    const taskCreation = await taskRepository.createTask({
        ...data,
        inputArgs: parseResult.data,
    });

    if (
        !taskCreation.created &&
        data.enabled !== undefined &&
        taskCreation.task.enabled !== data.enabled
    ) {
        const updatedTask = await taskRepository.updateTask(taskCreation.task._id.toString(), {
            enabled: data.enabled,
        });

        if (!updatedTask) {
            throw new Error('Task not found while updating enabled state');
        }

        if (updatedTask.enabled) {
            await taskScheduler.scheduleTask(updatedTask);
        } else {
            await taskScheduler.removeTask(updatedTask);
        }

        return { task: updatedTask, created: false };
    }

    if (taskCreation.created) {
        try {
            await taskScheduler.scheduleTask(taskCreation.task);
        } catch (error) {
            await taskScheduler.removeTask(taskCreation.task);
            await taskRepository.deleteTask(taskCreation.task._id.toString());
            throw error;
        }
    }
    return taskCreation;
};

export const getTasks = async () => {
    return await taskRepository.getTasks();
};

export const searchTasks = async (filters: TaskFilters) => {
    return await taskRepository.getTasksByFilters(filters);
};

export const deleteTasksByFilters = async (filters: TaskFilters) => {
    const tasks = await taskRepository.getTasksByFilters(filters);
    const taskIds = tasks.map((task) => task._id.toString());
    const deletedTasks = await taskRepository.deleteTasks(taskIds);

    await Promise.all(tasks.map((task) => taskScheduler.removeTask(task)));
    return deletedTasks;
};

export const enableTasksByFilters = async (filters: TaskFilters) => {
    const tasks = await taskRepository.getTasksByFilters(filters);
    let updatedTasksCount = 0;

    for (const task of tasks) {
        if (!task.enabled) {
            const enabledTask = await taskRepository.updateTask(task._id.toString(), {
                enabled: true,
            });
            if (!enabledTask) continue;
            updatedTasksCount++;
            await taskScheduler.scheduleTask(enabledTask);
            continue;
        }

        await taskScheduler.scheduleTask(task);
    }

    return {
        matchedTasksCount: tasks.length,
        updatedTasksCount,
    };
};

export const disableTasksByFilters = async (filters: TaskFilters) => {
    const tasks = await taskRepository.getTasksByFilters(filters);
    let updatedTasksCount = 0;

    for (const task of tasks) {
        if (task.enabled) {
            const disabledTask = await taskRepository.updateTask(task._id.toString(), {
                enabled: false,
            });
            if (!disabledTask) continue;
            updatedTasksCount++;
        }

        await taskScheduler.removeTask(task);
    }

    return {
        matchedTasksCount: tasks.length,
        updatedTasksCount,
    };
};

export const getTaskById = async (id: string) => {
    return await taskRepository.getTaskById(id);
};

export const updateTask = async (id: string, data: Partial<ITask>) => {
    const currentTask = await taskRepository.getTaskById(id);
    if (!currentTask) return null;

    if (data.script && data.script !== currentTask.script) {
        const script = scriptRepository.getScriptByName(data.script);
        if (!script) {
            throw new Error('Script not found');
        }
    }

    if (data.inputArgs && data.inputArgs !== currentTask.inputArgs) {
        const script = scriptRepository.getScriptByName(data.script ?? currentTask.script);

        const parseResult = script.inputSchema.safeParse(data.inputArgs);
        if (!parseResult.success) {
            throw new ValidationError('Invalid inputArgs', parseResult.error.issues);
        }
    }

    const updatedTask = await taskRepository.updateTask(id, data);
    if (!updatedTask) return null;

    await taskScheduler.removeTask(currentTask);
    await taskScheduler.scheduleTask(updatedTask);
    return updatedTask;
};

export const deleteTask = async (id: string) => {
    const deletedTask = await taskRepository.deleteTask(id);
    if (!deletedTask) return null;

    await taskScheduler.removeTask(deletedTask);
    return deletedTask;
};

export const deleteAllTasks = async () => {
    const tasks = await taskRepository.getTasks();
    const taskIds = tasks.map((task) => task._id.toString());
    const deletedTasks = await taskRepository.deleteTasks(taskIds);

    await Promise.all(tasks.map((task) => taskScheduler.removeTask(task)));
    return deletedTasks;
};

export const enableTask = async (id: string) => {
    const task = await taskRepository.getTaskById(id);
    if (!task) return null;

    const enabledTask = await taskRepository.updateTask(id, { enabled: true });
    if (!enabledTask) return null;

    await taskScheduler.scheduleTask(enabledTask);
    return enabledTask;
};

export const disableTask = async (id: string) => {
    const task = await taskRepository.getTaskById(id);
    if (!task) return null;

    const disabledTask = await taskRepository.updateTask(id, { enabled: false });
    if (!disabledTask) return null;

    await taskScheduler.removeTask(disabledTask);
    return disabledTask;
};

export const getTaskExecutions = async (id: string) => {
    return await taskRepository.getTaskExecutions(id);
};
