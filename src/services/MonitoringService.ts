import { ReplicationHelper } from '../infrastructure/database/ReplicationHelper';
import { MetricsService } from './MetricsService';
import { Logger } from 'pino';

export class MonitoringService {
  constructor(
    private readonly replicationHelper: ReplicationHelper,
    private readonly metricsService: MetricsService,
    private readonly logger: Logger
  ) {}

  async monitorReplication() {
    try {
      const status = await this.replicationHelper.checkReplicationStatus();
      const lag = await this.replicationHelper.getReplicationLag();

      this.metricsService.gauge('replication.lag', lag);
      this.metricsService.gauge('replication.active', status.active ? 1 : 0);

      if (lag > 300) { // 5 minutes
        this.logger.warn({ lag }, 'High replication lag detected');
      }

      if (!status.active) {
        this.logger.error('Replication slot is not active');
      }
    } catch (error) {
      this.logger.error(error, 'Failed to monitor replication');
    }
  }

  startMonitoring(intervalMs = 60000) { // Default: check every minute
    setInterval(() => this.monitorReplication(), intervalMs);
  }
}