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

export async function scheduleManyTimesTask(task: ITask) {
    for (const runDate of task.runDates!) {
        if (runDate.getTime() < Date.now()) {
            continue;
        }

        const jobId = `many-times-task-${task._id.toString()}-${runDate.getTime()}`;

        await taskQueue.add(
            'execute-many-times-task',
            {
                taskId: task._id,
            },
            {
                jobId: jobId,
                delay: runDate.getTime(),
            },
        );

        logger.debug(
            `Scheduled many-times task ${task._id.toString()} for run date ${runDate.toISOString()}.`,
        );
    }
}

export async function removeManyTimesTask(task: ITask) {
    for (const runDate of task.runDates!) {
        const jobId = `many-times-task-${task._id.toString()}-${runDate.getTime()}`;

        try {
            await taskQueue.remove(jobId);
        } catch (error) {
            logger.debug(
                `Many-times job for task ${task._id} and run date ${runDate.toISOString()} was not removed.`,
                error,
            );
        }
    }
}

export async function scheduleTask(task: ITask) {
    if (task.type === TaskType.RECURRING) {
        await scheduleRecurringTask(task);
    } else if (task.type === TaskType.ONE_TIME) {
        await scheduleOneTimeTask(task);
    } else if (task.type === TaskType.MANY_TIMES) {
        await scheduleManyTimesTask(task);
    }
}

export async function removeTask(task: ITask) {
    if (task.type === TaskType.RECURRING) {
        await removeRecurringTask(task._id.toString());
    } else if (task.type === TaskType.ONE_TIME) {
        await removeOneTimeTask(task._id.toString());
    } else if (task.type === TaskType.MANY_TIMES) {
        await removeManyTimesTask(task);
    }
}

export async function loadRecurringTasks() {
    const now = new Date();

    const activeRecurringTasks = await Task.find({
        type: TaskType.RECURRING,
        enabled: true,
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

export async function loadManyTimesTasks() {
    const now = new Date();

    const activeManyTimesTasks = await Task.find({
        type: TaskType.MANY_TIMES,
        enabled: true,
        runDates: { $elemMatch: { $gte: now } },
    });

    logger.info(`Found ${activeManyTimesTasks.length} active many-times tasks.`);

    for (const task of activeManyTimesTasks) {
        try {
            logger.debug(`Scheduling many-times task ${task._id} from database.`);
            await scheduleManyTimesTask(task);
        } catch (error) {
            logger.error(`Failed scheduling many-times task ${task._id} during load.`, error);
        }
    }

    logger.info(`Finished loading many-times tasks from database.`);
}
