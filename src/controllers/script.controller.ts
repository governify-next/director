import { Request, Response, NextFunction } from 'express';
import * as scriptService from '../services/script.service.js';
import { sendSuccess } from '../utils/standardResponse.js';
import { NotFoundError } from '../utils/customErrors.js';

export const getScripts = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const scripts = await scriptService.getScripts();
        return sendSuccess(res, { data: scripts });
    } catch (err) {
        next(err);
    }
};

export const getScriptByName = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const script = await scriptService.getScriptByName(req.params.name);
        if (!script) throw new NotFoundError('Script not found');
        return sendSuccess(res, { data: script });
    } catch (err) {
        next(err);
    }
};
