import { createHash } from 'node:crypto';

interface TaskIdentitySource {
    script: string;
    inputArgs: Record<string, unknown>;
    type: string;
    startDate?: Date;
    endDate?: Date;
    anchorDate?: Date;
    interval?: number;
    runDates?: Date[];
}

const canonicalize = (value: unknown): unknown => {
    if (value instanceof Date) {
        return value.toISOString();
    }

    if (Array.isArray(value)) {
        return value.map(canonicalize);
    }

    if (value !== null && typeof value === 'object') {
        return Object.fromEntries(
            Object.entries(value as Record<string, unknown>)
                .filter(([, nestedValue]) => nestedValue !== undefined)
                .sort(([firstKey], [secondKey]) => firstKey.localeCompare(secondKey))
                .map(([key, nestedValue]) => [key, canonicalize(nestedValue)]),
        );
    }

    return value;
};

export const buildTaskDeduplicationKey = (task: TaskIdentitySource): string => {
    const identity: Record<string, unknown> = {
        script: task.script,
        inputArgs: task.inputArgs,
        type: task.type,
    };

    if (task.type === 'RECURRING') {
        identity.startDate = task.startDate;
        identity.endDate = task.endDate ?? null;
        identity.anchorDate = task.anchorDate ?? task.startDate;
        identity.interval = task.interval;
    }

    if (task.type === 'PROGRAMMED') {
        identity.runDates = [
            ...new Set((task.runDates ?? []).map((runDate) => runDate.toISOString())),
        ].sort();
    }

    return createHash('sha256')
        .update(JSON.stringify(canonicalize(identity)))
        .digest('hex');
};
