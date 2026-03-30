import { Router } from 'express';
import * as scriptController from '../controllers/script.controller.js';

export const scriptRoutes = Router();

scriptRoutes.get('/', scriptController.getScripts);
scriptRoutes.get('/:name', scriptController.getScriptByName);
