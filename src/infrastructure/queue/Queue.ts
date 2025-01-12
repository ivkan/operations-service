import { AsyncQueue } from './async-queue';
import { QueueMessage } from '../../core/types';
import { QueueError } from '../../core/errors';

export class Queue {
  private queue: AsyncQueue;

  constructor() {
    this.queue = new AsyncQueue();
  }

  public async publish(message: QueueMessage): Promise<void> {
    try {
      await this.queue.publish(message);
    } catch (error) {
      throw new QueueError('Failed to publish message', error as Error);
    }
  }

  public async receive(): Promise<QueueMessage | null> {
    try {
      return await this.queue.receive();
    } catch (error) {
      throw new QueueError('Failed to receive message', error as Error);
    }
  }

  public onMessage(callback: () => Promise<void>): void {
    this.queue.on('message', callback);
  }

  public setProcessing(status: boolean): void {
    this.queue.setProcessing(status);
  }

  public size(): number {
    return this.queue.size();
  }
} 