import { Router } from 'express';
import * as scriptController from '../controllers/script.controller.js';
import { checkServiceAuthentication } from '../integrations/authenticator.validator.js';

export const scriptRoutes = Router();

scriptRoutes.get('/scripts/', checkServiceAuthentication, scriptController.getScripts);
scriptRoutes.get('/scripts/:name', checkServiceAuthentication, scriptController.getScriptByName);
