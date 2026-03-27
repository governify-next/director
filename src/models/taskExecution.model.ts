import mongoose, { Document, Schema, Types } from 'mongoose';

export enum TaskExecutionStatus {
    SCHEDULED = 'SCHEDULED',
    RUNNING = 'RUNNING',
    SUCCEEDED = 'SUCCEEDED',
    FAILED = 'FAILED',
}

export interface ITaskExecution extends Document {
    taskId: Types.ObjectId;
    startDate: Date;
    finishDate?: Date;
    status: TaskExecutionStatus;
    duration?: number;
    result?: unknown;
    error?: unknown;
}

const taskExecutionSchema = new Schema<ITaskExecution>(
    {
        taskId: { type: Schema.Types.ObjectId, ref: 'Task', required: true },
        startDate: { type: Date, required: true },
        finishDate: { type: Date },
        status: { type: String, enum: Object.values(TaskExecutionStatus), required: true },
        duration: { type: Number },
        result: { type: Schema.Types.Mixed },
        error: { type: Schema.Types.Mixed },
    },
    { timestamps: true },
);

taskExecutionSchema.index({ status: 1, scheduledDate: 1 });

const TaskExecution = mongoose.model<ITaskExecution>('TaskExecution', taskExecutionSchema);

export default TaskExecution;
