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

export async function scheduleProgrammedTask(task: ITask) {
    for (const runDate of task.runDates!) {
        if (runDate.getTime() < Date.now()) {
            continue;
        }

        const jobId = `programmed-task-${task._id}-${runDate.getTime()}`;

        await taskQueue.add(
            'execute-programmed-task',
            {
                taskId: task._id,
            },
            {
                jobId: jobId,
                delay: Math.max(0, runDate.getTime() - Date.now()),
            },
        );

        logger.debug(
            `Scheduled programmed task ${task._id} for run date ${runDate.toISOString()}.`,
        );
    }
}

export async function removeProgrammedTask(task: ITask) {
    for (const runDate of task.runDates!) {
        const jobId = `programmed-task-${task._id}-${runDate.getTime()}`;

        try {
            await taskQueue.remove(jobId);
        } catch (error) {
            logger.debug(
                `Scheduled job for programmed task ${task._id} and run date ${runDate.toISOString()} was not removed.`,
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
    } else if (task.type === TaskType.PROGRAMMED) {
        await scheduleProgrammedTask(task);
    }
}

export async function removeTask(task: ITask) {
    if (task.type === TaskType.RECURRING) {
        await removeRecurringTask(task._id.toString());
    } else if (task.type === TaskType.PROGRAMMED) {
        await removeProgrammedTask(task);
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

export async function loadProgrammedTasks() {
    const now = new Date();

    const activeProgrammedTasks = await Task.find({
        type: TaskType.PROGRAMMED,
        enabled: true,
        runDates: { $elemMatch: { $gte: now } },
    });

    logger.info(`Found ${activeProgrammedTasks.length} active programmed tasks.`);

    for (const task of activeProgrammedTasks) {
        try {
            logger.debug(`Scheduling programmed task ${task._id} from database.`);
            await scheduleProgrammedTask(task);
        } catch (error) {
            logger.error(`Failed scheduling programmed task ${task._id} during load.`, error);
        }
    }

    logger.info(`Finished loading programmed tasks from database.`);
}
