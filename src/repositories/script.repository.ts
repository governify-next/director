import Script, { IScript } from '../models/script.model.js';

import { DuplicateKeyError } from '../utils/customErrors.js';

export const createScript = async (data: Partial<IScript>) => {
    try {
        const script = new Script(data);
        return await script.save();
    } catch (err) {
        const e = err as {
            code?: number;
            keyPattern?: { name?: number };
            keyValue?: unknown;
            message?: string;
        };

        if (e.code === 11000 && e.keyPattern?.name) {
            throw new DuplicateKeyError(
                'A script with that name already exists',
                e.keyValue || e.message,
            );
        }
        throw err;
    }
};

export const getScripts = async () => {
    return await Script.find();
};

export const getScriptById = async (id: string) => {
    return await Script.findById(id);
};

export const updateScript = async (id: string, data: Partial<IScript>) => {
    try {
        return await Script.findByIdAndUpdate(id, data, { new: true, runValidators: true });
    } catch (err) {
        const e = err as {
            code?: number;
            keyPattern?: { name?: number };
            keyValue?: unknown;
            message?: string;
        };
        if (e.code === 11000 && e.keyPattern?.name) {
            throw new DuplicateKeyError(
                'A script with that name already exists',
                e.keyValue || e.message,
            );
        }
        throw err;
    }
};

export const deleteScript = async (id: string) => {
    return await Script.findByIdAndDelete(id);
};
