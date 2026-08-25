export enum TemporalMode {
    CAPTURE = 'CAPTURE',
    REPLAY = 'REPLAY',
}

export enum ExistingStatePolicy {
    KEEP = 'KEEP',
    REPLACE = 'REPLACE',
}

export interface ITemporalContext {
    effectiveAt: Date;
    mode: TemporalMode;
}
