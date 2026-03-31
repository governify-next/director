import mongoose, { Document, Schema } from 'mongoose';

export enum TaskType {
    IMMEDIATE = 'IMMEDIATE',
    RECURRING = 'RECURRING',
    SCHEDULED = 'SCHEDULED',
}

export interface ITask extends Document {
    script: string;
    inputArgs: Record<string, unknown>;
    type: TaskType;
    enabled: boolean;
    startDate?: Date;
    endDate?: Date;
    interval?: number;
    runDates?: Date[];
}

const taskSchema = new Schema<ITask>(
    {
        script: { type: String, required: true },
        inputArgs: { type: Schema.Types.Mixed, default: {} },
        type: { type: String, enum: Object.values(TaskType), required: true },
        enabled: { type: Boolean, default: true, required: true },
        startDate: {
            type: Date,
            required: function () {
                return this.type === TaskType.RECURRING;
            },
        },
        endDate: { type: Date },
        interval: {
            type: Number,
            required: function () {
                return this.type === TaskType.RECURRING;
            },
        },
        runDates: {
            type: [Date],
            default: undefined,
            required: function () {
                return this.type === TaskType.SCHEDULED;
            },
        },
    },
    { timestamps: true },
);

taskSchema.index({ type: 1, enabled: 1, startDate: 1, endDate: 1 });

const Task = mongoose.model<ITask>('Task', taskSchema);

export default Task;
