import { z } from 'zod';
import { ScriptHandler, ScriptModule, TaskExecutionContext } from '../types/script.js';
import { ExistingStatePolicy, TemporalMode } from '../types/temporal.js';

import * as registryIntegration from '../integrations/registry.integration.js';

const name = 'generateConsolidatedStates';
const description =
    'Generates consolidated states for one signature of an agreement version at the exact scheduled execution date, using CAPTURE and keeping states that already exist.';

const inputSchema = z.object({
    orgName: z.string(),
    agColName: z.string(),
    orgId: z.string(),
    scopeId: z.string(),
    agColId: z.string(),
    agreementVersion: z.union([z.number().int().positive(), z.literal('auditableVersion')]),
    signatureId: z.string(),
});

const exec: ScriptHandler = async (args, context: TaskExecutionContext) => {
    const { orgName, agColName, orgId, scopeId, agColId, agreementVersion, signatureId } =
        inputSchema.parse(args);
    const { logger, scheduledAt } = context;

    logger.info(
        `Generating consolidated state for signature ${signatureId} of agreement ${agColName} at ${scheduledAt.toISOString()}. OrgId: ${orgId}, ScopeId: ${scopeId}, AgColId: ${agColId}, AgreementVersion: ${agreementVersion}`,
    );

    await registryIntegration.generateConsolidatedStatesForAgreementVersion(
        orgName,
        scopeId,
        agColName,
        agreementVersion,
        scheduledAt,
        TemporalMode.CAPTURE,
        ExistingStatePolicy.KEEP,
        signatureId,
    );

    logger.info(
        `State successfully generated for signature ${signatureId} at ${scheduledAt.toISOString()}. OrgId: ${orgId}, ScopeId: ${scopeId}, AgColId: ${agColId}, AgreementVersion: ${agreementVersion}`,
    );

    return `State successfully generated for signature ${signatureId}`;
};

const module: ScriptModule = {
    name,
    description,
    inputSchema,
    exec,
};

export default module;
