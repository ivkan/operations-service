import { Database } from '../infrastructure/database/Database';
import { QueueService } from './QueueService';
import { MetricsService } from './MetricsService';
import { Operation, QueueMessage } from '../core/types';
import { Logger } from 'pino';
import { PoolClient } from 'pg';

export class OperationsProcessor {
  private isProcessing: boolean = false;

  constructor(
    private readonly db: Database,
    private readonly queueService: QueueService,
    private readonly metricsService: MetricsService,
    private readonly logger: Logger
  ) {}

  public start(): void {
    if (this.isProcessing) {
      return;
    }

    this.isProcessing = true;
    this.logger.info('Operation processor started');
    
    // Set up message handler
    this.queueService.onMessage(async () => {
      await this.processNextMessage();
    });
  }

  public stop(): void {
    this.isProcessing = false;
    this.logger.info('Operation processor stopped');
  }

  private async processNextMessage(): Promise<void> {
    this.queueService.setProcessing(true);
    
    try {
      const message = await this.queueService.receive();
      if (message) {
        await this.processMessage(message);
        
        // Check for more messages
        if (this.queueService.hasMessages()) {
          await this.processNextMessage();
        }
      }
    } catch (error) {
      this.logger.error(error as Error);
      this.metricsService.increment('operation.failed');
    } finally {
      this.queueService.setProcessing(false);
    }
  }

  private async processMessage(message: QueueMessage): Promise<void> {
    try {
      await this.db.transaction(async (trx) => {
        // First, save the operation to operations_log
        await this.saveOperationToLog(message.operation, trx);
        
        // Then get merged operations
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
    await client.query(`
      INSERT INTO ${tableName} (id, content, version)
      VALUES ($1, $2, 1)
      ON CONFLICT (id) DO UPDATE 
      SET content = $2,
          version = ${tableName}.version + 1,
          updated_at = NOW()
    `, [recordId, data]);
  }

  private async handleProcessingError(operation: Operation, error: Error): Promise<void> {
    this.logger.error({ operationId: operation.id, error }, 'Processing error occurred');
  }

  private async saveOperationToLog(operation: Operation, client: PoolClient): Promise<void> {
    // console.log('saveOperationToLog', operation);
    await client.query(`
      INSERT INTO operations_log (
        id,
        table_name,
        record_id,
        operation_data,
        user_id,
        server_timestamp,
        is_applied
      ) VALUES ($1, $2, $3, $4, $5, NOW(), true)
    `, [
      operation.id,
      operation.tableName,
      operation.recordId,
      operation.operationData,
      operation.userId
    ]);
  }
}