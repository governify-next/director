import * as scriptRepository from '../repositories/script.repository.js';
import { IScript } from '../models/script.model.js';

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
