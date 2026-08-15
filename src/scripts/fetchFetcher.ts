import { z } from 'zod';
import { ScriptHandler, ScriptModule, TaskExecutionContext } from '../types/script.js';
import { TemporalMode } from '../types/temporal.js';
import { ExternalServiceError } from '../utils/customErrors.js';

import * as fetcherIntegration from '../integrations/fetcher.integration.js';

const name = 'fetchFetcher';
const description =
    'Captures and persists data for a fetcher at the exact scheduled execution time. Requires fetcherId and fetcherConfig; optional agreement metadata supports task filtering and lifecycle management.';

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
    const { taskId, logger, scheduledAt } = context;

    if ((await fetcherIntegration.checkHealth()) === false) {
        throw new ExternalServiceError(`Fetcher service is not available`);
    }
    logger.info(
        `Generating fetch result for fetcherId ${fetcherId} at ${scheduledAt.toISOString()}. OrgId: ${orgId}, ScopeId: ${scopeId}, AgColId: ${agColId}, VersionNumber: ${versionNumber}`,
    );
    const fetchResult = await fetcherIntegration.generateFetchResult(
        fetcherId,
        {
            effectiveAt: scheduledAt,
            mode: TemporalMode.CAPTURE,
        },
        fetcherConfig,
        false,
    );
    logger.info(
        `Fetch result successfully generated with fetcherId ${fetcherId} at ${scheduledAt.toISOString()}. OrgId: ${orgId}, ScopeId: ${scopeId}, AgColId: ${agColId}, VersionNumber: ${versionNumber}`,
    );
    return `Fetch result successfully generated with id ${fetchResult.id}`;
};

const module: ScriptModule = {
    name,
    description,
    inputSchema,
    exec,
};

export default module;
