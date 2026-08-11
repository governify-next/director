import dotenv from 'dotenv';
import path from 'path';

// Load .env file
const envPath = process.env.GOV_BOOT_ENV_PATH || path.resolve(process.cwd(), '.env');
dotenv.config({ path: envPath, quiet: true });

export const bootEnv = {
    // Service configuration
    NODE_ENV: process.env.NODE_ENV || 'development',
    GOV_LOG_LEVEL: process.env.GOV_LOG_LEVEL || 'INFO',
    GOV_SERVICE_NAME: process.env.GOV_SERVICE_NAME || 'director',
    PORT: process.env.PORT || '5906',

    // Internal service URLs
    AUTHENTICATOR_SERVICE_URL: process.env.AUTHENTICATOR_SERVICE_URL || 'http://localhost:5900',
    REGISTRY_SERVICE_URL: process.env.REGISTRY_SERVICE_URL || 'http://localhost:5902',
    FETCHER_SERVICE_URL: process.env.FETCHER_SERVICE_URL || 'http://localhost:5904',
    REPORTER_SERVICE_URL: process.env.REPORTER_SERVICE_URL || 'http://localhost:5905',

    // Database URIs
    MONGO_URI: process.env.MONGO_URI || 'mongodb://localhost:27017/governify-next',
    REDIS_URI: process.env.REDIS_URI || 'redis://localhost:6379',

    // JWT configuration
    CLIENT_ID: process.env.CLIENT_ID || 'director',
    CLIENT_SECRET: process.env.CLIENT_SECRET || 'director_client_secret',
    JWT_SECRET: process.env.JWT_SECRET || 'governify_next_secret_key',
    JWT_ISSUER: process.env.JWT_ISSUER || 'authenticator',
    JWT_AUDIENCE: process.env.JWT_AUDIENCE || 'governify-next',

    // BullMQ configuration
    WORKER_CONCURRENCY: Number(process.env.WORKER_CONCURRENCY || '1'),
    QUEUE_CLEANUP_INTERVAL: Number(process.env.QUEUE_CLEANUP_INTERVAL || '0'),

    // Fetch result polling configuration
    FETCH_RESULT_POLLING_MAX_ATTEMPTS: Number(
        process.env.FETCH_RESULT_POLLING_MAX_ATTEMPTS || '10',
    ),
    FETCH_RESULT_POLLING_INTERVAL_MS: Number(
        process.env.FETCH_RESULT_POLLING_INTERVAL_MS || '5000',
    ),
};
