import { Queue } from '../infrastructure/queue/Queue';
import { QueueMessage } from '../core/types';
import { Logger } from 'pino';

export class QueueService {
  private queue: Queue;

  constructor(private readonly logger: Logger) {
    this.queue = new Queue();
  }

  public async publish(message: QueueMessage): Promise<void> {
    try {
      await this.queue.publish(message);
      this.logger.info({ messageId: message.operation.id }, 'Message published');
    } catch (error) {
      this.logger.error(error, 'Failed to publish message');
      throw error;
    }
  }

  public async receive(): Promise<QueueMessage | null> {
    try {
      return await this.queue.receive();
    } catch (error) {
      this.logger.error(error, 'Failed to receive message');
      throw error;
    }
  }

  public onMessage(callback: () => Promise<void>): void {
    this.queue.onMessage(callback);
  }

  public setProcessing(status: boolean): void {
    this.queue.setProcessing(status);
  }

  public hasMessages(): boolean {
    return this.queue.size() > 0;
  }
} 