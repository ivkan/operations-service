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
    this.logger.info('New client connected');
    
    // Send initial connection acknowledgment
    ws.send(JSON.stringify({ 
      type: 'CONNECTION_ACK',
      message: 'Connected to operations service'
    }));

    ws.on('message', async (data: WebSocket.Data) => {
      try {
        const operation: Operation = JSON.parse(data.toString());
        
        // await this.queueService.publish({
        //   operation,
        //   userId: operation.userId,
        //   timestamp: Date.now()
        // });
        console.log('operation', !!this.queueService, operation);

        ws.send(JSON.stringify({
          type: 'ACK',
          operationId: operation.id,
          status: 'success'
        }));

        this.metricsService.increment('websocket.operation.received');
      } catch (error) {
        this.handleError(ws, error as Error);
      }
    });

    ws.on('close', () => {
      this.logger.info('Client disconnected');
    });

    ws.on('error', (error) => {
      this.logger.error('WebSocket error:', error);
    });
  }

  private handleError(ws: WebSocket, error: Error): void {
    this.logger.error(error);
    ws.send(JSON.stringify({
      type: 'ERROR',
      message: 'Failed to process operation',
      details: error.message
    }));
  }
}