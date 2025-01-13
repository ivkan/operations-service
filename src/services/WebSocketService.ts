import WebSocket from 'ws';
import { Packr, Unpackr } from 'msgpackr';
import { QueueService } from './QueueService';
import { MetricsService } from './MetricsService';
import { Operation } from '../core/types';
import { Logger } from 'pino';

export class WebSocketService {
  private wss: WebSocket.Server;
  private packr: Packr;
  private unpackr: Unpackr;

  constructor(
    private readonly port: number,
    private readonly queueService: QueueService,
    private readonly metricsService: MetricsService,
    private readonly logger: Logger
  ) {
    this.wss = new WebSocket.Server({ port });
    this.packr = new Packr();
    this.unpackr = new Unpackr();
  }

  public start(): void {
    this.wss.on('connection', this.handleConnection.bind(this));
    this.logger.info(`WebSocket server started on port ${this.port}`);
  }

  private handleConnection(ws: WebSocket): void {
    this.logger.info('New client connected');
    
    // Send initial connection acknowledgment
    ws.send(this.packr.pack({ 
      type: 'CONNECTION_ACK',
      message: 'Connected to operations service'
    }));

    ws.on('message', (data: WebSocket.Data) => {
      try {
        const operation: Operation = this.unpackr.unpack(data as Buffer);
        
        this.queueService.publish({
          operation,
          userId: operation.userId,
          timestamp: Date.now()
        });

        ws.send(this.packr.pack({
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
    ws.send(this.packr.pack({
      type: 'ERROR',
      message: 'Failed to process operation',
      details: error.message
    }));
  }
}