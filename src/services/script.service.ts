import * as scriptRepository from '../repositories/script.repository.js';
import { IScript } from '../models/script.model.js';
import { ScriptHandler } from '../types/script.js';
import scriptRegistry from '../scripts/registry.js';

export const createScript = async (data: Partial<IScript>) => {
    return await scriptRepository.createScript(data);
};

export const getScripts = async () => {
    return await scriptRepository.getScripts();
};

export const getScriptById = async (id: string) => {
    return await scriptRepository.getScriptById(id);
};

export const updateScript = async (id: string, data: Partial<IScript>) => {
    return await scriptRepository.updateScript(id, data);
};

export const deleteScript = async (id: string) => {
    return await scriptRepository.deleteScript(id);
};

export async function loadScriptHandler(moduleRef: string): Promise<ScriptHandler> {
    const scriptHandle = scriptRegistry[moduleRef];

    if (typeof scriptHandle !== 'function') {
        throw new Error(`Script module must export a default function: ${moduleRef}`);
    }

    return scriptHandle;
}
