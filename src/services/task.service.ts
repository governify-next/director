import * as taskRepository from '../repositories/task.repository.js';
import * as scriptRepository from '../repositories/script.repository.js';
import * as taskScheduler from '../workers/taskScheduler.js';
import { ITask } from '../models/task.model.js';

export const createTask = async (data: Partial<ITask>) => {
    const script = scriptRepository.getScriptByName(data.script!);
    if (!script) {
        throw new Error('Script not found');
    }

    const task = await taskRepository.createTask(data);

    await taskScheduler.scheduleTask(task);
    return task;
};

export const getTasks = async () => {
    return await taskRepository.getTasks();
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
