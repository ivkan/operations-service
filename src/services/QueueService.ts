import { Queue } from '../infrastructure/queue/Queue';
import { QueueMessage } from '../core/types';
import { Logger } from 'pino';

export class QueueService {
  private queue: Queue;

  constructor(private readonly logger: Logger) {
    this.queue = new Queue();
  }

  public publish(message: QueueMessage): void {
    try {
      this.queue.publish(message);
      this.logger.info({ messageId: message.operation.id }, 'Message published');
    } catch (error) {
      this.logger.error(error, 'Failed to publish message');
      throw error;
    }
  }

  public receive(): QueueMessage | null {
    try {
      return this.queue.receive();
    } catch (error) {
      this.logger.error(error, 'Failed to receive message');
      throw error;
    }
  }

  public onMessage(callback: (message: QueueMessage) => Promise<void>): void {
    this.queue.onMessage(callback);
  }

  public setProcessing(status: boolean): void {
    this.queue.setProcessing(status);
  }

  public hasMessages(): boolean {
    return this.queue.size() > 0;
  }
} 