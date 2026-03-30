import { ScriptModule } from '../types/script.js';
import exampleEcho from '../scripts/example.echo.js';
import sum from '../scripts/sum.js';

// list of all available scripts in the system - add new scripts here
const scriptRegistry: ScriptModule[] = [exampleEcho, sum];

export const getScripts = () => {
    return scriptRegistry;
};

export const getScriptByName = (name: string) => {
    return scriptRegistry.find((script) => script.name === name);
};
