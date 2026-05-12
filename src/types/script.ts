import { Types } from 'mongoose';
import type { Logger } from '../utils/logger.js';
import { z } from 'zod';

export interface TaskExecutionJobData {
    taskId: Types.ObjectId;
}

export interface TaskExecutionContext extends TaskExecutionJobData {
    logger: Logger;
}

export type ScriptHandler = (
    args: Record<string, unknown>,
    context: TaskExecutionContext,
) => Promise<unknown>;

export interface ScriptModule {
    name: string;
    description: string;
    inputSchema: z.ZodObject;
    exec: ScriptHandler;
}
