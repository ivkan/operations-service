import { QueueMessage } from '../../core/types';
import { QueueError } from '../../core/errors';

export class Queue {
  private messages: QueueMessage[] = [];

  public async publish(message: QueueMessage): Promise<void> {
    try {
      this.messages.push(message);
    } catch (error) {
      throw new QueueError('Failed to publish message', error as Error);
    }
  }

  public async receive(): Promise<QueueMessage | null> {
    try {
      return this.messages.shift() || null;
    } catch (error) {
      throw new QueueError('Failed to receive message', error as Error);
    }
  }
} 