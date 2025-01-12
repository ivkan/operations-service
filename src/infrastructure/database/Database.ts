import knex, { Knex } from 'knex';
import { DatabaseConfig } from '../../core/types';
import { DatabaseError } from '../../core/errors';

export class Database {
  private knex: Knex;

  constructor(config: DatabaseConfig) {
    this.knex = knex({
      client: 'pg',
      connection: config,
      pool: {
        min: 2,
        max: 10
      }
    });
  }

  public async transaction<T>(
    callback: (trx: Knex.Transaction) => Promise<T>
  ): Promise<T> {
    try {
      return await this.knex.transaction(callback);
    } catch (error) {
      throw new DatabaseError('Transaction failed', error as Error);
    }
  }

  public async destroy(): Promise<void> {
    await this.knex.destroy();
  }

  public getKnex(): Knex {
    return this.knex;
  }
} 