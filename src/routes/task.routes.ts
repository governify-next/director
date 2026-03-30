import { Router } from 'express';
import * as taskController from '../controllers/task.controller.js';
import { validateTask } from '../middlewares/task.validator.js';
import { validateMongoId } from '../middlewares/mongoId.validator.js';

export const taskRoutes = Router();

taskRoutes.get('/', taskController.getTasks);
taskRoutes.get('/:id', validateMongoId, taskController.getTaskById);
taskRoutes.post('/', validateTask, taskController.createTask);
taskRoutes.put('/:id', validateMongoId, validateTask, taskController.updateTask);
taskRoutes.delete('/:id', validateMongoId, taskController.deleteTask);

taskRoutes.post('/:id/enable', validateMongoId, taskController.enableTask);
taskRoutes.post('/:id/disable', validateMongoId, taskController.disableTask);

taskRoutes.get('/:id/executions', validateMongoId, taskController.getTaskExecutions);
