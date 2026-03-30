import { bootEnv } from '../config/bootConfig.js';
import { Queue } from 'bullmq';
import { TaskExecutionJobData } from '../types/script.js';
import { getTaskById } from '../services/task.service.js';
import { getLogger } from '../utils/logger.js';

const logger = getLogger().setTag('taskQueue.ts');

export const QUEUE_NAME = 'task-execution';

export const taskQueue = new Queue<TaskExecutionJobData>(QUEUE_NAME, {
    connection: { url: bootEnv.REDIS_URI },
});

export async function cleanupRecurringSchedulers() {
    const schedulers = await taskQueue.getJobSchedulers();

    for (const scheduler of schedulers) {
        const taskId = scheduler.template?.data?.taskId;

        if (!taskId || !(await getTaskById(taskId.toString()))) {
            try {
                await taskQueue.removeJobScheduler(scheduler.key);
                logger.info(`Removed orphan recurring scheduler ${scheduler.key}.`);
            } catch (error) {
                logger.error(
                    `Failed to remove orphan recurring scheduler ${scheduler.key}.`,
                    error,
                );
            }
        }
    }
}

export async function cleanupTaskJobs() {
    const jobs = await taskQueue.getJobs();

    for (const job of jobs) {
        const taskId = job.data?.taskId;

        if (
            (!taskId || !(await getTaskById(taskId.toString()))) &&
            !job.id?.startsWith('repeat:')
        ) {
            try {
                await job.remove();
                logger.info(`Removed orphan queue job ${job.id}.`);
            } catch (error) {
                logger.error(`Failed to remove orphan queue job ${job.id}.`, error);
            }
        }
    }
}

export async function runCleanup() {
    await cleanupRecurringSchedulers();
    await cleanupTaskJobs();
}

export async function startQueueCleanup() {
    await runCleanup();

    const timer = setInterval(runCleanup, bootEnv.QUEUE_CLEANUP_INTERVAL);
    timer.unref();

    logger.info(`Started queue cleanup every ${bootEnv.QUEUE_CLEANUP_INTERVAL}ms.`);
}
