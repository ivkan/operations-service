import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('operations_log', (table) => {
    table.uuid('id').primary();
    table.string('table_name').notNullable();
    table.uuid('record_id').notNullable();
    table.jsonb('operation_data').notNullable();
    table.uuid('user_id').notNullable();
    table.timestamp('server_timestamp').defaultTo(knex.fn.now());
    table.boolean('is_applied').defaultTo(true);
    table.string('status').defaultTo('pending');
    table.text('error_message');
    
    table.index(['table_name', 'record_id', 'is_applied']);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable('operations_log');
}