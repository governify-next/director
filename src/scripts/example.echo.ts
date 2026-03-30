import { z } from 'zod';
import { ScriptHandler, ScriptModule, TaskExecutionContext } from '../types/script.js';

const name = 'example.echo';
const description =
    'A simple script that echoes a message. Receives a single argument "message" and returns it along with the execution context and a timestamp.';

const validate = (args: Record<string, unknown>) => {
    return z
        .object({
            message: z.string(),
        })
        .parse(args);
};

const exec: ScriptHandler = async (args, context: TaskExecutionContext) => {
    return {
        message: args.message,
        context: context,
        timestamp: new Date().toISOString(),
    };
};

const module: ScriptModule = {
    name,
    description,
    validate,
    exec,
};

export default module;
