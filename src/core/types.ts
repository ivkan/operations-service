export interface Operation {
    id: string;
    tableName: string;
    recordId: string;
    operationData: Record<string, any>;
    userId: string;
    timestamp: Date;
  }
  
  export interface QueueMessage {
    operation: Operation;
    userId: string;
    timestamp: number;
  }
  
  export interface DatabaseConfig {
    host: string;
    port: number;
    database: string;
    user: string;
    password: string;
  }