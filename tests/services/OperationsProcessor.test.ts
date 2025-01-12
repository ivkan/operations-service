import { OperationsProcessor } from '../../src/services/OperationsProcessor';
import { Database } from '../../src/infrastructure/database/Database';
import { QueueService } from '../../src/services/QueueService';
import { MetricsService } from '../../src/services/MetricsService';
import { Operation } from '../../src/core/types';
import pino from 'pino';

describe('OperationsProcessor', () => {
  let processor: OperationsProcessor;
  let db: jest.Mocked<Database>;
  let queueService: jest.Mocked<QueueService>;
  let metricsService: MetricsService;
  let logger: pino.Logger;

  beforeEach(() => {
    db = {
      transaction: jest.fn(),
    } as any;

    queueService = {
      receive: jest.fn(),
    } as any;

    metricsService = new MetricsService();
    logger = pino({ level: 'silent' });

    processor = new OperationsProcessor(
      db,
      queueService,
      metricsService,
      logger
    );
  });

  it('should process operations from queue', async () => {
    const operation: Operation = {
      id: '123',
      tableName: 'users',
      recordId: '456',
      operationData: { name: 'John' },
      userId: '789',
      timestamp: new Date()
    };

    queueService.receive
      .mockResolvedValueOnce({ operation, userId: '789', timestamp: Date.now() })
      .mockResolvedValueOnce(null);

    db.transaction.mockImplementation(async (callback) => {
      return callback({
        raw: jest.fn().mockResolvedValue({ rows: [{ merged_operation_data: {} }] })
      });
    });

    await processor.start();

    expect(metricsService.getValue('operation.processed')).toBe(1);
  });
}); 