import { Pool } from '@neondatabase/serverless';

let pool: Pool | null = null;
let isConnectedToLiveDb = false;
let dbErrorDetail: string | null = null;

export function getPool(): Pool | null {
  return pool;
}

export function isDbConnected(): boolean {
  return isConnectedToLiveDb;
}

export function getDbError(): string | null {
  return dbErrorDetail;
}

export async function initDatabaseConnection(): Promise<{ connected: boolean; provider: string; details?: string }> {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString || connectionString.includes('ep-project-id.us-east-2.aws.neon.tech')) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('DATABASE_URL is required in production environment.');
    }
    isConnectedToLiveDb = false;
    dbErrorDetail = 'DATABASE_URL not configured. Operating in Resilient LocalStore (Non-Production Development Mode).';
    return {
      connected: false,
      provider: 'Resilient LocalStore (Non-Production Development Mode)',
      details: dbErrorDetail
    };
  }

  try {
    if (!pool) {
      pool = new Pool({
        connectionString,
        connectionTimeoutMillis: 5000
      });
    }

    const res = await pool.query('SELECT NOW() as current_time, current_database() as db_name;');
    isConnectedToLiveDb = true;
    dbErrorDetail = null;
    return {
      connected: true,
      provider: 'Neon Serverless PostgreSQL',
      details: `Connected to database: ${res.rows[0].db_name} at ${res.rows[0].current_time}`
    };
  } catch (err: any) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error(`Production database connection failure: ${err.message}`);
    }
    isConnectedToLiveDb = false;
    dbErrorDetail = err.message || 'Neon connection failed';
    return {
      connected: false,
      provider: 'Resilient LocalStore (Non-Production Development Mode - Neon Attempt Failed)',
      details: dbErrorDetail || undefined
    };
  }
}

export function handleDbError(err: any, operationName: string) {
  if (process.env.NODE_ENV === 'production') {
    console.error(`[DB Error in production] Operation '${operationName}' failed:`, err);
    throw new Error(`Database error during ${operationName}: ${err?.message || 'Query failed'}`);
  }
  console.warn(`[DB Dev Fallback] Database operation '${operationName}' failed:`, err?.message || err);
}
