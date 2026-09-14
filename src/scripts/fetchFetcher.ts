import { z } from 'zod';
import { ScriptHandler, ScriptModule, TaskExecutionContext } from '../types/script.js';
import { TemporalMode } from '../types/temporal.js';
import { ExternalServiceError } from '../utils/customErrors.js';

import * as fetcherIntegration from '../integrations/fetcher.integration.js';

const name = 'fetchFetcher';
const description =
    'Starts asynchronous data capture for a fetcher at the exact scheduled execution time. Requires fetcherId and fetcherConfig; optional agreement metadata supports task filtering and lifecycle management.';

const inputSchema = z.object({
    fetcherId: z.string(),
    fetcherConfig: z.record(z.string(), z.any()),
    orgId: z.string().optional(),
    scopeId: z.string().optional(),
    agColId: z.string().optional(),
    versionNumber: z.number().optional(),
});

const exec: ScriptHandler = async (args, context: TaskExecutionContext) => {
    const { fetcherId, fetcherConfig, orgId, scopeId, agColId, versionNumber } =
        inputSchema.parse(args);
    const { logger, scheduledAt } = context;

    if ((await fetcherIntegration.checkHealth()) === false) {
        throw new ExternalServiceError(`Fetcher service is not available`);
    }
    logger.info(
        `Starting asynchronous fetch-result generation for fetcherId ${fetcherId} at ${scheduledAt.toISOString()}. OrgId: ${orgId}, ScopeId: ${scopeId}, AgColId: ${agColId}, VersionNumber: ${versionNumber}`,
    );
    await fetcherIntegration.generateFetchResult(
        fetcherId,
        {
            effectiveAt: scheduledAt,
            mode: TemporalMode.CAPTURE,
        },
        fetcherConfig,
        true,
    );
    logger.info(
        `Asynchronous fetch-result generation accepted for fetcherId ${fetcherId} at ${scheduledAt.toISOString()}. OrgId: ${orgId}, ScopeId: ${scopeId}, AgColId: ${agColId}, VersionNumber: ${versionNumber}`,
    );
    return `Asynchronous fetch-result generation accepted for fetcherId ${fetcherId}`;
};

const module: ScriptModule = {
    name,
    description,
    inputSchema,
    exec,
};

export default module;
