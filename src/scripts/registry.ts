import { ScriptHandler } from '../types/script.js';
import exampleEcho from './example.echo.js';

const scriptRegistry: Record<string, ScriptHandler> = {
    'example.echo': exampleEcho,
};

export default scriptRegistry;
