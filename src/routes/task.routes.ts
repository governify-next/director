import { Router } from 'express';
import * as taskController from '../controllers/task.controller.js';
import {
    validateTask,
    validateTaskDeleteFilters,
    validateTaskFilters,
    validateTaskUpdateFilters,
} from '../middlewares/task.validator.js';
import { validateMongoId } from '../middlewares/mongoId.validator.js';
import { checkServiceAuthentication } from '../middlewares/authenticator.validator.js';

export const taskRoutes = Router();

taskRoutes.get('/tasks/', checkServiceAuthentication, taskController.getTasks);
taskRoutes.post(
    '/tasks/search',
    checkServiceAuthentication,
    validateTaskFilters,
    taskController.searchTasks,
);
taskRoutes.post(
    '/tasks/search/delete',
    checkServiceAuthentication,
    validateTaskDeleteFilters,
    taskController.deleteTasksByFilters,
);
taskRoutes.post(
    '/tasks/search/enable',
    checkServiceAuthentication,
    validateTaskUpdateFilters,
    taskController.enableTasksByFilters,
);
taskRoutes.post(
    '/tasks/search/disable',
    checkServiceAuthentication,
    validateTaskUpdateFilters,
    taskController.disableTasksByFilters,
);
taskRoutes.get(
    '/tasks/:id',
    checkServiceAuthentication,
    validateMongoId,
    taskController.getTaskById,
);
taskRoutes.post('/tasks/', checkServiceAuthentication, validateTask, taskController.createTask);
taskRoutes.delete('/tasks/', checkServiceAuthentication, taskController.deleteAllTasks);
taskRoutes.put(
    '/tasks/:id',
    checkServiceAuthentication,
    validateMongoId,
    validateTask,
    taskController.updateTask,
);
taskRoutes.delete(
    '/tasks/:id',
    checkServiceAuthentication,
    validateMongoId,
    taskController.deleteTask,
);

taskRoutes.post(
    '/tasks/:id/enable',
    checkServiceAuthentication,
    validateMongoId,
    taskController.enableTask,
);
taskRoutes.post(
    '/tasks/:id/disable',
    checkServiceAuthentication,
    validateMongoId,
    taskController.disableTask,
);

taskRoutes.get(
    '/tasks/:id/executions',
    checkServiceAuthentication,
    validateMongoId,
    taskController.getTaskExecutions,
);
