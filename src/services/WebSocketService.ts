import WebSocket from 'ws';
import { QueueService } from './QueueService';
import { MetricsService } from './MetricsService';
import { Operation } from '../core/types';
import { Logger } from 'pino';

export class WebSocketService {
  private wss: WebSocket.Server;

  constructor(
    private readonly port: number,
    private readonly queueService: QueueService,
    private readonly metricsService: MetricsService,
    private readonly logger: Logger
  ) {
    this.wss = new WebSocket.Server({ port });
  }

  public start(): void {
    this.wss.on('connection', this.handleConnection.bind(this));
    this.logger.info(`WebSocket server started on port ${this.port}`);
  }

  private handleConnection(ws: WebSocket): void {
    ws.on('message', async (data: WebSocket.Data) => {
      try {
        const operation: Operation = JSON.parse(data.toString());
        
        await this.queueService.publish({
          operation,
          userId: operation.userId,
          timestamp: Date.now()
        });

        ws.send(JSON.stringify({
          type: 'ACK',
          operationId: operation.id
        }));

        this.metricsService.increment('websocket.operation.received');
      } catch (error) {
        this.handleError(ws, error as Error);
      }
    });
  }

  private handleError(ws: WebSocket, error: Error): void {
    this.logger.error(error);
    ws.send(JSON.stringify({
      type: 'ERROR',
      message: 'Failed to process operation'
    }));
  }
}