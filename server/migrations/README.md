# Database Migrations

This project uses manual SQL migrations. Migration files are numbered and should be run in order against your PostgreSQL database.

## Running Migrations

```bash
psql -h <host> -U <user> -d <database> -f migrations/001_initial_schema.sql
```

## Creating New Migrations

1. Create a new file following the naming convention: `NNN_description.sql`
2. Write your SQL (CREATE TABLE, ALTER TABLE, etc.)
3. Test against a development database before committing
4. Keep migrations idempotent where possible (use `IF NOT EXISTS`, `IF EXISTS`)

## Conventions

- Use `snake_case` for table and column names
- Always include `created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()` on new tables
- Always include `updated_at TIMESTAMPTZ` for mutable tables
- Use `UUID` primary keys with `DEFAULT gen_random_uuid()`
- Add indexes for frequently queried columns
