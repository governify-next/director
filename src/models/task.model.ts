import mongoose, { Document, Schema } from 'mongoose';
import { buildTaskDeduplicationKey } from '../utils/taskIdentity.js';

export enum TaskType {
    IMMEDIATE = 'IMMEDIATE',
    RECURRING = 'RECURRING',
    PROGRAMMED = 'PROGRAMMED',
}

export interface ITask extends Document {
    script: string;
    inputArgs: Record<string, unknown>;
    type: TaskType;
    enabled: boolean;
    startDate?: Date;
    endDate?: Date;
    anchorDate?: Date;
    interval?: number;
    runDates?: Date[];
    deduplicationKey: string;
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
        anchorDate: { type: Date },
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
                return this.type === TaskType.PROGRAMMED;
            },
        },
        deduplicationKey: { type: String, required: true, select: false },
    },
    {
        timestamps: true,
        toJSON: {
            transform: (_document, returnedObject) => {
                delete (returnedObject as unknown as Record<string, unknown>).deduplicationKey;
                return returnedObject;
            },
        },
    },
);

taskSchema.index({ type: 1, enabled: 1, startDate: 1, endDate: 1 });
taskSchema.index(
    { deduplicationKey: 1 },
    {
        unique: true,
        partialFilterExpression: { deduplicationKey: { $type: 'string' } },
        name: 'unique_task_identity',
    },
);

taskSchema.pre('validate', function () {
    this.deduplicationKey = buildTaskDeduplicationKey(this);
});

const Task = mongoose.model<ITask>('Task', taskSchema);

export default Task;
