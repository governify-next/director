import { ScriptModule } from '../types/script.js';
import exampleEcho from '../scripts/example.echo.js';
import sum from '../scripts/sum.js';
import generateStates from '../scripts/generateStates.js';

// list of all available scripts in the system - add new scripts here
// script.name -> ScriptModule
const scriptRegistry: Record<string, ScriptModule> = {
    [exampleEcho.name]: exampleEcho,
    [sum.name]: sum,
    [generateStates.name]: generateStates,
};

export const getScripts = () => {
    return Object.values(scriptRegistry);
};

export const getScriptByName = (name: string) => {
    return scriptRegistry[name];
};
