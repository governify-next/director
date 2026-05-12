import { z } from 'zod';
import { ScriptHandler, ScriptModule, TaskExecutionContext } from '../types/script.js';

import * as registryIntegration from '../integrations/registry.integrations.js';
import * as reporterIntegration from '../integrations/reporter.integrations.js';

const name = 'generateStates';
const description =
    'Generates states for a given auditable agreement version. Requires orgName, elementName, and agColName as input arguments. This script will call the registry integration to generate states and then sync them with InfluxDB using the reporter integration.';

const inputSchema = z.object({
    orgName: z.string(),
    elementName: z.string(),
    agColName: z.string(),
});

const exec: ScriptHandler = async (args, context: TaskExecutionContext) => {
    const { orgName, elementName, agColName } = inputSchema.parse(args);
    const { taskId, logger } = context;

    logger.info(
        `Generating states for task ${taskId} with orgName: ${orgName}, elementName: ${elementName}, agColName: ${agColName}...`,
    );

    await registryIntegration.generateStatesForAuditableAgreementVersion(
        orgName,
        elementName,
        agColName,
        new Date(),
    );

    const reporterResult =
        await reporterIntegration.syncStatesWithInfluxForAuditableAgreementVersion(
            orgName,
            elementName,
            agColName,
        );

    logger.info(
        `Finished states generation for task ${taskId}. Inserted ${reporterResult.totalPoints} points.`,
    );

    return reporterResult;
};

const module: ScriptModule = {
    name,
    description,
    inputSchema,
    exec,
};

export default module;
