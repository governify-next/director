export function getNextAnchoredRunDate({
    anchorDate,
    startDate,
    interval,
    now = new Date(),
}: {
    anchorDate?: Date;
    startDate: Date;
    interval: number;
    now?: Date;
}): Date {
    const anchorTime = (anchorDate ?? startDate).getTime();
    const earliestTime = Math.max(startDate.getTime(), now.getTime());

    if (earliestTime <= anchorTime) {
        return new Date(anchorTime);
    }

    const elapsedIntervals = Math.ceil((earliestTime - anchorTime) / interval);
    return new Date(anchorTime + elapsedIntervals * interval);
}

export function getAnchoredRunLimit({
    firstRunDate,
    endDate,
    interval,
}: {
    firstRunDate: Date;
    endDate?: Date;
    interval: number;
}): number | undefined {
    if (!endDate) {
        return undefined;
    }

    const remainingTime = endDate.getTime() - firstRunDate.getTime();

    if (remainingTime < 0) {
        return 0;
    }

    return Math.floor(remainingTime / interval) + 1;
}
