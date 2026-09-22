import { bootEnv } from '../config/bootConfig.js';
import { getServiceHeaders } from '../utils/serviceAuthentication.js';
import { ExternalServiceError } from '../utils/customErrors.js';

const REPORTER_SERVICE_URL = bootEnv.REPORTER_SERVICE_URL.replace(/\/+$/, '');

export const syncAgreementVersionStates = async (
    orgName: string,
    scopeId: string,
    agColId: string,
    agreementVersion: number | 'auditableVersion',
    updatedFrom: Date,
    updatedTo: Date,
) => {
    const path = `/api/v1/influx/organizations/${encodeURIComponent(orgName)}/scopes/${encodeURIComponent(scopeId)}/agreementCollections/${encodeURIComponent(agColId)}/agreementVersions/${encodeURIComponent(agreementVersion)}/states/sync`;
    let response: Response;
    try {
        response = await fetch(`${REPORTER_SERVICE_URL}${path}`, {
            method: 'POST',
            headers: getServiceHeaders(),
            body: JSON.stringify({ updatedFrom, updatedTo }),
        });
    } catch (error) {
        throw new ExternalServiceError('Reporter service is unavailable', error);
    }

    let result: { success?: boolean; data?: unknown; message?: string } | null;
    try {
        result = await response.json();
    } catch {
        throw new ExternalServiceError('Reporter returned an invalid response', {
            status: response.status,
        });
    }
    if (!response.ok || result?.success !== true || result.data === undefined) {
        throw new ExternalServiceError('Failed to synchronize agreement version states', {
            status: response.status,
            message: result?.message,
        });
    }
    return result.data;
};
