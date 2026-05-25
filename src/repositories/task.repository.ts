import Task, { ITask, TaskType } from '../models/task.model.js';
import TaskExecution from '../models/taskExecution.model.js';

export interface TaskFilters {
    script?: string;
    inputArgs?: Record<string, unknown>;
    type?: TaskType;
    enabled?: boolean;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
    return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function addInputArgsFilters(
    filter: Record<string, unknown>,
    inputArgs: Record<string, unknown>,
    prefix = 'inputArgs',
) {
    for (const [key, value] of Object.entries(inputArgs)) {
        const path = `${prefix}.${key}`;

        if (isPlainObject(value)) {
            addInputArgsFilters(filter, value, path);
            continue;
        }

        filter[path] = value;
    }
}

export const createTask = async (data: Partial<ITask>) => {
    const task = new Task(data);
    return await task.save();
};

export const getTasks = async () => {
    return await Task.find();
};

export const getTasksByFilters = async (filters: TaskFilters) => {
    const query: Record<string, unknown> = {};

    if (filters.script !== undefined) {
        query.script = filters.script;
    }
    if (filters.type !== undefined) {
        query.type = filters.type;
    }
    if (filters.enabled !== undefined) {
        query.enabled = filters.enabled;
    }
    if (filters.inputArgs !== undefined) {
        addInputArgsFilters(query, filters.inputArgs);
    }

    return await Task.find(query);
};

export const getTaskById = async (id: string) => {
    return await Task.findById(id);
};

export const updateTask = async (id: string, data: Partial<ITask>) => {
    return await Task.findByIdAndUpdate(id, data, { new: true, runValidators: true });
};

export const deleteTask = async (id: string) => {
    await TaskExecution.deleteMany({ taskId: id });
    return await Task.findByIdAndDelete(id);
};

export const deleteTasks = async (taskIds: string[]) => {
    const executionDeleteResult = await TaskExecution.deleteMany({
        taskId: { $in: taskIds },
    });
    const taskDeleteResult = await Task.deleteMany({ _id: { $in: taskIds } });

    return {
        deletedTasksCount: taskDeleteResult.deletedCount ?? 0,
        deletedExecutionsCount: executionDeleteResult.deletedCount ?? 0,
    };
};

export const getTaskExecutions = async (id: string) => {
    return await TaskExecution.find({ taskId: id }).sort({ startDate: -1 });
};
