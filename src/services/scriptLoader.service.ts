import { ScriptHandler } from '../types/script.js';
import scriptRegistry from '../scripts/registry.js';

export async function loadScriptHandler(moduleRef: string): Promise<ScriptHandler> {
    const scriptHandle = scriptRegistry[moduleRef];

    if (typeof scriptHandle !== 'function') {
        throw new Error(`Script module must export a default function: ${moduleRef}`);
    }

    return scriptHandle;
}
