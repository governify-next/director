import { Job, Worker } from 'bullmq';
import Task from '../models/task.model.js';
import TaskExecution, { TaskExecutionStatus } from '../models/taskExecution.model.js';
import { getScriptByName } from '../services/script.service.js';
import { bootEnv } from '../config/bootConfig.js';
import { QUEUE_NAME, taskQueue } from './taskQueue.js';
import { TaskExecutionContext, TaskExecutionJobData } from '../types/script.js';
import { getLogger } from '../utils/logger.js';

function resolveScheduledAt(job: Job<TaskExecutionJobData>): Date {
    if (typeof job.data?.scheduledAt === 'number') {
        return new Date(job.data.scheduledAt);
    }

    if (typeof job.id === 'string' && job.id.startsWith('repeat:')) {
        const lastSegment = job.id.split(':').pop();
        const scheduledAt = lastSegment ? Number(lastSegment) : Number.NaN;

        if (Number.isFinite(scheduledAt)) {
            return new Date(scheduledAt);
        }
    }

    if (typeof job.timestamp === 'number') {
        return new Date(job.timestamp);
    }

    return new Date();
}

export async function startTaskWorker() {
    const logger = getLogger().setTag('taskWorker.ts');
    const taskWorker = new Worker<TaskExecutionJobData>(
        QUEUE_NAME,
        async (job) => {
            const scriptLogs: string[] = [];
            const scheduledAt = resolveScheduledAt(job);
            let executionId: string | undefined;

            try {
                const task = await Task.findById(job.data.taskId);
                if (!task) {
                    throw new Error(`Task not found: ${job.data.taskId}`);
                }
                if (task.endDate && scheduledAt > task.endDate) {
                    try {
                        await taskQueue.removeJobScheduler(`recurring-task-${task._id}`);
                    } catch (error) {
                        logger.debug(
                            `Recurring scheduler for task ${task._id} was not removed`,
                            error,
                        );
                    }
                    logger.info(
                        `Skipped out-of-range recurring task ${task._id}: scheduledAt ${scheduledAt.toISOString()} is after endDate ${task.endDate.toISOString()}`,
                    );
                    return { skipped: true };
                }
                if (!task.enabled) {
                    throw new Error(`Task is disabled: ${job.data.taskId}`);
                }

                const script = getScriptByName(task.script);
                if (!script) {
                    throw new Error(`Script not found: ${task.script}`);
                }

                const scriptLogger = getLogger().setTag(`task:${job.data.taskId}:${script.name}`);
                scriptLogger.setCapture((line) => scriptLogs.push(line));

                const execution = await TaskExecution.create({
                    taskId: job.data.taskId,
                    startDate: new Date(),
                    status: TaskExecutionStatus.RUNNING,
                });
                executionId = execution._id.toString();

                const scriptContext: TaskExecutionContext = {
                    taskId: task._id,
                    scheduledAt: scheduledAt,
                    logger: scriptLogger,
                };

                const result = await script.exec(task.inputArgs, scriptContext);

                await TaskExecution.findByIdAndUpdate(executionId, {
                    status: TaskExecutionStatus.SUCCEEDED,
                    finishDate: new Date(),
                    result: result,
                    log: scriptLogs,
                });

                return result;
            } catch (error) {
                if (executionId) {
                    await TaskExecution.findByIdAndUpdate(executionId, {
                        status: TaskExecutionStatus.FAILED,
                        finishDate: new Date(),
                        error: error,
                        log: scriptLogs,
                    });
                }

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
