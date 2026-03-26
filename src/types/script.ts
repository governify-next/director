export interface ScriptExecutionContext {
    taskId: string;
    executionId: string;
    scheduledDate: Date;
}

export type ScriptHandler = (
    args: Record<string, unknown>,
    context: ScriptExecutionContext,
) => Promise<unknown> | unknown;

export interface ScriptModule {
    default?: ScriptHandler;
}
