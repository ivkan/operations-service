import { EventEmitter } from 'events';
import { QueueMessage } from '../../core/types';
import { QueueError } from '../../core/errors';

export class Queue extends EventEmitter {
  private messages: QueueMessage[] = [];
  private isProcessing: boolean = false;

  constructor() {
    super();
  }

  public publish(message: QueueMessage): void {
    try {
      this.messages.push(message);
      if (!this.isProcessing) {
        this.emit('message', message);
      }
    } catch (error) {
      throw new QueueError('Failed to publish message', error as Error);
    }
  }

  public receive(): QueueMessage | null {
    try {
      return this.messages.shift() || null;
    } catch (error) {
      throw new QueueError('Failed to receive message', error as Error);
    }
  }

  public onMessage(callback: (message: QueueMessage) => Promise<void>): void {
    this.on('message', callback);
  }

  public setProcessing(status: boolean): void {
    this.isProcessing = status;
    if (!status && this.messages.length > 0) {
      this.emit('message', this.messages[0]);
    }
  }

  public size(): number {
    return this.messages.length;
  }
} 