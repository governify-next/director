import * as scriptRepository from '../repositories/script.repository.js';

export const getScripts = () => {
    return scriptRepository.getScripts();
};

export const getScriptByName = (name: string) => {
    return scriptRepository.getScriptByName(name);
};
