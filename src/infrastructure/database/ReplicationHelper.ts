import { Knex } from 'knex';

export class ReplicationHelper {
    constructor(private readonly knex: Knex) {}
  
    async checkReplicationStatus() {
      const result = await this.knex.raw(`
        SELECT 
          slot_name,
          plugin,
          slot_type,
          active,
          restart_lsn,
          confirmed_flush_lsn
        FROM pg_replication_slots
        WHERE slot_name = 'query_subscription_slot';
      `);
  
      return result.rows[0];
    }
  
    async getReplicationLag() {
      const result = await this.knex.raw(`
        SELECT CASE 
          WHEN pg_last_wal_receive_lsn() = pg_last_wal_replay_lsn()
            THEN 0
          ELSE EXTRACT (EPOCH FROM now() - pg_last_xact_replay_timestamp())
        END AS replication_lag;
      `);
  
      return result.rows[0].replication_lag;
    }
  
    async ensurePublication() {
      const result = await this.knex.raw(`
        SELECT pubname 
        FROM pg_publication 
        WHERE pubname = 'query_updates';
      `);
  
      if (result.rows.length === 0) {
        throw new Error('Publication query_updates not found');
      }
    }
  }