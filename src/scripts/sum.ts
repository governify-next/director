import { ScriptHandler } from '../types/script.js';

const sum: ScriptHandler = async (args, context) => {
    const a = args.a as number;
    const b = args.b as number;

    return `Hello from the sum script! ${a} + ${b} = ${a + b}`;
};

export default sum;
