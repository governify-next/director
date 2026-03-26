import { ScriptHandler } from '../types/script.js';

const exampleEchoScript: ScriptHandler = async (args, context) => {
    return {
        message: args.message ?? 'Hello from script',
        context: context,
        timestamp: new Date().toISOString(),
    };
};

export default exampleEchoScript;
