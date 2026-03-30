import scriptRegistry from '../scripts/registry.js';

export const getScripts = () => {
    return scriptRegistry;
};

export const getScriptByName = (name: string) => {
    return scriptRegistry.find((script) => script.name === name);
};
