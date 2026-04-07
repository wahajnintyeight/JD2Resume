'use client';

import React from 'react';
import { Globe, Languages, MonitorSmartphone, FileText, Sparkles } from 'lucide-react';
import type { SupportedLanguage } from '@/lib/api/config';
import type { Locale } from '@/i18n/config';

interface LanguageSettingsSectionProps {
  contentLanguage: SupportedLanguage;
  uiLanguage: Locale;
  supportedLanguages: readonly string[];
  languageNames: Record<string, string>;
  languageLoading: boolean;
  onContentLanguageChange: (lang: SupportedLanguage) => void;
  onUiLanguageChange: (lang: Locale) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
}

export function LanguageSettingsSection({
  contentLanguage,
  uiLanguage,
  supportedLanguages,
  languageNames,
  languageLoading,
  onContentLanguageChange,
  onUiLanguageChange,
  t,
}: LanguageSettingsSectionProps) {
  const shellClass = 'rounded-2xl border border-white/10 bg-slate-950/40 p-5';

  return (
    <section className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-[#09090f] text-white shadow-2xl shadow-black/30">
      <div className="absolute inset-0 bg-gradient-to-b from-[#111322] via-[#09090f] to-[#07070b]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(139,92,246,0.24),_transparent_36%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_82%_18%,_rgba(56,189,248,0.14),_transparent_24%)]" />
      <div
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage:
            'linear-gradient(rgba(148,163,184,0.16) 1px, transparent 1px), linear-gradient(90deg, rgba(148,163,184,0.16) 1px, transparent 1px)',
          backgroundSize: '72px 72px',
        }}
      />
      <div className="absolute left-10 top-14 h-44 w-44 rounded-full bg-cyan-500/10 blur-3xl" />

      <div className="relative px-6 py-8 sm:px-8 lg:px-12 lg:py-10">
        <div className="grid gap-8 xl:grid-cols-[minmax(0,1.2fr)_360px] xl:items-start">
          <div>
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-violet-400/25 bg-violet-400/10 px-4 py-2 text-xs font-medium uppercase tracking-[0.24em] text-violet-200">
              <Sparkles className="h-3.5 w-3.5" />
              language preferences
            </div>

            <h2 className="max-w-4xl text-4xl font-black uppercase leading-[0.92] tracking-[-0.05em] text-white sm:text-5xl lg:text-6xl">
              <span className="block">{t('settings.uiLanguage')}</span>
              <span className="block bg-gradient-to-r from-violet-200 via-fuchsia-300 to-cyan-300 bg-clip-text text-transparent">
                {t('settings.contentLanguage')}
              </span>
            </h2>

            <p className="mt-6 max-w-3xl text-base leading-7 text-slate-300 sm:text-lg">
              Set how the interface reads and how generated content is written, using the same
              polished card language and atmospheric styling as the updated model settings.
            </p>

            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">UI language</p>
                <p className="mt-2 text-sm font-semibold text-white">
                  {languageNames[uiLanguage] ?? uiLanguage}
                </p>
                <p className="mt-1 text-sm text-slate-400">
                  Controls labels, navigation, and the application interface.
                </p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                  Content language
                </p>
                <p className="mt-2 text-sm font-semibold text-white">
                  {languageNames[contentLanguage] ?? contentLanguage}
                </p>
                <p className="mt-1 text-sm text-slate-400">
                  Shapes generated resume text and other writing outputs.
                </p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Status</p>
                <p className="mt-2 text-sm font-semibold text-white">
                  {languageLoading ? 'Updating preferences' : 'Ready'}
                </p>
                <p className="mt-1 text-sm text-slate-400">
                  Switch between languages without leaving the settings flow.
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-[2rem] border border-white/10 bg-slate-950/40 p-6">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div>
                <p className="text-sm font-semibold text-white">Locale snapshot</p>
                <p className="mt-1 text-xs uppercase tracking-[0.22em] text-slate-400">
                  active experience profile
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
                    <MonitorSmartphone className="h-4 w-4 text-violet-200" />
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Interface</p>
                    <p className="mt-2 text-sm font-semibold text-white">
                      {languageNames[uiLanguage] ?? uiLanguage}
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
                <div className="flex items-start gap-3">
                  <div className="rounded-xl border border-white/10 bg-white/5 p-2">
                    <FileText className="h-4 w-4 text-cyan-200" />
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                      Generated copy
                    </p>
                    <p className="mt-2 text-sm font-semibold text-white">
                      {languageNames[contentLanguage] ?? contentLanguage}
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-slate-950/50 p-5">
                <div className="flex items-start gap-3">
                  <div className="rounded-xl border border-white/10 bg-white/5 p-2">
                    <Languages className="h-4 w-4 text-fuchsia-200" />
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                      Available locales
                    </p>
                    <p className="mt-2 text-sm leading-6 text-slate-200">
                      {supportedLanguages.length} language options available across UI and content.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-10 grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)]">
          <div className="space-y-6">
            <div className={shellClass}>
              <div className="mb-4 flex items-center gap-3">
                <Globe className="h-4 w-4 text-violet-300" />
                <p className="text-xs font-medium uppercase tracking-[0.2em] text-slate-400">
                  Interface language
                </p>
              </div>

              <p className="mb-4 text-sm leading-6 text-slate-300">
                {t('settings.uiLanguageDescription')}
              </p>

              <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                {supportedLanguages.map((lang) => (
                  <button
                    key={`ui-${lang}`}
                    type="button"
                    onClick={() => onUiLanguageChange(lang as Locale)}
                    disabled={languageLoading}
                    className={`rounded-2xl border px-4 py-4 text-left transition-all ${
                      uiLanguage === lang
                        ? 'border-violet-300/40 bg-violet-300/10 text-white'
                        : 'border-white/10 bg-slate-950/40 text-slate-300 hover:-translate-y-0.5 hover:border-violet-300/25 hover:text-white'
                    } ${languageLoading ? 'cursor-not-allowed opacity-60' : ''}`}
                  >
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-400">UI</p>
                    <p className="mt-2 text-sm font-semibold">{languageNames[lang] ?? lang}</p>
                  </button>
                ))}
              </div>
            </div>

            <div className={shellClass}>
              <div className="mb-4 flex items-center gap-3">
                <Languages className="h-4 w-4 text-cyan-300" />
                <p className="text-xs font-medium uppercase tracking-[0.2em] text-slate-400">
                  Content language
                </p>
              </div>

              <p className="mb-4 text-sm leading-6 text-slate-300">
                {t('settings.contentLanguageDescription')}
              </p>

              <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                {supportedLanguages.map((lang) => (
                  <button
                    key={`content-${lang}`}
                    type="button"
                    onClick={() => onContentLanguageChange(lang as SupportedLanguage)}
                    disabled={languageLoading}
                    className={`rounded-2xl border px-4 py-4 text-left transition-all ${
                      contentLanguage === lang
                        ? 'border-cyan-300/40 bg-cyan-300/10 text-white'
                        : 'border-white/10 bg-slate-950/40 text-slate-300 hover:-translate-y-0.5 hover:border-cyan-300/25 hover:text-white'
                    } ${languageLoading ? 'cursor-not-allowed opacity-60' : ''}`}
                  >
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Content</p>
                    <p className="mt-2 text-sm font-semibold">{languageNames[lang] ?? lang}</p>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="rounded-[2rem] border border-white/10 bg-slate-950/40 p-6">
            <div className="flex items-center gap-3">
              <Languages className="h-4 w-4 text-slate-300" />
              <p className="text-xs font-medium uppercase tracking-[0.2em] text-slate-400">
                Selection summary
              </p>
            </div>

            <div className="mt-5 grid gap-4">
              <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">App experience</p>
                <p className="mt-2 text-sm font-semibold text-white">
                  {languageNames[uiLanguage] ?? uiLanguage}
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Writing output</p>
                <p className="mt-2 text-sm font-semibold text-white">
                  {languageNames[contentLanguage] ?? contentLanguage}
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-slate-950/50 p-5">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Preference note</p>
                <p className="mt-3 text-sm leading-6 text-slate-200">
                  UI and generated content can be tuned independently, letting you navigate in one
                  language while producing resumes and related writing in another.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
