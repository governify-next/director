import { ScriptHandler, TaskExecutionContext } from '../types/script.js';

const sum: ScriptHandler = async (args, context: TaskExecutionContext) => {
    const a = args.a as number;
    const b = args.b as number;
    const taskId = context.taskId;
    const logger = context.logger;

    logger.info(`Executing sum script for task ${taskId}.`);
    return `Hello from the sum script! ${a} + ${b} = ${a + b}`;
};

export default sum;
