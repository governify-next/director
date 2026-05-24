import { z } from 'zod';
import { ScriptHandler, ScriptModule, TaskExecutionContext } from '../types/script.js';
import { ExternalServiceError } from '../utils/customErrors.js';

import * as fetcherIntegration from '../integrations/fetcher.integration.js';

const name = 'fetchFetcher';
const description =
    'Fetches data for a given fetcher. Requires orgName, elementName, and agColName as input arguments. This script will call the registry integration to fetch data and then sync it with InfluxDB using the reporter integration.';

const inputSchema = z.object({
    fetcherId: z.string(),
    fetcherConfig: z.record(z.string(), z.any()),
});

const exec: ScriptHandler = async (args, context: TaskExecutionContext) => {
    const { fetcherId, fetcherConfig } = inputSchema.parse(args);
    const { taskId, logger, scheduledAt } = context;

    if ((await fetcherIntegration.checkHealth()) === false) {
        throw new ExternalServiceError(`Fetcher service is not available`);
    }
    logger.info(
        `Generating fetch result for task ${taskId} at ${scheduledAt.toISOString()} with fetcherId: ${fetcherId}, fetcherConfig: ${JSON.stringify(fetcherConfig)}...`,
    );
    await fetcherIntegration.generateFetchResult(fetcherId, scheduledAt, fetcherConfig, false);
    logger.info(`Fetch result generated for task ${taskId} at ${scheduledAt.toISOString()}`);
    return 'Fetch result generation initiated successfully.';
};

const module: ScriptModule = {
    name,
    description,
    inputSchema,
    exec,
};

export default module;
