import { bootEnv } from '../config/bootConfig.js';
import { getServiceHeaders } from '../utils/serviceAuthentication.js';
import { ExternalServiceError } from '../utils/customErrors.js';
import { ExistingStatePolicy, TemporalMode } from '../types/temporal.js';

const REGISTRY_SERVICE_URL = bootEnv.REGISTRY_SERVICE_URL;

export const generateConsolidatedStatesForAgreementVersion = async (
    orgName: string,
    scopeId: string,
    agColName: string,
    agreementVersion: number | 'auditableVersion',
    date: Date,
    temporalMode: TemporalMode,
    existingStatePolicy: ExistingStatePolicy,
    signatureId: string,
) => {
    const response = await fetch(
        `${REGISTRY_SERVICE_URL}/api/v1/organizations/${orgName}/scopes/${scopeId}/agreementCollections/${agColName}/agreementVersions/${agreementVersion}/states/consolidated/generate?isAsync=false`,
        {
            method: 'POST',
            headers: getServiceHeaders(),
            body: JSON.stringify({
                date,
                temporalMode,
                ifExists: existingStatePolicy,
                signatureIds: [signatureId],
            }),
        },
    );
    const result = await response.json();
    if (!result.success) throw new ExternalServiceError(`Failed to generate consolidated states`);
    return result.data;
};
