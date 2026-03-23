import mongoose, { Document, Schema, Types } from 'mongoose';

export enum TaskType {
    ONE_TIME = 'ONE_TIME',
    RECURRING = 'RECURRING',
}

export interface ITask extends Document {
    scriptId: Types.ObjectId;
    inputArgs: Record<string, unknown>;
    type: TaskType;
    startDate?: Date;
    endDate?: Date;
}

const taskSchema = new Schema<ITask>(
    {
        scriptId: { type: Schema.Types.ObjectId, ref: 'Script', required: true },
        inputArgs: { type: Schema.Types.Mixed, default: {} },
        type: { type: String, enum: TaskType, required: true },
        startDate: { type: Date },
        endDate: { type: Date },
    },
    { timestamps: true },
);

// Supports recurring activity windows filtered by type and date bounds.
taskSchema.index({ type: 1, startDate: 1, endDate: 1 });

// index to efficiently find active recurring tasks
taskSchema.index(
    { startDate: 1, endDate: 1 },
    { partialFilterExpression: { type: TaskType.RECURRING } },
);

const Task = mongoose.model<ITask>('Task', taskSchema);

export default Task;
