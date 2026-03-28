import { bootEnv } from '../config/bootConfig.js';
import { Queue } from 'bullmq';
import { TaskExecutionContext } from '../types/script.js';

export const QUEUE_NAME = 'task-execution';

export const taskQueue = new Queue<TaskExecutionContext>(QUEUE_NAME, {
    connection: { url: bootEnv.REDIS_URI },
});
