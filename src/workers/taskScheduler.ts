import Task, { ITask, TaskType } from '../models/task.model.js';
import { getLogger } from '../utils/logger.js';
import { taskQueue } from './taskQueue.js';

const logger = getLogger().setTag('taskScheduler.ts');

export async function scheduleRecurringTask(task: ITask) {
    const jobSchedulerId = `recurring-task-${task._id.toString()}`;

    await taskQueue.upsertJobScheduler(
        jobSchedulerId,
        {
            every: task.interval,
            startDate: task.startDate,
            endDate: task.endDate,
        },
        {
            name: 'execute-recurring-task',
            data: {
                taskId: task._id,
            },
        },
    );

    logger.debug(`Upserted recurring schedule for task ${task._id}.`);
}

export async function removeRecurringTask(taskId: string) {
    const jobSchedulerId = `recurring-task-${taskId}`;

    try {
        await taskQueue.removeJobScheduler(jobSchedulerId);
    } catch (error) {
        logger.debug(`Recurring scheduler for task ${taskId} was not removed.`, error);
    }
}

export async function scheduleOneTimeTask(task: ITask) {
    const jobId = `one-time-task-${task._id.toString()}`;

    await taskQueue.add(
        'execute-one-time-task',
        {
            taskId: task._id,
        },
        {
            jobId: jobId,
            delay: Math.max(0, task.startDate.getTime() - Date.now()),
        },
    );

    logger.debug(`Scheduled one-time task ${task._id.toString()}.`);
}

export async function removeOneTimeTask(taskId: string) {
    const jobId = `one-time-task-${taskId}`;

    try {
        await taskQueue.remove(jobId);
    } catch (error) {
        logger.debug(`One-time job for task ${taskId} was not removed.`, error);
    }
}

export async function scheduleTask(task: ITask) {
    if (task.type === TaskType.RECURRING) {
        await scheduleRecurringTask(task);
    } else if (task.type === TaskType.ONE_TIME) {
        await scheduleOneTimeTask(task);
    }
}

export async function removeTask(task: ITask) {
    if (task.type === TaskType.RECURRING) {
        await removeRecurringTask(task._id.toString());
    } else if (task.type === TaskType.ONE_TIME) {
        await removeOneTimeTask(task._id.toString());
    }
}

export async function loadRecurringTasks() {
    const now = new Date();

    const activeRecurringTasks = await Task.find({
        type: TaskType.RECURRING,
        startDate: { $lte: now },
        $or: [{ endDate: { $exists: false } }, { endDate: null }, { endDate: { $gte: now } }],
    });

    logger.info(`Found ${activeRecurringTasks.length} active recurring tasks.`);

    for (const task of activeRecurringTasks) {
        try {
            logger.debug(`Scheduling recurring task ${task._id} from database.`);
            await scheduleRecurringTask(task);
        } catch (error) {
            logger.error(`Failed scheduling recurring task ${task._id} during load.`, error);
        }
    }

    logger.info(`Finished loading recurring tasks from database.`);
}
