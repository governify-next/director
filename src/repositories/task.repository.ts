import Task, { ITask } from '../models/task.model.js';
import TaskExecution from '../models/taskExecution.model.js';

export const createTask = async (data: Partial<ITask>) => {
    const task = new Task(data);
    return await task.save();
};

export const getTasks = async () => {
    return await Task.find();
};

export const getTaskById = async (id: string) => {
    return await Task.findById(id);
};

export const updateTask = async (id: string, data: Partial<ITask>) => {
    return await Task.findByIdAndUpdate(id, data, { new: true, runValidators: true });
};

export const deleteTask = async (id: string) => {
    return await Task.findByIdAndDelete(id);
};

export const getTaskExecutions = async (id: string) => {
    return await TaskExecution.find({ taskId: id }).sort({ startDate: -1 });
};
