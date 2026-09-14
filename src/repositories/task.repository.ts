import Task, { ITask, TaskType } from '../models/task.model.js';
import TaskExecution from '../models/taskExecution.model.js';
import { DuplicateKeyError } from '../utils/customErrors.js';
import { buildTaskDeduplicationKey } from '../utils/taskIdentity.js';

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

export interface CreateTaskResult {
    task: ITask;
    created: boolean;
}

const isMongoDuplicateKeyError = (error: unknown): error is { code: number } => {
    return error !== null && typeof error === 'object' && 'code' in error && error.code === 11000;
};

const findEquivalentLegacyTask = async (task: ITask) => {
    const legacyTasks = await Task.find({
        script: task.script,
        type: task.type,
        deduplicationKey: { $exists: false },
    });

    return legacyTasks.find(
        (legacyTask) => buildTaskDeduplicationKey(legacyTask) === task.deduplicationKey,
    );
};

export const createTask = async (data: Partial<ITask>): Promise<CreateTaskResult> => {
    const task = new Task(data);
    await task.validate();

    const existingTask =
        (await Task.findOne({ deduplicationKey: task.deduplicationKey })) ??
        (await findEquivalentLegacyTask(task));
    if (existingTask) {
        return { task: existingTask, created: false };
    }

    try {
        return { task: await task.save(), created: true };
    } catch (error) {
        if (!isMongoDuplicateKeyError(error)) {
            throw error;
        }

        const concurrentlyCreatedTask = await Task.findOne({
            deduplicationKey: task.deduplicationKey,
        });
        if (!concurrentlyCreatedTask) {
            throw error;
        }

        return { task: concurrentlyCreatedTask, created: false };
    }
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
    const task = await Task.findById(id);
    if (!task) return null;

    task.set(data);
    try {
        return await task.save();
    } catch (error) {
        if (isMongoDuplicateKeyError(error)) {
            throw new DuplicateKeyError('An equivalent task already exists');
        }
        throw error;
    }
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
