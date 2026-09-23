import { oasTelemetry } from '@oas-tools/oas-telemetry';
import app from './app.js';
import { getLogger } from './utils/logger.js';
import { bootEnv } from './config/bootConfig.js';
import { connectMongo } from './db/mongo.js';
import { fetchServiceToken } from './utils/serviceAuthentication.js';

import { loadProgrammedTasks, loadRecurringTasks } from './workers/taskScheduler.js';
import { startTaskWorker } from './workers/taskWorker.js';
import { startQueueCleanup } from './workers/taskQueue.js';

app.use(oasTelemetry());

const logger = getLogger().setTag('server.ts');
const PORT = bootEnv.PORT;

connectMongo()
    .then(async () => {
        await loadRecurringTasks();
        await loadProgrammedTasks();
        await startQueueCleanup();
        await startTaskWorker();

        app.listen(PORT, () => {
            fetchServiceToken();
            logger.log(`Server running on http://localhost:${PORT}`);
            logger.log(`Docs available at http://localhost:${PORT}/api-docs`);
        });
    })
    .catch((err) => {
        logger.error('Failed to initialize Director', err);
        process.exit(1);
    });
