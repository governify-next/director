import { ScriptHandler } from '../types/script.js';

const sum: ScriptHandler = async (args, context) => {
    const a = args.a as number;
    const b = args.b as number;

    return a + b;
};

export default sum;
