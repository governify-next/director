import { Router } from 'express';
import * as taskController from '../controllers/task.controller.js';
import {
    validateTask,
    validateTaskDeleteFilters,
    validateTaskFilters,
    validateTaskUpdateFilters,
} from '../middlewares/task.validator.js';
import { validateMongoId } from '../middlewares/mongoId.validator.js';

export const taskRoutes = Router();

taskRoutes.get('/tasks/', taskController.getTasks);
taskRoutes.post('/tasks/search', validateTaskFilters, taskController.searchTasks);
taskRoutes.post(
    '/tasks/search/delete',
    validateTaskDeleteFilters,
    taskController.deleteTasksByFilters,
);
taskRoutes.post(
    '/tasks/search/enable',
    validateTaskUpdateFilters,
    taskController.enableTasksByFilters,
);
taskRoutes.post(
    '/tasks/search/disable',
    validateTaskUpdateFilters,
    taskController.disableTasksByFilters,
);
taskRoutes.get('/tasks/:id', validateMongoId, taskController.getTaskById);
taskRoutes.post('/tasks/', validateTask, taskController.createTask);
taskRoutes.delete('/tasks/', taskController.deleteAllTasks);
taskRoutes.put('/tasks/:id', validateMongoId, validateTask, taskController.updateTask);
taskRoutes.delete('/tasks/:id', validateMongoId, taskController.deleteTask);

taskRoutes.post('/tasks/:id/enable', validateMongoId, taskController.enableTask);
taskRoutes.post('/tasks/:id/disable', validateMongoId, taskController.disableTask);

taskRoutes.get('/tasks/:id/executions', validateMongoId, taskController.getTaskExecutions);
