import app from './app.js';
import { getLogger } from './utils/logger.js';
import { bootEnv } from './config/bootConfig.js';
import { connectMongo } from './db/mongo.js';

import { loadProgrammedTasks, loadRecurringTasks } from './workers/taskScheduler.js';
import { startTaskWorker } from './workers/taskWorker.js';
import { startQueueCleanup } from './workers/taskQueue.js';

const logger = getLogger().setTag('server.ts');
const PORT = bootEnv.PORT;
const MONGO_URI = bootEnv.MONGO_URI;

connectMongo()
    .then(() => {
        app.listen(PORT, () => {
            logger.log(`Server running on http://localhost:${PORT}`);
            logger.log(`Docs available at http://localhost:${PORT}/api-docs`);
        });

        loadRecurringTasks();
        loadProgrammedTasks();
        startTaskWorker();
        startQueueCleanup();
    })
    .catch((err) => {
        logger.error('Failed to connect to MongoDB', err);
    });
