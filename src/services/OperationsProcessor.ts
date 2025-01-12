import { Database } from '../infrastructure/database/Database';
import { QueueService } from './QueueService';
import { MetricsService } from './MetricsService';
import { Operation, QueueMessage } from '../core/types';
import { Logger } from 'pino';
import { PoolClient } from 'pg';

export class OperationsProcessor {
  constructor(
    private readonly db: Database,
    private readonly queueService: QueueService,
    private readonly metricsService: MetricsService,
    private readonly logger: Logger
  ) {}

  public async start(): Promise<void> {
    while (true) {
      const message = await this.queueService.receive();
      if (message) {
        await this.processMessage(message);
      }
    }
  }

  private async processMessage(message: QueueMessage): Promise<void> {
    try {
      await this.db.transaction(async (trx) => {
        const mergedData = await this.getMergedOperations(
          message.operation,
          trx
        );
        
        await this.updateTargetTable(
          message.operation.tableName,
          message.operation.recordId,
          mergedData,
          trx
        );
      });

      this.metricsService.increment('operation.processed');
    } catch (error) {
      this.logger.error(error as Error);
      this.metricsService.increment('operation.failed');
      await this.handleProcessingError(message.operation, error as Error);
    }
  }

  private async getMergedOperations(operation: Operation, client: PoolClient) {
    const result = await client.query(`
      SELECT jsonb_object_agg(
        key,
        value ORDER BY server_timestamp
      ) AS merged_operation_data
      FROM operations_log,
           jsonb_each(operation_data) AS ops(key, value)
      WHERE table_name = $1 
        AND record_id = $2
        AND is_applied = true
      GROUP BY table_name, record_id
    `, [operation.tableName, operation.recordId]);

    return result.rows[0]?.merged_operation_data;
  }

  private async updateTargetTable(
    tableName: string,
    recordId: string,
    data: any,
    client: PoolClient
  ): Promise<void> {
    await client.query(
      `UPDATE ${tableName} SET content = $1 WHERE id = $2`,
      [data, recordId]
    );
  }

  private async handleProcessingError(operation: Operation, error: Error): Promise<void> {
    this.logger.error({ operationId: operation.id, error }, 'Processing error occurred');
  }
}