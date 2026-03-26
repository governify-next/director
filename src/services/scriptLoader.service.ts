import { ScriptHandler, ScriptModule } from '../types/script.js';

const scriptCache = new Map<string, ScriptHandler>();

export async function loadScriptHandler(moduleRef: string): Promise<ScriptHandler> {
    if (scriptCache.has(moduleRef)) {
        return scriptCache.get(moduleRef)!;
    }

    // TODO: esto no es robusto al trabajar con módulos que originalmente son TypeScript
    // asumir .js funciona solo si el typescript se ha compilado
    const scriptModule = (await import(`./scripts/${moduleRef}.js`)) as ScriptModule;

    const scriptHandle = scriptModule.default;
    if (typeof scriptHandle !== 'function') {
        throw new Error(`Script module must export a default function: ${moduleRef}`);
    }

    scriptCache.set(moduleRef, scriptHandle);
    return scriptHandle;
}
