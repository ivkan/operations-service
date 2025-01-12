import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // Enable logical replication
  await knex.raw(`
    ALTER SYSTEM SET wal_level = logical;
    ALTER SYSTEM SET max_replication_slots = 10;
    ALTER SYSTEM SET max_wal_senders = 10;
  `);

  // Create publication for tables that need to be monitored
  await knex.raw(`
    CREATE PUBLICATION query_updates FOR TABLE 
      operations_log,
      documents,
      -- Add other tables that need to be monitored
      other_table_name;
  `);

  // Create replication slot
  await knex.raw(`
    SELECT pg_create_logical_replication_slot(
      'query_subscription_slot',
      'pgoutput'
    );
  `);

  // Grant necessary permissions
  await knex.raw(`
    ALTER ROLE ${process.env.DB_USER} WITH REPLICATION;
  `);
}

export async function down(knex: Knex): Promise<void> {
  // Drop replication slot
  await knex.raw(`
    SELECT pg_drop_replication_slot('query_subscription_slot')
    WHERE EXISTS (
      SELECT 1 
      FROM pg_replication_slots 
      WHERE slot_name = 'query_subscription_slot'
    );
  `);

  // Drop publication
  await knex.raw(`
    DROP PUBLICATION IF EXISTS query_updates;
  `);

  // Reset replication settings
  await knex.raw(`
    ALTER SYSTEM RESET wal_level;
    ALTER SYSTEM RESET max_replication_slots;
    ALTER SYSTEM RESET max_wal_senders;
  `);
}