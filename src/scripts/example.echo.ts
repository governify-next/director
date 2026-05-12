import { z } from 'zod';
import { ScriptHandler, ScriptModule, TaskExecutionContext } from '../types/script.js';

const name = 'example.echo';
const description =
    'A simple script that echoes a message. Receives a single argument "message" and returns it along with the execution context and a timestamp.';

const inputSchema = z.object({
    message: z.string(),
});

const exec: ScriptHandler = async (args, context: TaskExecutionContext) => {
    const { message } = inputSchema.parse(args);
    return {
        message,
        context: context,
        timestamp: new Date().toISOString(),
    };
};

const module: ScriptModule = {
    name,
    description,
    inputSchema,
    exec,
};

export default module;
