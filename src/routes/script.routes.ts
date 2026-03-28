import { Router } from 'express';
import * as scriptController from '../controllers/script.controller.js';
import { validateScript } from '../middlewares/script.validator.js';
import { validateMongoId } from '../middlewares/mongoId.validator.js';

export const scriptRoutes = Router();

scriptRoutes.get('/', scriptController.getScripts);
scriptRoutes.get('/:id', validateMongoId, scriptController.getScriptById);
scriptRoutes.post('/', validateScript, scriptController.createScript);
scriptRoutes.put('/:id', validateMongoId, validateScript, scriptController.updateScript);
scriptRoutes.delete('/:id', validateMongoId, scriptController.deleteScript);
