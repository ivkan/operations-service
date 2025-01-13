/* eslint-disable @typescript-eslint/naming-convention */
import { MigrationBuilder, ColumnDefinitions } from 'node-pg-migrate';

export const shorthands: ColumnDefinitions | undefined = undefined;

export async function up(pgm: MigrationBuilder): Promise<void> {
  // First create roles table
  pgm.createTable('roles', {
    id: { type: 'uuid', primaryKey: true },
    name: { type: 'varchar(50)', notNull: true, unique: true },
    label: { type: 'varchar(100)', notNull: true },
    is_deleted: { type: 'boolean', notNull: true, default: false },
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

  // Then create users table
  pgm.createTable('users', {
    id: { type: 'uuid', primaryKey: true },
    content: { type: 'jsonb', notNull: true, default: '{}' },
    roles: { type: 'text[]', notNull: true, default: '{}' },
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

  // Create trigger for updated_at on roles
  pgm.createTrigger(
    'roles',
    'update_roles_updated_at_trigger',
    {
      when: 'BEFORE',
      operation: 'UPDATE',
      function: 'update_updated_at_column',
      level: 'ROW'
    }
  );

  // Create trigger for updated_at on users
  pgm.createTrigger(
    'users',
    'update_users_updated_at_trigger',
    {
      when: 'BEFORE',
      operation: 'UPDATE',
      function: 'update_updated_at_column',
      level: 'ROW'
    }
  );

  // Create indexes
  pgm.createIndex('roles', 'name');
  pgm.createIndex('roles', 'is_deleted');
  pgm.createIndex('users', 'roles', { method: 'gin' });
  pgm.createIndex('users', 'updated_at');
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropIndex('users', 'updated_at');
  pgm.dropIndex('users', 'roles');
  pgm.dropIndex('roles', 'is_deleted');
  pgm.dropIndex('roles', 'name');
  
  pgm.dropTrigger('users', 'update_users_updated_at_trigger');
  pgm.dropTrigger('roles', 'update_roles_updated_at_trigger');
  
  pgm.dropTable('users');
  pgm.dropTable('roles');
}
