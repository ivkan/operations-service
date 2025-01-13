import { MigrationBuilder, ColumnDefinitions } from 'node-pg-migrate';

export const shorthands: ColumnDefinitions | undefined = undefined;

export async function up(pgm: MigrationBuilder): Promise<void> {
  // Add is_deleted column to users table
  pgm.addColumn('users', {
    is_deleted: {
      type: 'boolean',
      notNull: true,
      default: false
    }
  });

  // Add is_deleted column to documents table
  pgm.addColumn('documents', {
    is_deleted: {
      type: 'boolean',
      notNull: true,
      default: false
    }
  });

  // Create indexes for efficient filtering
  pgm.createIndex('users', 'is_deleted');
  pgm.createIndex('documents', 'is_deleted');
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  // Drop indexes first
  pgm.dropIndex('users', 'is_deleted');
  pgm.dropIndex('documents', 'is_deleted');

  // Then drop columns
  pgm.dropColumn('users', 'is_deleted');
  pgm.dropColumn('documents', 'is_deleted');
}
