import { MigrationBuilder, ColumnDefinitions } from 'node-pg-migrate';

export const shorthands: ColumnDefinitions | undefined = undefined;

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.createTable('operations_log', {
    id: { type: 'uuid', primaryKey: true },
    table_name: { type: 'varchar(255)', notNull: true },
    record_id: { type: 'uuid', notNull: true },
    operation_data: { type: 'jsonb', notNull: true },
    user_id: { type: 'uuid', notNull: true },
    server_timestamp: {
      type: 'timestamp',
      notNull: true,
      default: pgm.func('current_timestamp')
    },
    is_applied: { type: 'boolean', notNull: true, default: true },
    status: { type: 'varchar(50)', notNull: true, default: 'pending' },
    error_message: { type: 'text' }
  });

  pgm.createIndex('operations_log', 
    ['table_name', 'record_id', 'is_applied']
  );
};

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropTable('operations_log');
};