import { Request, Response, NextFunction } from 'express';
import * as scriptService from '../services/script.service.js';
import { sendSuccess } from '../utils/standardResponse.js';
import { NotFoundError } from '../utils/customErrors.js';

export const createScript = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const script = await scriptService.createScript(req.body);
        return sendSuccess(res, { data: script, httpStatus: 201, message: 'Script created' });
    } catch (err) {
        next(err);
    }
};

export const getScripts = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const scripts = await scriptService.getScripts();
        return sendSuccess(res, { data: scripts });
    } catch (err) {
        next(err);
    }
};

export const getScriptById = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const script = await scriptService.getScriptById(req.params.id);
        if (!script) throw new NotFoundError('Script not found');
        return sendSuccess(res, { data: script });
    } catch (err) {
        next(err);
    }
};

export const updateScript = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const script = await scriptService.updateScript(req.params.id, req.body);
        if (!script) throw new NotFoundError('Script not found');
        return sendSuccess(res, { data: script, message: 'Script updated' });
    } catch (err) {
        next(err);
    }
};

export const deleteScript = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const script = await scriptService.deleteScript(req.params.id);
        if (!script) throw new NotFoundError('Script not found');
        return sendSuccess(res, { data: null, message: 'Script deleted' });
    } catch (err) {
        next(err);
    }
};
