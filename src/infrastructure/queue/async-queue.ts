import { EventEmitter } from 'events';
import { QueueMessage } from '../../core/types';

export class AsyncQueue extends EventEmitter {
  private messages: QueueMessage[] = [];
  private isProcessing: boolean = false;

  constructor() {
    super();
  }

  public async publish(message: QueueMessage): Promise<void> {
    this.messages.push(message);
    if (!this.isProcessing) {
      this.emit('message');
    }
  }

  public async receive(): Promise<QueueMessage | null> {
    return this.messages.shift() || null;
  }

  public setProcessing(status: boolean): void {
    this.isProcessing = status;
    if (!status && this.messages.length > 0) {
      this.emit('message');
    }
  }

  public size(): number {
    return this.messages.length;
  }
}
