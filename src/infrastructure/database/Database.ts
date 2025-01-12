import { Pool, PoolClient } from 'pg';
import { DatabaseConfig } from '../../core/types';
import { DatabaseError } from '../../core/errors';

export class Database {
  private pool: Pool;

  constructor(config: DatabaseConfig) {
    this.pool = new Pool(config);
  }

  public async transaction<T>(
    callback: (client: PoolClient) => Promise<T>
  ): Promise<T> {
    const client = await this.pool.connect();
    
    try {
      await client.query('BEGIN');
      const result = await callback(client);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      throw new DatabaseError('Transaction failed', error as Error);
    } finally {
      client.release();
    }
  }

  public getPool(): Pool {
    return this.pool;
  }

  public async destroy(): Promise<void> {
    await this.pool.end();
  }
} 