'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { LoadingAnimation } from '@/components/ui/loading-animation';
import {
  Activity,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Clock,
  Server,
  Database,
  FileText,
  Briefcase,
  Sparkles,
} from 'lucide-react';
import { API_URL } from '@/lib/api/client';
import type { SystemStatus } from '@/lib/api/config';

interface SystemStatusSectionProps {
  systemStatus: SystemStatus | null;
  statusLoading: boolean;
  lastFetched: Date | null;
  refreshStatus: () => Promise<void>;
  t: (key: string, params?: Record<string, string | number>) => string;
}

export function SystemStatusSection({
  systemStatus,
  statusLoading,
  lastFetched,
  refreshStatus,
  t,
}: SystemStatusSectionProps) {
  const formatLastFetched = () => {
    if (!lastFetched) return t('settings.systemStatus.lastFetched.never');
    const now = new Date();
    const diff = Math.floor((now.getTime() - lastFetched.getTime()) / 1000);
    if (diff < 60) return t('settings.systemStatus.lastFetched.justNow');
    if (diff < 3600)
      return t('settings.systemStatus.lastFetched.minutesAgo', { minutes: Math.floor(diff / 60) });
    return t('settings.systemStatus.lastFetched.hoursAgo', { hours: Math.floor(diff / 3600) });
  };

  const metrics = systemStatus
    ? [
        {
          label: t('settings.statusCards.llm'),
          value: systemStatus.llm_healthy
            ? t('settings.statusValues.healthy')
            : t('settings.statusValues.offline'),
          icon: Server,
          healthy: systemStatus.llm_healthy,
          tone: systemStatus.llm_healthy ? 'emerald' : 'rose',
          emphasis: 'status',
        },
        {
          label: t('settings.statusCards.database'),
          value: t('settings.statusValues.connected'),
          icon: Database,
          healthy: true,
          tone: 'cyan',
          emphasis: 'status',
        },
        {
          label: t('settings.statusCards.resumes'),
          value: String(systemStatus.database_stats.total_resumes),
          icon: FileText,
          healthy: true,
          tone: 'amber',
          emphasis: 'number',
        },
        {
          label: t('settings.statusCards.jobs'),
          value: String(systemStatus.database_stats.total_jobs),
          icon: Briefcase,
          healthy: true,
          tone: 'violet',
          emphasis: 'number',
        },
        {
          label: t('settings.statusCards.improvements'),
          value: String(systemStatus.database_stats.total_improvements),
          icon: Sparkles,
          healthy: true,
          tone: 'fuchsia',
          emphasis: 'number',
        },
        {
          label: t('settings.statusCards.masterResume'),
          value: systemStatus.has_master_resume
            ? t('settings.statusValues.configured')
            : t('settings.statusValues.notSet'),
          icon: FileText,
          healthy: systemStatus.has_master_resume,
          tone: systemStatus.has_master_resume ? 'emerald' : 'amber',
          emphasis: 'status',
        },
      ]
    : [];

  const toneClasses: Record<string, string> = {
    emerald:
      'border-emerald-400/15 bg-[linear-gradient(180deg,rgba(16,185,129,0.08),rgba(255,255,255,0.02))] text-emerald-200',
    rose: 'border-rose-400/15 bg-[linear-gradient(180deg,rgba(244,63,94,0.08),rgba(255,255,255,0.02))] text-rose-200',
    cyan: 'border-cyan-400/15 bg-[linear-gradient(180deg,rgba(34,211,238,0.08),rgba(255,255,255,0.02))] text-cyan-200',
    amber:
      'border-amber-400/15 bg-[linear-gradient(180deg,rgba(251,191,36,0.08),rgba(255,255,255,0.02))] text-amber-200',
    violet:
      'border-violet-400/15 bg-[linear-gradient(180deg,rgba(139,92,246,0.08),rgba(255,255,255,0.02))] text-violet-200',
    fuchsia:
      'border-fuchsia-400/15 bg-[linear-gradient(180deg,rgba(217,70,239,0.08),rgba(255,255,255,0.02))] text-fuchsia-200',
  };

  return (
    <section className="relative overflow-hidden rounded-[2rem] border border-cyan-400/15 bg-[#07131a] text-white shadow-[0_30px_80px_rgba(0,0,0,0.45)]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(34,211,238,0.12),_transparent_28%),radial-gradient(circle_at_82%_16%,_rgba(168,85,247,0.10),_transparent_22%),linear-gradient(180deg,rgba(9,21,29,0.98),rgba(4,10,15,1))]" />
      <div
        className="absolute inset-0 opacity-[0.16]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(148,163,184,0.14) 1px, transparent 1px), linear-gradient(90deg, rgba(148,163,184,0.14) 1px, transparent 1px)',
          backgroundSize: '36px 36px',
        }}
      />
      <div className="absolute -left-8 top-10 h-32 w-32 rounded-full bg-cyan-400/10 blur-3xl" />
      <div className="absolute right-0 top-0 h-40 w-40 rounded-full bg-violet-500/10 blur-3xl" />

      <div className="relative border-b border-white/10 px-5 py-6 sm:px-8 sm:py-8">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-cyan-300/20 bg-[linear-gradient(135deg,#22d3ee,#0f766e)] shadow-[0_12px_30px_rgba(34,211,238,0.22)]">
              <Activity className="h-6 w-6 text-white" />
            </div>

            <div>
              <div className="inline-flex items-center rounded-full border border-cyan-300/15 bg-cyan-300/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.28em] text-cyan-100">
                telemetry board
              </div>
              <h2 className="mt-3 text-3xl font-black uppercase tracking-[-0.06em] text-[#ecfeff] sm:text-4xl">
                {t('settings.systemStatus.title')}
              </h2>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300 sm:text-base">
                A live control-surface view of model readiness, data health, and workspace volume.
              </p>
            </div>
          </div>

          <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center">
            <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 backdrop-blur-sm">
              <p className="flex items-center gap-2 text-[10px] uppercase tracking-[0.24em] text-slate-400">
                <Clock className="h-3.5 w-3.5" />
                last sync
              </p>
              <p className="mt-1 text-sm font-semibold text-slate-100">{formatLastFetched()}</p>
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={refreshStatus}
              disabled={statusLoading}
              className="h-11 rounded-2xl border border-cyan-300/15 bg-white/[0.03] px-4 text-cyan-100 transition-all hover:border-cyan-300/30 hover:bg-cyan-300/10 hover:text-white"
            >
              <RefreshCw className={`mr-2 h-4 w-4 ${statusLoading ? 'animate-spin' : ''}`} />
              {t('settings.systemStatus.refresh')}
            </Button>
          </div>
        </div>
      </div>

      <div className="relative px-5 py-5 sm:px-8 sm:py-8">
        {statusLoading ? (
          <div className="overflow-hidden rounded-[1.75rem] border border-cyan-300/12 bg-[linear-gradient(180deg,rgba(255,255,255,0.03),rgba(255,255,255,0.015))]">
            <LoadingAnimation message="Checking system status..." variant="sparkle" size="md" />
          </div>
        ) : !systemStatus ? (
          <div className="flex flex-col items-center justify-center gap-4 rounded-[1.75rem] border border-rose-400/20 bg-[linear-gradient(180deg,rgba(244,63,94,0.08),rgba(255,255,255,0.015))] px-6 py-12 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-rose-300/15 bg-rose-400/10 shadow-[0_12px_30px_rgba(244,63,94,0.15)]">
              <XCircle className="h-8 w-8 text-rose-300" />
            </div>
            <div className="space-y-2">
              <p className="text-base font-bold uppercase tracking-[0.08em] text-rose-100">
                {t('settings.systemStatus.unableToConnect')}
              </p>
              <p className="text-xs text-slate-400">
                {t('settings.systemStatus.expectedAt', { apiUrl: API_URL })}
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={refreshStatus}
              className="mt-2 rounded-xl border-rose-300/20 bg-transparent text-rose-100 hover:bg-rose-400/10"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              {t('common.retry')}
            </Button>
          </div>
        ) : (
          <div className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {metrics.map((metric) => {
                const Icon = metric.icon;
                const healthyIcon = metric.healthy ? (
                  <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                ) : (
                  <XCircle className="h-5 w-5 text-rose-400" />
                );

                return (
                  <div
                    key={metric.label}
                    className={`group relative overflow-hidden rounded-[1.75rem] border p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] transition-transform duration-300 hover:-translate-y-0.5 sm:p-6 ${toneClasses[metric.tone]}`}
                  >
                    <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/50 to-transparent" />
                    <div className="relative">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex min-w-0 items-start gap-3">
                          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-black/20">
                            <Icon className="h-4.5 w-4.5" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-[11px] uppercase tracking-[0.26em] text-white/60">
                              {metric.label}
                            </p>
                            <p
                              className={`mt-3 break-words text-white ${
                                metric.emphasis === 'number'
                                  ? 'text-4xl font-black tracking-[-0.06em]'
                                  : 'text-lg font-bold'
                              }`}
                            >
                              {metric.value}
                            </p>
                          </div>
                        </div>

                        <div className="shrink-0">{healthyIcon}</div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="grid gap-4 lg:grid-cols-[minmax(0,1.25fr)_minmax(280px,0.75fr)]">
              <div className="overflow-hidden rounded-[1.75rem] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.03),rgba(255,255,255,0.015))] p-5 sm:p-6">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/5">
                    <Database className="h-4 w-4 text-cyan-200" />
                  </div>
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.24em] text-slate-400">
                      data footprint
                    </p>
                    <p className="mt-1 text-lg font-bold text-slate-50">Workspace distribution</p>
                  </div>
                </div>

                <div className="mt-6 grid gap-4 sm:grid-cols-3">
                  <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                    <p className="text-[10px] uppercase tracking-[0.22em] text-slate-500">
                      resumes
                    </p>
                    <p className="mt-2 text-2xl font-black tracking-[-0.05em] text-white">
                      {systemStatus.database_stats.total_resumes}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                    <p className="text-[10px] uppercase tracking-[0.22em] text-slate-500">jobs</p>
                    <p className="mt-2 text-2xl font-black tracking-[-0.05em] text-white">
                      {systemStatus.database_stats.total_jobs}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                    <p className="text-[10px] uppercase tracking-[0.22em] text-slate-500">
                      improvements
                    </p>
                    <p className="mt-2 text-2xl font-black tracking-[-0.05em] text-white">
                      {systemStatus.database_stats.total_improvements}
                    </p>
                  </div>
                </div>
              </div>

              <div className="overflow-hidden rounded-[1.75rem] border border-white/10 bg-[linear-gradient(180deg,rgba(34,211,238,0.06),rgba(255,255,255,0.015))] p-5 sm:p-6">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/5">
                    <Activity className="h-4 w-4 text-cyan-200" />
                  </div>
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.24em] text-slate-400">
                      network target
                    </p>
                    <p className="mt-1 text-lg font-bold text-slate-50">Endpoint binding</p>
                  </div>
                </div>

                <div className="mt-6 rounded-2xl border border-white/10 bg-black/20 p-4">
                  <p className="text-[10px] uppercase tracking-[0.22em] text-slate-500">
                    expected api
                  </p>
                  <p className="mt-2 break-all text-sm leading-6 text-slate-200">{API_URL}</p>
                </div>

                <div className="mt-4 flex items-center justify-between rounded-2xl border border-white/10 bg-black/20 px-4 py-3">
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.22em] text-slate-500">
                      poll state
                    </p>
                    <p className="mt-1 text-sm font-semibold text-slate-100">
                      {statusLoading ? 'Refreshing telemetry' : 'Standby until next refresh'}
                    </p>
                  </div>
                  <span className="h-2.5 w-2.5 rounded-full bg-cyan-300 shadow-[0_0_18px_rgba(103,232,249,0.85)]" />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
