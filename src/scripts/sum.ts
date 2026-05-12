import { z } from 'zod';
import { ScriptHandler, ScriptModule, TaskExecutionContext } from '../types/script.js';

const name = 'sum';
const description =
    'A simple script that sums two numbers. Performs basic validation on the input arguments, which are a and b.';

const inputSchema = z.object({
    a: z.number(),
    b: z.number(),
});

const exec: ScriptHandler = async (args, context: TaskExecutionContext) => {
    const { a, b } = inputSchema.parse(args);
    const { taskId, logger } = context;

    logger.info(`Executing sum script for task ${taskId}.`);
    return `Hello from the sum script! ${a} + ${b} = ${a + b}`;
};

const module: ScriptModule = {
    name,
    description,
    inputSchema,
    exec,
};

export default module;
