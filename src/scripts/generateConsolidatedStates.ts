import { z } from 'zod';
import { ScriptHandler, ScriptModule, TaskExecutionContext } from '../types/script.js';
import { ExistingStatePolicy, TemporalMode } from '../types/temporal.js';

import * as registryIntegration from '../integrations/registry.integration.js';

const name = 'generateConsolidatedStates';
const description =
    'Starts asynchronous consolidated-state generation for one signature at the exact scheduled execution date, using CAPTURE and keeping states that already exist.';

const inputSchema = z.object({
    orgName: z.string(),
    orgId: z.string(),
    scopeId: z.string(),
    agColId: z.string(),
    agreementVersion: z.union([z.number().int().positive(), z.literal('auditableVersion')]),
    signatureId: z.string(),
});

const exec: ScriptHandler = async (args, context: TaskExecutionContext) => {
    const { orgName, orgId, scopeId, agColId, agreementVersion, signatureId } =
        inputSchema.parse(args);
    const { logger, scheduledAt } = context;

    logger.info(
        `Starting asynchronous consolidated-state generation for signature ${signatureId} of agreement collection ${agColId} at ${scheduledAt.toISOString()}. OrgId: ${orgId}, ScopeId: ${scopeId}, AgreementVersion: ${agreementVersion}`,
    );

    const isAsync = true;

    await registryIntegration.generateConsolidatedStatesForAgreementVersion(
        orgName,
        scopeId,
        agColId,
        agreementVersion,
        scheduledAt,
        isAsync,
        TemporalMode.CAPTURE,
        ExistingStatePolicy.KEEP,
        signatureId,
    );

    logger.info(
        `Asynchronous consolidated-state generation accepted for signature ${signatureId} at ${scheduledAt.toISOString()}. OrgId: ${orgId}, ScopeId: ${scopeId}, AgColId: ${agColId}, AgreementVersion: ${agreementVersion}`,
    );

    return `Asynchronous consolidated-state generation accepted for signature ${signatureId}`;
};

const module: ScriptModule = {
    name,
    description,
    inputSchema,
    exec,
};

export default module;
