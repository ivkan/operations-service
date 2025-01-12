import dotenv from 'dotenv';
import { WebSocketService } from './services/WebSocketService';
import { OperationsProcessor } from './services/OperationsProcessor';
import { QueueService } from './services/QueueService';
import { MetricsService } from './services/MetricsService';
import { Database } from './infrastructure/database/Database';
import pino from 'pino';

// import { ReplicationHelper } from './infrastructure/database/ReplicationHelper';
// import { MonitoringService } from './services/MonitoringService';

dotenv.config();

const logger = pino();

async function main() {
  const db = new Database({
    host: process.env.DB_HOST!,
    port: parseInt(process.env.DB_PORT!),
    database: process.env.DB_NAME!,
    user: process.env.DB_USER!,
    password: process.env.DB_PASSWORD!
  });

  const queueService = new QueueService(logger);
  const metricsService = new MetricsService();

  // ...
  // const replicationHelper = new ReplicationHelper(db.getPool());
  // const monitoringService = new MonitoringService(
  //   replicationHelper,
  //   metricsService,
  //   logger
  // );

  // Ensure replication is properly set up
  // await replicationHelper.ensurePublication();

  // Start monitoring
  // monitoringService.startMonitoring();
  // ...


  const wsService = new WebSocketService(
    parseInt(process.env.WS_PORT!),
    queueService,
    metricsService,
    logger
  );

  const processor = new OperationsProcessor(
    db,
    queueService,
    metricsService,
    logger
  );

  wsService.start();
  processor.start();
}

main().catch((error) => {
  logger.error(error);
  process.exit(1);
});