import Task, { ITask, TaskType } from '../models/task.model.js';
import { getLogger } from '../utils/logger.js';
import { taskQueue } from './taskQueue.js';

const logger = getLogger().setTag('taskScheduler.ts');

export async function scheduleRecurringTask(task: ITask) {
    const jobSchedulerId = `recurring-task-${task._id}`;

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

export async function scheduleImmediateTask(task: ITask) {
    const jobId = `immediate-task-${task._id}`;

    await taskQueue.add(
        'execute-immediate-task',
        {
            taskId: task._id,
        },
        {
            jobId: jobId,
        },
    );

    logger.debug(`Scheduled immediate task ${task._id}.`);
}

export async function scheduleScheduledTask(task: ITask) {
    for (const runDate of task.runDates!) {
        if (runDate.getTime() < Date.now()) {
            continue;
        }

        const jobId = `scheduled-task-${task._id}-${runDate.getTime()}`;

        await taskQueue.add(
            'execute-scheduled-task',
            {
                taskId: task._id,
            },
            {
                jobId: jobId,
                delay: Math.max(0, runDate.getTime() - Date.now()),
            },
        );

        logger.debug(`Scheduled task ${task._id} for run date ${runDate.toISOString()}.`);
    }
}

export async function removeScheduledTask(task: ITask) {
    for (const runDate of task.runDates!) {
        const jobId = `scheduled-task-${task._id}-${runDate.getTime()}`;

        try {
            await taskQueue.remove(jobId);
        } catch (error) {
            logger.debug(
                `Scheduled job for task ${task._id} and run date ${runDate.toISOString()} was not removed.`,
                error,
            );
        }
    }
}

export async function scheduleTask(task: ITask) {
    if (task.type === TaskType.RECURRING) {
        await scheduleRecurringTask(task);
    } else if (task.type === TaskType.IMMEDIATE) {
        await scheduleImmediateTask(task);
    } else if (task.type === TaskType.SCHEDULED) {
        await scheduleScheduledTask(task);
    }
}

export async function removeTask(task: ITask) {
    if (task.type === TaskType.RECURRING) {
        await removeRecurringTask(task._id.toString());
    } else if (task.type === TaskType.SCHEDULED) {
        await removeScheduledTask(task);
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

export async function loadScheduledTasks() {
    const now = new Date();

    const activeScheduledTasks = await Task.find({
        type: TaskType.SCHEDULED,
        enabled: true,
        runDates: { $elemMatch: { $gte: now } },
    });

    logger.info(`Found ${activeScheduledTasks.length} active scheduled tasks.`);

    for (const task of activeScheduledTasks) {
        try {
            logger.debug(`Scheduling task ${task._id} from database.`);
            await scheduleScheduledTask(task);
        } catch (error) {
            logger.error(`Failed scheduling task ${task._id} during load.`, error);
        }
    }

    logger.info(`Finished loading scheduled tasks from database.`);
}
