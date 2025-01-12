export class OperationError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly operation?: any
  ) {
    super(message);
    this.name = 'OperationError';
  }
}

export class QueueError extends Error {
  constructor(message: string, public readonly originalError?: Error) {
    super(message);
    this.name = 'QueueError';
  }
}

export class DatabaseError extends Error {
  constructor(message: string, public readonly originalError?: Error) {
    super(message);
    this.name = 'DatabaseError';
  }
} 