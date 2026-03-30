import { z } from 'zod';
import { ScriptHandler, TaskExecutionContext } from '../types/script.js';

const name = 'sum';
const description =
    'A simple script that sums two numbers. Performs basic validation on the input arguments, which are a and b.';

const validate = (args: Record<string, unknown>) => {
    return z
        .object({
            a: z.number(),
            b: z.number(),
        })
        .parse(args);
};

const exec: ScriptHandler = async (args, context: TaskExecutionContext) => {
    const { a, b } = validate(args);
    const { taskId, logger } = context;

    logger.info(`Executing sum script for task ${taskId}.`);
    return `Hello from the sum script! ${a} + ${b} = ${a + b}`;
};

export default { name, description, validate, exec };
