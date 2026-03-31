import mongoose, { Document, Schema, Types } from 'mongoose';

export enum TaskExecutionStatus {
    RUNNING = 'RUNNING',
    SUCCEEDED = 'SUCCEEDED',
    FAILED = 'FAILED',
}

export interface ITaskExecution extends Document {
    taskId: Types.ObjectId;
    startDate: Date;
    finishDate?: Date;
    status: TaskExecutionStatus;
    result?: unknown;
    log?: string[];
    error?: unknown;
}

const taskExecutionSchema = new Schema<ITaskExecution>({
    taskId: { type: Schema.Types.ObjectId, ref: 'Task', required: true, index: true },
    startDate: { type: Date, required: true },
    finishDate: { type: Date },
    status: { type: String, enum: Object.values(TaskExecutionStatus), required: true },
    result: { type: Schema.Types.Mixed },
    log: [{ type: String }],
    error: { type: Schema.Types.Mixed },
});

const TaskExecution = mongoose.model<ITaskExecution>('TaskExecution', taskExecutionSchema);

export default TaskExecution;
