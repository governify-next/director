import { Worker } from 'bullmq';
import Task from '../models/task.model.js';
import Script from '../models/script.model.js';
import TaskExecution, { TaskExecutionStatus } from '../models/taskExecution.model.js';
import { loadScriptHandler } from '../services/script.service.js';
import { bootEnv } from '../config/bootConfig.js';
import { QUEUE_NAME } from './taskQueue.js';
import { TaskExecutionContext, TaskExecutionJobData } from '../types/script.js';
import { getLogger } from '../utils/logger.js';

export async function startTaskWorker() {
    const taskWorker = new Worker<TaskExecutionJobData>(
        QUEUE_NAME,
        async (job) => {
            const scriptLogs: string[] = [];

            const execution = await TaskExecution.create({
                taskId: job.data.taskId,
                startDate: new Date(),
                status: TaskExecutionStatus.RUNNING,
            });

            try {
                const task = await Task.findById(job.data.taskId);
                if (!task) {
                    throw new Error(`Task not found: ${job.data.taskId}`);
                }
                if (!task.enabled) {
                    throw new Error(`Task is disabled: ${job.data.taskId}`);
                }

                const script = await Script.findById(task.scriptId);
                if (!script) {
                    throw new Error(`Script not found for task: ${job.data.taskId}`);
                }

                const scriptLogger = getLogger().setTag(`task:${job.data.taskId}:${script.name}`);
                scriptLogger.setCapture((line) => scriptLogs.push(line));

                const scriptFunction = await loadScriptHandler(script.moduleRef);

                const scriptContext: TaskExecutionContext = {
                    taskId: task._id,
                    logger: scriptLogger,
                };

                const result = await scriptFunction(task.inputArgs, scriptContext);

                await TaskExecution.findByIdAndUpdate(execution._id, {
                    status: TaskExecutionStatus.SUCCEEDED,
                    finishDate: new Date(),
                    result: result,
                    log: scriptLogs,
                });

                return result;
            } catch (error) {
                await TaskExecution.findByIdAndUpdate(execution._id, {
                    status: TaskExecutionStatus.FAILED,
                    finishDate: new Date(),
                    error: error,
                    log: scriptLogs,
                });

                // TODO: analizar comportamiento al lanzar error, manejo de reintentos...
                throw error;
            }
        },
        {
            connection: { url: bootEnv.REDIS_URI },
            concurrency: bootEnv.WORKER_CONCURRENCY,
        },
    );

    return taskWorker;
}
