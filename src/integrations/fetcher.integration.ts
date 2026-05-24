import { bootEnv } from '../config/bootConfig.js';
import { serviceHeaders } from '../utils/serviceAuth.js';
import { ExternalServiceError } from '../utils/customErrors.js';

const FETCHER_SERVICE_URL = bootEnv.FETCHER_SERVICE_URL;

export const checkHealth = async (): Promise<boolean> => {
    try {
        const response = await fetch(`${FETCHER_SERVICE_URL}/health`, {
            method: 'GET',
        });
        return response.ok;
    } catch {
        return false;
    }
};

export const generateFetchResult = async (
    fetcherId: string,
    date: Date,
    fetcherConfig: Record<string, unknown>,
    isAsync: boolean,
) => {
    const response = await fetch(
        `${FETCHER_SERVICE_URL}/api/v1/fetchers/${fetcherId}/fetchResults/generate?isAsync=${isAsync}`,
        {
            method: 'POST',
            headers: serviceHeaders,
            body: JSON.stringify({ date, fetcherConfig }),
        },
    );
    const result = await response.json();
    if (!result.success) throw new ExternalServiceError(`Failed to generate fetch result`);
    return result.data;
};
