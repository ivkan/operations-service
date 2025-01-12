import { MigrationBuilder, ColumnDefinitions } from 'node-pg-migrate';

export const shorthands: ColumnDefinitions | undefined = undefined;

// Add this to run commands outside transaction
export const skipTransactions = true;

export async function up(pgm: MigrationBuilder): Promise<void> {
  // System configurations
  pgm.sql(`
    ALTER SYSTEM SET wal_level = logical;
    ALTER SYSTEM SET max_replication_slots = 10;
    ALTER SYSTEM SET max_wal_senders = 10;
  `);

  // Other operations
  pgm.sql(`
    CREATE PUBLICATION query_updates FOR TABLE 
      operations_log,
      documents,
      other_table_name;
  `);

  pgm.sql(`
    SELECT pg_create_logical_replication_slot(
      'query_subscription_slot',
      'pgoutput'
    );
  `);

  pgm.sql(`
    ALTER ROLE ${process.env.DB_USER} WITH REPLICATION;
  `);
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.sql(`
    SELECT pg_drop_replication_slot('query_subscription_slot')
    WHERE EXISTS (
      SELECT 1 FROM pg_replication_slots 
      WHERE slot_name = 'query_subscription_slot'
    );
  `);

  pgm.sql('DROP PUBLICATION IF EXISTS query_updates;');

  pgm.sql(`
    ALTER SYSTEM RESET wal_level;
    ALTER SYSTEM RESET max_replication_slots;
    ALTER SYSTEM RESET max_wal_senders;
  `);
}