import { z } from 'zod';
import { ScriptHandler, ScriptModule, TaskExecutionContext } from '../types/script.js';
import * as reporterIntegration from '../integrations/reporter.integration.js';
import { ValidationError } from '../utils/customErrors.js';

const name = 'syncAgreementVersionStates';
const description =
    'Synchronizes agreement version States through Reporter whose updatedAt is in [scheduledAt - lookbackMs, scheduledAt). lookbackMs is a positive integer in milliseconds.';

const inputSchema = z.object({
    orgName: z.string(),
    orgId: z.string(),
    scopeId: z.string(),
    agColId: z.string(),
    agreementVersion: z.union([z.number().int().positive(), z.literal('auditableVersion')]),
    lookbackMs: z.number().int().positive(),
});

const exec: ScriptHandler = async (args, context: TaskExecutionContext) => {
    const { orgName, orgId, scopeId, agColId, agreementVersion, lookbackMs } =
        inputSchema.parse(args);
    const { logger, scheduledAt } = context;
    const updatedTo = new Date(scheduledAt.getTime());
    const updatedFrom = new Date(scheduledAt.getTime() - lookbackMs);
    if (!Number.isFinite(updatedFrom.getTime()) || !Number.isFinite(updatedTo.getTime())) {
        throw new ValidationError('scheduledAt and lookbackMs must define a valid date range');
    }

    logger.info(
        `Synchronizing states updated from ${updatedFrom.toISOString()} (inclusive) to ${updatedTo.toISOString()} (exclusive). OrgId: ${orgId}, ScopeId: ${scopeId}, AgColId: ${agColId}, AgreementVersion: ${agreementVersion}`,
    );
    const result = await reporterIntegration.syncAgreementVersionStates(
        orgName,
        scopeId,
        agColId,
        agreementVersion,
        updatedFrom,
        updatedTo,
    );
    logger.info(
        `States synchronized successfully. States: ${result.statePoints}, Metrics: ${result.metricPoints}, TotalPoints: ${result.totalPoints}, Batches: ${result.batches}. OrgId: ${orgId}, ScopeId: ${scopeId}, AgColId: ${agColId}, AgreementVersion: ${agreementVersion}`,
    );
    return result;
};

const module: ScriptModule = {
    name,
    description,
    inputSchema,
    exec,
};

export default module;
