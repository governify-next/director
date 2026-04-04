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
    PORT: process.env.PORT || '5903',

    // Database URIs
    MONGO_URI: process.env.MONGO_URI || 'mongodb://localhost:27017/governify',
    REDIS_URI: process.env.REDIS_URI || 'redis://localhost:6379',

    // JWT configuration
    JWT_SECRET: process.env.JWT_SECRET || 'governify_secret_key',

    // BullMQ configuration
    WORKER_CONCURRENCY: Number(process.env.WORKER_CONCURRENCY || '1'),
    QUEUE_CLEANUP_INTERVAL: Number(process.env.QUEUE_CLEANUP_INTERVAL || '0'),
};
