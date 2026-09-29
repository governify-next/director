import { bootEnv } from '../config/bootConfig.js';
import { getServiceHeaders } from '../utils/serviceAuthentication.js';
import { ExternalServiceError } from '../utils/customErrors.js';
import { ExistingStatePolicy, TemporalMode } from '../types/temporal.js';

const REGISTRY_SERVICE_URL = bootEnv.REGISTRY_SERVICE_URL;

const generateWindowStatesForAgreementVersion =
    (kind: 'consolidated' | 'evolutive') =>
    async (
        orgName: string,
        scopeId: string,
        agColId: string,
        agreementVersion: number | 'auditableVersion',
        date: Date,
        isAsync: boolean,
        temporalMode: TemporalMode,
        existingStatePolicy: ExistingStatePolicy,
        signatureId: string,
    ) => {
        const response = await fetch(
            `${REGISTRY_SERVICE_URL}/api/v1/organizations/${orgName}/scopes/${scopeId}/agreementCollections/${agColId}/agreementVersions/${agreementVersion}/states/${kind}/generate?isAsync=${isAsync}`,
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
        if (!result.success) throw new ExternalServiceError(`Failed to generate ${kind} states`);
        return result.data;
    };

export const generateConsolidatedStatesForAgreementVersion =
    generateWindowStatesForAgreementVersion('consolidated');
export const generateEvolutiveStatesForAgreementVersion =
    generateWindowStatesForAgreementVersion('evolutive');
