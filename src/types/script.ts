import { Types } from 'mongoose';

export interface TaskExecutionContext {
    taskId: Types.ObjectId;
}

export type ScriptHandler = (
    args: Record<string, unknown>,
    context: TaskExecutionContext,
) => Promise<unknown>;

export interface ScriptModule {
    default: ScriptHandler;
}
