import { Router } from 'express';
import * as scriptController from '../controllers/script.controller.js';
import { validateCreateScript, validateUpdateScript } from '../middlewares/script.validator.js';
import { validateMongoId } from '../middlewares/mongoId.validator.js';

export const scriptRoutes = Router();

scriptRoutes.get('/', scriptController.getScripts);
scriptRoutes.get('/:id', validateMongoId, scriptController.getScriptById);
scriptRoutes.post('/', validateCreateScript, scriptController.createScript);
scriptRoutes.put('/:id', validateMongoId, validateUpdateScript, scriptController.updateScript);
scriptRoutes.delete('/:id', validateMongoId, scriptController.deleteScript);
