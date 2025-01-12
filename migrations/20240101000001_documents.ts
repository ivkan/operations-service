/* eslint-disable @typescript-eslint/naming-convention */
import { MigrationBuilder, ColumnDefinitions } from 'node-pg-migrate';

export const shorthands: ColumnDefinitions | undefined = undefined;

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.createTable('documents', {
    id: { type: 'uuid', primaryKey: true },
    content: { type: 'jsonb', notNull: true, default: '{}' },
    version: { type: 'integer', notNull: true, default: 1 },
    created_at: {
      type: 'timestamp',
      notNull: true,
      default: pgm.func('current_timestamp'),
    },
    updated_at: {
      type: 'timestamp',
      notNull: true,
      default: pgm.func('current_timestamp'),
    }
  });

  // Create trigger to automatically update updated_at
  pgm.createFunction(
    'update_updated_at_column',
    [],
    { returns: 'trigger', language: 'plpgsql' },
    `
    BEGIN
      NEW.updated_at = current_timestamp;
      RETURN NEW;
    END;
    `
  );

  pgm.createTrigger(
    'documents',
    'update_updated_at_trigger',
    {
      when: 'BEFORE',
      operation: 'UPDATE',
      function: 'update_updated_at_column',
      level: 'ROW'
    }
  );

  // Create index on updated_at for efficient querying
  pgm.createIndex('documents', 'updated_at');
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropTrigger('documents', 'update_updated_at_trigger');
  pgm.dropFunction('update_updated_at_column', []);
  pgm.dropTable('documents');
}
