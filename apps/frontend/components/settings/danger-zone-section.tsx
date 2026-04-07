'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Key, Trash2, Lock as LockIcon } from 'lucide-react';

interface DangerZoneSectionProps {
  isResetting: boolean;
  isAdmin: boolean;
  onClearApiKeys: () => void;
  onResetDatabase: () => void;
  t: (key: string, params?: Record<string, string | number>) => string;
}

export function DangerZoneSection({
  isResetting,
  isAdmin,
  onClearApiKeys,
  onResetDatabase,
  t,
}: DangerZoneSectionProps) {
  return (
    <section className="relative overflow-hidden rounded-[2rem] border border-[#ff7a7a]/20 bg-[#12090c] text-white shadow-[0_30px_80px_rgba(0,0,0,0.45)]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(255,120,120,0.18),_transparent_34%),radial-gradient(circle_at_80%_18%,_rgba(255,196,107,0.12),_transparent_22%),linear-gradient(180deg,rgba(30,10,14,0.96),rgba(14,6,9,0.98))]" />
      <div
        className="absolute inset-0 opacity-[0.14]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.07) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.07) 1px, transparent 1px)',
          backgroundSize: '30px 30px',
        }}
      />
      <div className="absolute -left-10 top-10 h-32 w-32 rounded-full bg-[#ff6b6b]/20 blur-3xl" />
      <div className="absolute right-0 top-0 h-40 w-40 rounded-full bg-[#ffb86b]/10 blur-3xl" />

      <div className="relative border-b border-white/10 px-5 py-6 sm:px-8 sm:py-8">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-[linear-gradient(135deg,#ff6b6b,#ff9e7a)] shadow-[0_12px_30px_rgba(255,107,107,0.35)]">
              <AlertTriangle className="h-6 w-6 text-white" />
            </div>

            <div>
              <div className="inline-flex items-center rounded-full border border-[#ffb3b3]/20 bg-[#ff8c8c]/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.28em] text-[#ffd1d1]">
                restricted operations
              </div>
              <h2 className="mt-3 text-3xl font-black uppercase tracking-[-0.06em] text-[#fff4f1] sm:text-4xl">
                {t('settings.dangerZone')}
              </h2>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-[#f3c7c2] sm:text-base">
                High-impact controls for credential cleanup and full data resets. Designed to feel
                deliberate, visible, and impossible to trigger casually.
              </p>
            </div>
          </div>

          <div className="self-start rounded-2xl border border-[#ffc7a3]/15 bg-black/20 px-4 py-3 backdrop-blur-sm">
            <p className="text-[10px] uppercase tracking-[0.24em] text-[#ffcfbf]/70">Access</p>
            <p className="mt-1 text-sm font-semibold text-[#fff1ed]">
              {isAdmin ? 'Administrator session' : 'Restricted until admin unlock'}
            </p>
          </div>
        </div>
      </div>

      <div className="relative px-5 py-5 sm:px-8 sm:py-8">
        <div className="grid gap-5 xl:grid-cols-2">
          <div className="group relative overflow-hidden rounded-[1.75rem] border border-[#ff8a8a]/15 bg-[linear-gradient(180deg,rgba(255,255,255,0.03),rgba(255,255,255,0.015))] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] transition-transform duration-300 hover:-translate-y-0.5 sm:p-6">
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#ff8d8d]/60 to-transparent" />
            <div className="flex items-start justify-between gap-4">
              <div className="flex min-w-0 items-start gap-3">
                <div className="mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/5">
                  <Key className="h-4 w-4 text-[#ffd3c7]" />
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] uppercase tracking-[0.26em] text-[#ffb7b7]/75">
                    Credential purge
                  </p>
                  <h3 className="mt-2 text-lg font-bold text-[#fff5f2]">
                    {t('settings.clearApiKeys')}
                  </h3>
                </div>
              </div>
              {!isAdmin && (
                <div className="rounded-full border border-white/10 bg-white/5 p-2">
                  <LockIcon className="h-3.5 w-3.5 text-[#ffcfbf]" />
                </div>
              )}
            </div>

            <p className="mt-4 text-sm leading-6 text-[#f0c2bc]">
              {t('settings.clearApiKeysDescription')}
            </p>

            <div className="mt-5 flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-black/20 px-4 py-3">
              <div>
                <p className="text-[10px] uppercase tracking-[0.22em] text-[#ffcfbf]/65">
                  Risk level
                </p>
                <p className="mt-1 text-sm font-medium text-[#fff1ec]">Moderate • recoverable</p>
              </div>
              <span className="h-2.5 w-2.5 rounded-full bg-[#ffcc70] shadow-[0_0_18px_rgba(255,204,112,0.8)]" />
            </div>

            <Button
              variant="outline"
              className="mt-5 w-full border-[#ffb3a7]/20 bg-white/[0.04] text-[#fff1ed] shadow-none transition-all duration-300 hover:border-[#ffb3a7]/40 hover:bg-[#ff8f7a]/10 hover:text-white"
              onClick={onClearApiKeys}
              disabled={isResetting || !isAdmin}
            >
              <Key className="mr-2 h-4 w-4" />
              {t('settings.clearApiKeys')}
              {!isAdmin && <LockIcon className="ml-2 h-3.5 w-3.5" />}
            </Button>
          </div>

          <div className="group relative overflow-hidden rounded-[1.75rem] border border-[#ff7d7d]/20 bg-[linear-gradient(180deg,rgba(255,107,107,0.06),rgba(255,255,255,0.015))] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] transition-transform duration-300 hover:-translate-y-0.5 sm:p-6">
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#ff6b6b]/70 to-transparent" />
            <div className="flex items-start justify-between gap-4">
              <div className="flex min-w-0 items-start gap-3">
                <div className="mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-[#ffb0b0]/15 bg-[#ff6b6b]/10">
                  <Trash2 className="h-4 w-4 text-[#ffd4d4]" />
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] uppercase tracking-[0.26em] text-[#ffb3b3]/75">
                    Full reset
                  </p>
                  <h3 className="mt-2 text-lg font-bold text-[#fff5f2]">
                    {t('settings.resetDatabase')}
                  </h3>
                </div>
              </div>
              {!isAdmin && (
                <div className="rounded-full border border-white/10 bg-white/5 p-2">
                  <LockIcon className="h-3.5 w-3.5 text-[#ffd0c5]" />
                </div>
              )}
            </div>

            <p className="mt-4 text-sm leading-6 text-[#f0c2bc]">
              {t('settings.resetDatabaseDescription')}
            </p>

            <div className="mt-5 flex items-center justify-between gap-3 rounded-2xl border border-[#ff8b8b]/15 bg-black/20 px-4 py-3">
              <div>
                <p className="text-[10px] uppercase tracking-[0.22em] text-[#ffcfbf]/65">
                  Risk level
                </p>
                <p className="mt-1 text-sm font-medium text-[#fff1ec]">Severe • destructive</p>
              </div>
              <span className="h-2.5 w-2.5 rounded-full bg-[#ff6b6b] shadow-[0_0_18px_rgba(255,107,107,0.85)]" />
            </div>

            <Button
              variant="destructive"
              className="mt-5 w-full border border-[#ff8f8f]/20 bg-[linear-gradient(135deg,#ff5f5f,#ff7d66)] font-bold text-white shadow-[0_14px_30px_rgba(255,95,95,0.28)] transition-all duration-300 hover:translate-y-[-1px] hover:shadow-[0_18px_36px_rgba(255,95,95,0.34)]"
              onClick={onResetDatabase}
              disabled={isResetting || !isAdmin}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              {t('settings.resetDatabase')}
              {!isAdmin && <LockIcon className="ml-2 h-3.5 w-3.5" />}
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
