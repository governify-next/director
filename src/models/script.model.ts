import mongoose, { Schema, Document } from 'mongoose';

export interface IScript extends Document {
    name: string;
    description?: string;
    moduleRef: string;
    inputSchema?: Record<string, unknown>;
}

const scriptSchema = new Schema<IScript>(
    {
        name: { type: String, required: true, unique: true, index: true },
        description: { type: String },
        moduleRef: { type: String, required: true },
        inputSchema: { type: Schema.Types.Mixed, required: true },
    },
    { timestamps: true },
);

const Script = mongoose.model<IScript>('Script', scriptSchema);
export default Script;
