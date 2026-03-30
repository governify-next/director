import { bootEnv } from '../config/bootConfig.js';
import { Queue } from 'bullmq';
import { TaskExecutionJobData } from '../types/script.js';

export const QUEUE_NAME = 'task-execution';

export const taskQueue = new Queue<TaskExecutionJobData>(QUEUE_NAME, {
    connection: { url: bootEnv.REDIS_URI },
});
