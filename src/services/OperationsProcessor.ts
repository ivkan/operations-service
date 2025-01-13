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

  public stop(): void {
    this.isProcessing = false;
    this.logger.info('Operation processor stopped');
  }

  public start(): void {
    if (this.isProcessing) {
      return;
    }

    this.isProcessing = true;
    this.logger.info('Operation processor started');
    
    // Set up message handler
    this.queueService.onMessage(async (message) => {
      await this.processNextMessage(message);
    });
  }

  private async processNextMessage(message?: QueueMessage): Promise<void> {
    this.queueService.setProcessing(true);
    
    try {
      const queueMessage = message || this.queueService.receive();
      if (queueMessage) {
        await this.processMessage(queueMessage);
        
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
        
        // Extract is_delete_operation flag from mergedData
        const isDeleted = mergedData?.is_delete_operation || false;
        // Remove is_delete_operation from content
        const { is_delete_operation, ...contentData } = mergedData || {};

        await this.updateTargetTable(
          message.operation.tableName,
          message.operation.recordId,
          contentData,
          isDeleted,
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
    isDeleted: boolean,
    client: PoolClient
  ): Promise<void> {
    await client.query(`
      INSERT INTO ${tableName} (id, content, version, is_deleted)
      VALUES ($1, $2, 1, $3)
      ON CONFLICT (id) DO UPDATE 
      SET content = $2,
          version = ${tableName}.version + 1,
          is_deleted = $3,
          updated_at = NOW()
    `, [recordId, data, isDeleted]);
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