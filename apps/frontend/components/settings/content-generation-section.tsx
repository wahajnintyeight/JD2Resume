'use client';

import React from 'react';
import { Settings2, Sparkles, FileText, Send, Wand2 } from 'lucide-react';
import { ToggleSwitch } from '@/components/ui/toggle-switch';
import { Dropdown } from '@/components/ui/dropdown';
import type { PromptOption } from '@/lib/api/config';

interface ContentGenerationSectionProps {
  enableCoverLetter: boolean;
  enableOutreach: boolean;
  featureConfigLoading: boolean;
  promptConfigLoading: boolean;
  localizedPromptOptions: PromptOption[];
  defaultPromptId: string;
  onFeatureConfigChange: (
    key: 'enable_cover_letter' | 'enable_outreach_message',
    value: boolean
  ) => void;
  onPromptConfigChange: (value: string) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
}

export function ContentGenerationSection({
  enableCoverLetter,
  enableOutreach,
  featureConfigLoading,
  promptConfigLoading,
  localizedPromptOptions,
  defaultPromptId,
  onFeatureConfigChange,
  onPromptConfigChange,
  t,
}: ContentGenerationSectionProps) {
  const shellClass =
    'min-w-0 rounded-[1.25rem] border border-white/10 bg-slate-950/40 p-4 sm:rounded-2xl sm:p-5';

  return (
    <section className="relative overflow-hidden rounded-[1.5rem] border border-white/10 bg-[#09090f] text-white shadow-2xl shadow-black/30 sm:rounded-[2rem]">
      <div className="absolute inset-0 bg-gradient-to-b from-[#111322] via-[#09090f] to-[#07070b]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(139,92,246,0.24),_transparent_36%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_78%_20%,_rgba(56,189,248,0.12),_transparent_24%)]" />
      <div
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage:
            'linear-gradient(rgba(148,163,184,0.16) 1px, transparent 1px), linear-gradient(90deg, rgba(148,163,184,0.16) 1px, transparent 1px)',
          backgroundSize: '72px 72px',
        }}
      />
      <div className="absolute right-4 top-8 h-28 w-28 rounded-full bg-violet-500/15 blur-3xl sm:right-10 sm:top-12 sm:h-44 sm:w-44" />

      <div className="relative px-4 py-6 sm:px-8 sm:py-8 lg:px-12 lg:py-10">
        <div className="grid gap-6 sm:gap-8 xl:grid-cols-[minmax(0,1.2fr)_360px] xl:items-start">
          <div>
            <div className="mb-5 inline-flex max-w-full items-center gap-2 self-start whitespace-normal break-words rounded-full border border-violet-400/25 bg-violet-400/10 px-3 py-2 text-[10px] font-medium uppercase tracking-[0.14em] text-violet-200 sm:mb-6 sm:px-4 sm:text-xs sm:tracking-[0.24em]">
              <Sparkles className="h-3.5 w-3.5" />
              content generation
            </div>

            <h2 className="max-w-4xl text-3xl font-black uppercase leading-[0.95] tracking-[-0.04em] text-white sm:text-5xl sm:leading-[0.92] sm:tracking-[-0.05em] lg:text-6xl">
              <span className="block">{t('settings.contentGeneration.title')}</span>
              <span className="block bg-gradient-to-r from-violet-200 via-fuchsia-300 to-cyan-300 bg-clip-text text-transparent">
                Writing Systems
              </span>
            </h2>

            <p className="mt-5 max-w-3xl text-sm leading-6 text-slate-300 sm:mt-6 sm:text-lg sm:leading-7">
              Control how cover letters, outreach messages, and default prompt behavior fit into
              your workflow without breaking the visual rhythm of the rest of settings.
            </p>

            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              <div className="min-w-0 rounded-[1.25rem] border border-white/10 bg-slate-950/40 p-4 sm:rounded-2xl">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Cover letter</p>
                <p className="mt-2 text-sm font-semibold text-white">
                  {enableCoverLetter ? 'Enabled' : 'Disabled'}
                </p>
                <p className="mt-1 text-sm text-slate-400">
                  Generate a full supporting letter alongside resume tailoring.
                </p>
              </div>
              <div className="min-w-0 rounded-[1.25rem] border border-white/10 bg-slate-950/40 p-4 sm:rounded-2xl">
                <p className="text-[11px] uppercase tracking-[0.16em] text-slate-400 sm:text-xs sm:tracking-[0.2em]">
                  Outreach
                </p>
                <p className="mt-2 text-sm font-semibold text-white">
                  {enableOutreach ? 'Enabled' : 'Disabled'}
                </p>
                <p className="mt-1 text-sm text-slate-400">
                  Produce short outreach copy for recruiter or hiring manager follow-up.
                </p>
              </div>
              <div className="min-w-0 rounded-[1.25rem] border border-white/10 bg-slate-950/40 p-4 sm:rounded-2xl">
                <p className="text-[11px] uppercase tracking-[0.16em] text-slate-400 sm:text-xs sm:tracking-[0.2em]">
                  Prompt preset
                </p>
                <p className="mt-2 text-sm font-semibold text-white">
                  {localizedPromptOptions.find((option) => option.id === defaultPromptId)?.label ||
                    'Default'}
                </p>
                <p className="mt-1 text-sm text-slate-400">
                  Choose the writing behavior used as the default generation baseline.
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-[2rem] border border-white/10 bg-slate-950/40 p-4 sm:p-6">
            <div className="flex flex-col gap-3 border-b border-white/10 pb-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-semibold text-white">Generation posture</p>
                <p className="mt-1 text-xs uppercase tracking-[0.22em] text-slate-400">
                  active writing stack
                </p>
              </div>
              <div className="flex gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-rose-400/80" />
                <span className="h-2.5 w-2.5 rounded-full bg-amber-300/80" />
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-400/80" />
              </div>
            </div>

            <div className="space-y-4 pt-6">
              <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
                <div className="flex items-start gap-3">
                  <div className="rounded-xl border border-white/10 bg-white/5 p-2">
                    <FileText className="h-4 w-4 text-violet-200" />
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                      Cover letters
                    </p>
                    <p className="mt-2 text-sm font-semibold text-white">
                      {enableCoverLetter ? 'Ready to generate' : 'Turned off'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
                <div className="flex items-start gap-3">
                  <div className="rounded-xl border border-white/10 bg-white/5 p-2">
                    <Send className="h-4 w-4 text-cyan-200" />
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Outreach</p>
                    <p className="mt-2 text-sm font-semibold text-white">
                      {enableOutreach ? 'Short-form messaging enabled' : 'Short-form messaging paused'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-slate-950/50 p-5">
                <div className="flex items-start gap-3">
                  <div className="rounded-xl border border-white/10 bg-white/5 p-2">
                    <Wand2 className="h-4 w-4 text-fuchsia-200" />
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                      Default prompt
                    </p>
                    <p className="mt-2 text-sm leading-6 text-slate-200">
                      {localizedPromptOptions.find((option) => option.id === defaultPromptId)?.label ||
                        t('settings.promptSettings.title')}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>


        <div className="mt-8 grid gap-6 sm:mt-10 xl:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)]">
          <div className="space-y-6">
            <div className={shellClass}>
              <div className="mb-4 flex items-center gap-3">
                <Settings2 className="h-4 w-4 text-violet-300" />
                <p className="text-xs font-medium uppercase tracking-[0.2em] text-slate-400">
                  Feature controls
                </p>
              </div>

              <div className="space-y-4">
                <div className="min-w-0 overflow-hidden rounded-2xl border border-white/10 bg-slate-950/40 p-4">
                  <ToggleSwitch
                    checked={enableCoverLetter}
                    onCheckedChange={(checked) =>
                      onFeatureConfigChange('enable_cover_letter', checked)
                    }
                    label={t('settings.contentGeneration.coverLetter.label')}
                    description={t('settings.contentGeneration.coverLetter.description')}
                    disabled={featureConfigLoading}
                  />
                </div>

                <div className="min-w-0 overflow-hidden rounded-2xl border border-white/10 bg-slate-950/40 p-4">
                  <ToggleSwitch
                    checked={enableOutreach}
                    onCheckedChange={(checked) =>
                      onFeatureConfigChange('enable_outreach_message', checked)
                    }
                    label={t('settings.contentGeneration.outreachMessage.label')}
                    description={t('settings.contentGeneration.outreachMessage.description')}
                    disabled={featureConfigLoading}
                  />
                </div>
              </div>
            </div>

            <div className={shellClass}>
              <p className="text-xs font-medium uppercase tracking-[0.2em] text-slate-400">
                Prompt system
              </p>
              <div className="mt-4 rounded-2xl border border-white/10 bg-slate-950/40 p-4">
                <Dropdown
                  options={localizedPromptOptions}
                  value={defaultPromptId}
                  onChange={onPromptConfigChange}
                  label={t('settings.promptSettings.title')}
                  description={t('settings.promptSettings.description')}
                  disabled={promptConfigLoading}
                />
              </div>
            </div>
          </div>

          <div className="min-w-0 rounded-[1.5rem] border border-white/10 bg-slate-950/40 p-4 sm:rounded-[2rem] sm:p-6">
            <div className="flex items-center gap-3">
              <Wand2 className="h-4 w-4 text-slate-300" />
              <p className="text-xs font-medium uppercase tracking-[0.2em] text-slate-400">
                Output profile
              </p>
            </div>

            <div className="mt-5 grid gap-4">
              <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Letter mode</p>
                <p className="mt-2 text-sm font-semibold text-white">
                  {enableCoverLetter ? 'Included in generation flow' : 'Excluded from generation flow'}
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Message mode</p>
                <p className="mt-2 text-sm font-semibold text-white">
                  {enableOutreach ? 'Outreach content available' : 'Outreach content disabled'}
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-slate-950/50 p-5">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Editorial note</p>
                <p className="mt-3 text-sm leading-6 text-slate-200">
                  These controls shape which supporting assets get produced and which prompt profile
                  acts as the default voice for generation.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
