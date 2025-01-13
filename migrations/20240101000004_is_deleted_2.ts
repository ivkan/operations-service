import { MigrationBuilder, ColumnDefinitions } from 'node-pg-migrate';

export const shorthands: ColumnDefinitions | undefined = undefined;

export async function up(pgm: MigrationBuilder): Promise<void> {
  // Add is_deleted column to operations_log table
  pgm.addColumn('operations_log', {
    is_delete_operation: {
      type: 'boolean',
      notNull: true,
      default: false,
      comment: 'Indicates if this operation deletes a record in the target table'
    }
  });

  // Create index for efficient filtering of delete operations
  pgm.createIndex('operations_log', [
    'table_name',
    'record_id',
    'is_delete_operation'
  ]);
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  // Drop index first
  pgm.dropIndex('operations_log', [
    'table_name',
    'record_id',
    'is_delete_operation'
  ]);

  // Then drop column
  pgm.dropColumn('operations_log', 'is_delete_operation');
}
