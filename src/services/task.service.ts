import * as taskRepository from '../repositories/task.repository.js';
import * as taskScheduler from '../workers/taskScheduler.js';
import { ITask } from '../models/task.model.js';

export const createTask = async (data: Partial<ITask>) => {
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

export const getTaskExecutions = async (id: string) => {
    return await taskRepository.getTaskExecutions(id);
};
