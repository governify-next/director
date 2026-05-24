import { bootEnv } from '../config/bootConfig.js';
import { serviceHeaders } from '../utils/serviceAuth.js';
import { ExternalServiceError } from '../utils/customErrors.js';

const REPORTER_SERVICE_URL = bootEnv.REPORTER_SERVICE_URL;

export const syncStatesWithInfluxForAuditableAgreementVersion = async (
    orgName: string,
    elementName: string,
    agColName: string,
) => {
    const response = await fetch(
        `${REPORTER_SERVICE_URL}/api/v1/influx/organizations/${orgName}/elements/${elementName}/agreementCollections/${agColName}/agreementVersions/auditableVersion/states/sync`,
        {
            method: 'POST',
            headers: serviceHeaders,
        },
    );
    const result = await response.json();
    if (!result.success) throw new ExternalServiceError(`Failed to sync states with Influx`);
    return result.data;
};
