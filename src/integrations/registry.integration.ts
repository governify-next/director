import { bootEnv } from '../config/bootConfig.js';
import { getServiceHeaders } from '../utils/serviceAuthentication.js';
import { ExternalServiceError } from '../utils/customErrors.js';

const REGISTRY_SERVICE_URL = bootEnv.REGISTRY_SERVICE_URL;

export const generateStatesForAuditableAgreementVersion = async (
    orgName: string,
    elementName: string,
    agColName: string,
    date: Date,
) => {
    const response = await fetch(
        `${REGISTRY_SERVICE_URL}/api/v1/organizations/${orgName}/elements/${elementName}/agreementCollections/${agColName}/agreementVersions/auditableVersion/states/generate?isAsync=false`,
        {
            method: 'POST',
            headers: getServiceHeaders(),
            body: JSON.stringify({ date }),
        },
    );
    const result = await response.json();
    if (!result.success) throw new ExternalServiceError(`Failed to generate states`);
    return result.data;
};
