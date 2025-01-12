import { Pool } from 'pg';

export class ReplicationHelper {
  constructor(private readonly pool: Pool) {}

  async ensurePublication(): Promise<void> {
    const client = await this.pool.connect();
    try {
      await client.query('CREATE PUBLICATION IF NOT EXISTS app_publication FOR ALL TABLES');
    } finally {
      client.release();
    }
  }

  async checkReplicationStatus(): Promise<{ active: boolean }> {
    const client = await this.pool.connect();
    try {
      const result = await client.query(`
        SELECT active 
        FROM pg_replication_slots 
        WHERE slot_name = 'app_replication_slot'
      `);
      return { active: result.rows[0]?.active || false };
    } finally {
      client.release();
    }
  }

  async getReplicationLag(): Promise<number> {
    const client = await this.pool.connect();
    try {
      const result = await client.query(`
        SELECT EXTRACT(EPOCH FROM (now() - pg_last_xact_replay_timestamp()))::integer as lag
        FROM pg_stat_replication
        WHERE application_name = 'app_replication'
      `);
      return result.rows[0]?.lag || 0;
    } finally {
      client.release();
    }
  }
}