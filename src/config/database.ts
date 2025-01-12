import { DatabaseConfig } from '../core/types';

export const getDatabaseConfig = (): DatabaseConfig => ({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'operations_db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '',
}); 