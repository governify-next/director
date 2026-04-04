import { Router } from 'express';
import * as scriptController from '../controllers/script.controller.js';

export const scriptRoutes = Router();

scriptRoutes.get('/scripts/', scriptController.getScripts);
scriptRoutes.get('/scripts/:name', scriptController.getScriptByName);
