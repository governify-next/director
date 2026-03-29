import { ScriptHandler } from '../types/script.js';
import exampleEcho from './example.echo.js';
import sum from './sum.js';

// moduleRef -> ScriptHandler
const scriptRegistry: Record<string, ScriptHandler> = {
    'example.echo': exampleEcho,
    sum: sum,
};

export default scriptRegistry;
