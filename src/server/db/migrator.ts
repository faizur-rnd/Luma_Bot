import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { getPool, isDbConnected } from './connection.ts';

export interface MigrationResult {
  success: boolean;
  message: string;
  appliedCount?: number;
  migrations?: string[];
}

export async function runMigrations(): Promise<MigrationResult> {
  const pool = getPool();
  if (!pool || !isDbConnected()) {
    return {
      success: true,
      message: 'Running in LocalStore mode. In-memory schema initialized.',
      appliedCount: 0
    };
  }

  const client = await pool.connect();
  const appliedList: string[] = [];

  try {
    // Acquire PostgreSQL advisory lock to prevent concurrent migrations during scaled container startup
    const ADVISORY_LOCK_ID = 7429184;
    await client.query('SELECT pg_advisory_lock($1);', [ADVISORY_LOCK_ID]);

    // Ensure schema_migrations table exists
    await client.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        version VARCHAR(64) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        applied_at TIMESTAMPTZ DEFAULT NOW(),
        checksum VARCHAR(64)
      );
    `);

    // Get list of already applied migrations
    const appliedRes = await client.query('SELECT version, checksum FROM schema_migrations ORDER BY version ASC;');
    const appliedMap = new Map<string, string>();
    for (const row of appliedRes.rows) {
      appliedMap.set(row.version, row.checksum);
    }

    // Locate migrations directory
    const migrationsDir = path.resolve(process.cwd(), 'src/server/migrations');
    if (!fs.existsSync(migrationsDir)) {
      await client.query('SELECT pg_advisory_unlock($1);', [ADVISORY_LOCK_ID]);
      return { success: true, message: 'No migrations directory found.', appliedCount: 0 };
    }

    const files = fs.readdirSync(migrationsDir)
      .filter(f => f.endsWith('.sql'))
      .sort((a, b) => a.localeCompare(b));

    for (const file of files) {
      const match = file.match(/^(\d+)[-_](.+)\.sql$/);
      if (!match) continue;

      const version = match[1];
      const name = match[2];
      const filePath = path.join(migrationsDir, file);
      const sqlContent = fs.readFileSync(filePath, 'utf8');
      const checksum = crypto.createHash('sha256').update(sqlContent).digest('hex');

      if (appliedMap.has(version)) {
        continue;
      }

      console.log(`[Database Migration] Applying migration ${version}: ${file}...`);
      await client.query('BEGIN');
      try {
        await client.query(sqlContent);
        await client.query(
          'INSERT INTO schema_migrations (version, name, checksum, applied_at) VALUES ($1, $2, $3, NOW());',
          [version, file, checksum]
        );
        await client.query('COMMIT');
        appliedList.push(file);
      } catch (err: any) {
        await client.query('ROLLBACK');
        console.error(`[Database Migration FAILED] Migration ${file} failed:`, err);
        throw new Error(`Migration ${file} failed: ${err.message}`);
      }
    }

    await client.query('SELECT pg_advisory_unlock($1);', [ADVISORY_LOCK_ID]);
    return {
      success: true,
      message: appliedList.length > 0 
        ? `Successfully applied ${appliedList.length} migrations: ${appliedList.join(', ')}`
        : 'Database schema up to date. Zero pending migrations.',
      appliedCount: appliedList.length,
      migrations: appliedList
    };
  } catch (err: any) {
    try {
      await client.query('SELECT pg_advisory_unlock(7429184);');
    } catch {}
    if (process.env.NODE_ENV === 'production') {
      throw new Error(`Database migration execution failed: ${err.message}`);
    }
    return {
      success: false,
      message: `Database migration error: ${err.message}`
    };
  } finally {
    client.release();
  }
}
