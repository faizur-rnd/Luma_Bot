import React, { useState, useEffect } from 'react';
import { 
  Database, 
  RefreshCw, 
  CheckCircle, 
  AlertTriangle, 
  Terminal, 
  Download, 
  Trash2, 
  ShieldCheck, 
  Lock, 
  Server,
  Layers
} from 'lucide-react';
import { apiClient, DbStatusInfo, UserProfile } from '../services/apiClient.ts';

interface DatabaseAdminViewProps {
  profile: UserProfile | null;
  theme: 'dark' | 'light';
  onRefreshProfile: () => void;
}

export const DatabaseAdminView: React.FC<DatabaseAdminViewProps> = ({
  profile,
  theme,
  onRefreshProfile
}) => {
  const [dbStatus, setDbStatus] = useState<DbStatusInfo | null>(null);
  const [migrationStatus, setMigrationStatus] = useState<string | null>(null);
  const [isMigrating, setIsMigrating] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [purgeConfirmation, setPurgeConfirmation] = useState(false);
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  useEffect(() => {
    checkHealth();
  }, []);

  const checkHealth = async () => {
    setIsChecking(true);
    try {
      const res = await apiClient.getDbHealth();
      setDbStatus(res.database);
    } catch {
      setDbStatus({
        isLive: false,
        provider: 'Local Cache Fallback',
        hasConnectionString: false,
        error: 'Unable to query backend health'
      });
    } finally {
      setIsChecking(false);
    }
  };

  const handleRunMigrations = async () => {
    setIsMigrating(true);
    setMigrationStatus(null);
    try {
      const res = await apiClient.runDbMigrations();
      setMigrationStatus(res.message);
    } catch (err: any) {
      setMigrationStatus(`Error: ${err.message}`);
    } finally {
      setIsMigrating(false);
    }
  };

  const handleExportData = () => {
    window.open('/api/privacy/export', '_blank');
  };

  const handlePurgeAccount = async () => {
    try {
      await apiClient.purgeUserData();
      setPurgeConfirmation(false);
      setActionNotice('Account data completely wiped. Initialized fresh user session.');
      onRefreshProfile();
      setTimeout(() => setActionNotice(null), 5000);
    } catch (err: any) {
      setActionNotice(`Purge failed: ${err.message}`);
    }
  };

  const schemaTables = [
    { name: 'users', desc: 'Core account identity, bridge languages, proficiency levels' },
    { name: 'user_progress', desc: 'CEFR lesson completion, scores, time practiced' },
    { name: 'vocabulary_items', desc: 'Spaced repetition flashcards with Leitner box stages' },
    { name: 'assessment_attempts', desc: 'Spoken teach-back scores (Pronunciation, Fluency, Grammar, Lexical)' },
    { name: 'conversation_sessions', desc: 'Interactive voice sessions, transcripts, and AI coaching' },
    { name: 'privacy_consents', desc: 'Audio recording retention and GDPR deletion logs' }
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 flex flex-col gap-6">
      {/* Banner */}
      <div className="p-6 rounded-3xl border flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
        style={{
          backgroundColor: theme === 'dark' ? '#111827' : '#FFFFFF',
          borderColor: theme === 'dark' ? '#263044' : '#E2E8F0'
        }}
      >
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-aurora p-[2px] flex items-center justify-center">
            <div className="w-full h-full rounded-[14px] bg-[#080B14] flex items-center justify-center">
              <Database className="w-6 h-6 text-[#22D3EE]" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight">Neon Serverless PostgreSQL Console</h1>
              <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${
                dbStatus?.isLive
                  ? 'border-[#34D399]/30 bg-[#34D399]/10 text-[#34D399]'
                  : 'border-[#FB923C]/30 bg-[#FB923C]/10 text-[#FB923C]'
              }`}>
                {dbStatus?.isLive ? 'Live Neon DB' : 'Resilient Fallback Mode'}
              </span>
            </div>
            <p className="text-xs text-[#64748B] dark:text-[#94A3B8] mt-0.5">
              Targeted serverless PostgreSQL database with automated DDL migrations and user data isolation.
            </p>
          </div>
        </div>

        <button
          onClick={checkHealth}
          disabled={isChecking}
          className="px-4 py-2 rounded-xl border border-black/10 dark:border-white/10 hover:border-[#8B5CF6] text-xs font-semibold flex items-center gap-2 cursor-pointer transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isChecking ? 'animate-spin' : ''}`} />
          <span>Ping Connection</span>
        </button>
      </div>

      {actionNotice && (
        <div className="p-4 rounded-2xl bg-[#34D399]/10 border border-[#34D399]/30 text-xs font-semibold text-[#34D399] flex items-center gap-2">
          <CheckCircle className="w-4 h-4" />
          <span>{actionNotice}</span>
        </div>
      )}

      {/* Grid: Database Status & Operations */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Live Connection Status & Migration Runner */}
        <div className="lg:col-span-7 flex flex-col gap-5">
          <div className="p-6 rounded-2xl border"
            style={{
              backgroundColor: theme === 'dark' ? '#111827' : '#FFFFFF',
              borderColor: theme === 'dark' ? '#263044' : '#E2E8F0'
            }}
          >
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold uppercase tracking-wider text-[#8B5CF6]">
                Connection Telemetry
              </span>
              <span className="text-xs font-mono text-[#64748B]">
                SSL Mode: require
              </span>
            </div>

            <div className="space-y-3">
              <div className="p-3.5 rounded-xl bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/10 flex items-center justify-between">
                <span className="text-xs text-[#64748B] dark:text-[#94A3B8]">Active Provider</span>
                <span className="text-xs font-bold font-mono text-white">
                  {dbStatus?.provider || 'Initializing...'}
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/10 flex items-center justify-between">
                <span className="text-xs text-[#64748B] dark:text-[#94A3B8]">Environment Variable</span>
                <span className="text-xs font-mono text-[#8B5CF6]">
                  DATABASE_URL {dbStatus?.hasConnectionString ? '(Configured)' : '(Pending live URL)'}
                </span>
              </div>

              {dbStatus?.error && (
                <div className="p-3.5 rounded-xl border border-[#FB923C]/30 bg-[#FB923C]/5 text-xs text-[#FB923C] flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">Operational Note: </span>
                    {dbStatus.error}
                  </div>
                </div>
              )}
            </div>

            {/* Run Migrations Button */}
            <div className="mt-6 pt-5 border-t border-black/10 dark:border-white/10 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold">Database Schema Migrations</h4>
                  <p className="text-[11px] text-[#64748B]">
                    Applies idempotent DDL table creation and indexing scripts.
                  </p>
                </div>
                <button
                  onClick={handleRunMigrations}
                  disabled={isMigrating}
                  className="px-4 py-2 rounded-xl bg-gradient-cosmic text-white text-xs font-bold shadow-md cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                >
                  <Terminal className="w-3.5 h-3.5" />
                  <span>{isMigrating ? 'Applying...' : 'Run Migrations'}</span>
                </button>
              </div>

              {migrationStatus && (
                <div className="p-3 rounded-xl bg-[#22D3EE]/10 border border-[#22D3EE]/30 text-xs font-mono text-[#22D3EE]">
                  {migrationStatus}
                </div>
              )}
            </div>
          </div>

          {/* Database Schema Overview */}
          <div className="p-6 rounded-2xl border"
            style={{
              backgroundColor: theme === 'dark' ? '#111827' : '#FFFFFF',
              borderColor: theme === 'dark' ? '#263044' : '#E2E8F0'
            }}
          >
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#64748B] mb-3">
              Managed Relational Schema Tables
            </h3>
            <div className="space-y-2">
              {schemaTables.map(t => (
                <div
                  key={t.name}
                  className="p-3 rounded-xl border border-black/5 dark:border-white/5 flex items-center justify-between"
                >
                  <div>
                    <span className="text-xs font-mono font-bold text-[#8B5CF6]">
                      {t.name}
                    </span>
                    <p className="text-[11px] text-[#64748B] dark:text-[#94A3B8]">
                      {t.desc}
                    </p>
                  </div>
                  <CheckCircle className="w-4 h-4 text-[#34D399]" />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Privacy, Data Export & GDPR Purge */}
        <div className="lg:col-span-5 flex flex-col gap-5">
          <div className="p-6 rounded-2xl border flex flex-col gap-4"
            style={{
              backgroundColor: theme === 'dark' ? '#111827' : '#FFFFFF',
              borderColor: theme === 'dark' ? '#263044' : '#E2E8F0'
            }}
          >
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-[#34D399]" />
              <h3 className="text-sm font-bold">Privacy & Data Governance</h3>
            </div>
            <p className="text-xs text-[#64748B] dark:text-[#94A3B8]">
              GDPR-compliant data export, zero privileged database credentials in browser, and complete account deletion.
            </p>

            {/* Export User Data */}
            <div className="p-4 rounded-xl border border-black/5 dark:border-white/10 space-y-2">
              <div className="text-xs font-bold">Export Complete Learning Record</div>
              <p className="text-[11px] text-[#64748B]">
                Download a JSON archive of your profiles, CEFR progress, vocabulary cards, and assessment transcripts.
              </p>
              <button
                onClick={handleExportData}
                className="w-full py-2.5 px-3 rounded-lg border border-[#8B5CF6] text-[#8B5CF6] hover:bg-[#8B5CF6]/10 text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer transition-colors"
              >
                <Download className="w-4 h-4" />
                <span>Download JSON Data Archive</span>
              </button>
            </div>

            {/* Account Purge */}
            <div className="p-4 rounded-xl border border-[#FB7185]/20 bg-[#FB7185]/5 space-y-2">
              <div className="text-xs font-bold text-[#FB7185]">Purge Account & Learning Data</div>
              <p className="text-[11px] text-[#64748B]">
                Permanently wipes all progress, custom vocabulary words, and assessment recordings. Irreversible.
              </p>
              {!purgeConfirmation ? (
                <button
                  onClick={() => setPurgeConfirmation(true)}
                  className="w-full py-2 px-3 rounded-lg border border-[#FB7185]/40 text-[#FB7185] hover:bg-[#FB7185]/15 text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Request Data Wipeout</span>
                </button>
              ) : (
                <div className="space-y-2 pt-1">
                  <p className="text-[11px] font-bold text-[#FB7185]">
                    Confirm complete data purge?
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setPurgeConfirmation(false)}
                      className="flex-1 py-1.5 text-xs font-semibold rounded bg-black/10 text-white"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handlePurgeAccount}
                      className="flex-1 py-1.5 text-xs font-semibold rounded bg-[#FB7185] text-white cursor-pointer"
                    >
                      Yes, Wipe Everything
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
