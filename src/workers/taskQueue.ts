import { getLogger } from '../utils/logger.js';
import { bootEnv } from '../config/bootConfig.js';
import { Queue } from 'bullmq';

const logger = getLogger().setTag('taskQueue.ts');

export const QUEUE_NAME = 'task-execution';

export interface TaskJobData {
    taskId: string;
}
export const taskQueue = new Queue<TaskJobData>(QUEUE_NAME, {
    connection: {
        url: bootEnv.REDIS_URI,
    },
});
