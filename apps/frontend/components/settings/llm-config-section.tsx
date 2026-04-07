'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SearchableDropdown } from '@/components/ui/searchable-dropdown';
import {
  Save,
  Loader2,
  CheckCircle2,
  XCircle,
  Activity,
  Sparkles,
  Orbit,
  ShieldCheck,
} from 'lucide-react';
import {
  PROVIDER_INFO,
  type LLMProvider,
  type LLMHealthCheck,
  type OpenRouterModel,
} from '@/lib/api/config';

type Status = 'idle' | 'saving' | 'saved' | 'error' | 'testing';

const PROVIDERS: LLMProvider[] = [
  'openai',
  'anthropic',
  'openrouter',
  'gemini',
  'deepseek',
  'ollama',
];

interface LLMConfigSectionProps {
  provider: LLMProvider;
  llmConfigMode: 'preset' | 'custom';
  model: string;
  apiKey: string;
  apiBase: string;
  hasStoredApiKey: boolean;
  openRouterModels: OpenRouterModel[];
  openRouterModelsLoading: boolean;
  openRouterModelsError: string | null;
  showFreeModelsOnly: boolean;
  status: Status;
  error: string | null;
  healthCheck: LLMHealthCheck | null;
  isAdmin: boolean;
  onProviderChange: (provider: LLMProvider) => void;
  onModeChange: (mode: 'preset' | 'custom') => void;
  onModelChange: (model: string) => void;
  onApiKeyChange: (key: string) => void;
  onApiBaseChange: (base: string) => void;
  onShowFreeModelsChange: (show: boolean) => void;
  onSave: () => void;
  onTest: () => void;
  t: (key: string, params?: Record<string, string | number>) => string;
  healthCheckError: string | null;
  healthCheckWarning: string | null;
  healthDetailItems: Array<{ key: string; label: string; value: string | null }>;
}

export function LLMConfigSection({
  provider,
  llmConfigMode,
  model,
  apiKey,
  apiBase,
  hasStoredApiKey,
  openRouterModels,
  openRouterModelsLoading,
  openRouterModelsError,
  showFreeModelsOnly,
  status,
  error,
  healthCheck,
  isAdmin,
  onProviderChange,
  onModeChange,
  onModelChange,
  onApiKeyChange,
  onApiBaseChange,
  onShowFreeModelsChange,
  onSave,
  onTest,
  t,
  healthCheckError,
  healthCheckWarning,
  healthDetailItems,
}: LLMConfigSectionProps) {
  const providerInfo = PROVIDER_INFO[provider] ?? PROVIDER_INFO.openai;
  const requiresApiKey = providerInfo.requiresKey ?? true;

  const fieldLabelClass = 'block text-xs font-medium uppercase tracking-[0.2em] text-slate-400';
  const fieldShellClass = 'rounded-2xl border border-white/10 bg-slate-950/40 p-5';
  const inputClass =
    'mt-4 h-14 rounded-2xl border-white/10 bg-slate-950/40 px-4 text-sm font-medium text-white placeholder:text-slate-500 focus-visible:border-violet-300/40 focus-visible:ring-violet-300/20';

  return (
    <section className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-[#09090f] text-white shadow-2xl shadow-black/30">
      <div className="absolute inset-0 bg-gradient-to-b from-[#111322] via-[#09090f] to-[#07070b]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(139,92,246,0.30),_transparent_38%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,_rgba(56,189,248,0.16),_transparent_24%)]" />
      <div
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage:
            'linear-gradient(rgba(148,163,184,0.16) 1px, transparent 1px), linear-gradient(90deg, rgba(148,163,184,0.16) 1px, transparent 1px)',
          backgroundSize: '72px 72px',
        }}
      />
      <div className="absolute left-1/2 top-20 h-56 w-56 -translate-x-1/2 rounded-full bg-violet-500/20 blur-3xl" />

      <div className="relative px-6 py-8 sm:px-8 lg:px-12 lg:py-10">
        <div className="grid gap-8 xl:grid-cols-[minmax(0,1.2fr)_360px] xl:items-start">
          <div>
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-violet-400/25 bg-violet-400/10 px-4 py-2 text-xs font-medium uppercase tracking-[0.24em] text-violet-200">
              <Sparkles className="h-3.5 w-3.5" />
              model orchestration
            </div>

            <h2 className="max-w-4xl text-4xl font-black uppercase leading-[0.92] tracking-[-0.05em] text-white sm:text-5xl lg:text-6xl">
              <span className="block">{t('settings.llmConfigurationTitle')}</span>
              <span className="block bg-gradient-to-r from-violet-200 via-fuchsia-300 to-cyan-300 bg-clip-text text-transparent">
                {providerInfo.name}
              </span>
            </h2>

            <p className="mt-6 max-w-3xl text-base leading-7 text-slate-300 sm:text-lg">
              Tune provider access, model routing, and connection settings with the same typography,
              spacing, and text colors used in the home hero.
            </p>

            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Provider</p>
                <p className="mt-2 text-sm font-semibold text-white">{providerInfo.name}</p>
                <p className="mt-1 text-sm text-slate-400">
                  {llmConfigMode === 'preset'
                    ? 'Curated provider routing'
                    : 'Custom-compatible API'}
                </p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Auth mode</p>
                <p className="mt-2 text-sm font-semibold text-white">
                  {requiresApiKey ? 'API key required' : 'Optional credentials'}
                </p>
                <p className="mt-1 text-sm text-slate-400">
                  {requiresApiKey ? 'Secure external access' : 'Local-friendly setup'}
                </p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Connection</p>
                <p className="mt-2 text-sm font-semibold text-white">
                  {healthCheck
                    ? healthCheck.healthy
                      ? 'Healthy'
                      : 'Needs attention'
                    : 'Not tested'}
                </p>
                <p className="mt-1 text-sm text-slate-400">
                  Test the endpoint after updating your settings.
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-[2rem] border border-white/10 bg-slate-950/40 p-6">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div>
                <p className="text-sm font-semibold text-white">Connection posture</p>
                <p className="mt-1 text-xs uppercase tracking-[0.22em] text-slate-400">
                  live provider snapshot
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
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Active provider</p>
                <p className="mt-2 text-lg font-semibold text-white">{providerInfo.name}</p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
                <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Auth mode</p>
                  <p className="mt-2 text-sm font-semibold text-white">
                    {requiresApiKey ? 'API key required' : 'Optional credentials'}
                  </p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Config mode</p>
                  <p className="mt-2 text-sm font-semibold text-white">
                    {llmConfigMode === 'preset' ? 'Curated providers' : 'OpenAI compatible'}
                  </p>
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-slate-950/50 p-5">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Current model</p>
                <p className="mt-3 break-all text-sm leading-6 text-slate-200">
                  {model || providerInfo.defaultModel}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-10 grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)]">
          <div className="space-y-6">
            <div className={fieldShellClass}>
              <div className="mb-4 flex items-center gap-3">
                <Orbit className="h-4 w-4 text-violet-300" />
                <Label className={fieldLabelClass}>Configuration mode</Label>
              </div>

              <div className="inline-flex rounded-full border border-white/10 bg-slate-950/60 p-1">
                <button
                  type="button"
                  onClick={() => onModeChange('preset')}
                  disabled={!isAdmin}
                  className={`rounded-full px-5 py-2.5 text-xs font-semibold uppercase tracking-[0.22em] transition-all ${
                    llmConfigMode === 'preset'
                      ? 'bg-white text-slate-950'
                      : 'text-slate-300 hover:bg-white/5 hover:text-white'
                  } ${!isAdmin ? 'cursor-not-allowed opacity-50' : ''}`}
                >
                  Providers
                </button>
                <button
                  type="button"
                  onClick={() => onModeChange('custom')}
                  disabled={!isAdmin}
                  className={`rounded-full px-5 py-2.5 text-xs font-semibold uppercase tracking-[0.22em] transition-all ${
                    llmConfigMode === 'custom'
                      ? 'bg-white text-slate-950'
                      : 'text-slate-300 hover:bg-white/5 hover:text-white'
                  } ${!isAdmin ? 'cursor-not-allowed opacity-50' : ''}`}
                >
                  Custom
                </button>
              </div>
            </div>

            {llmConfigMode === 'preset' ? (
              <div className={fieldShellClass}>
                <Label className={fieldLabelClass}>{t('settings.providerLabel')}</Label>
                <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {PROVIDERS.map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => onProviderChange(p)}
                      disabled={!isAdmin}
                      className={`rounded-2xl border px-4 py-4 text-left transition-all ${
                        provider === p
                          ? 'border-violet-300/40 bg-violet-300/10 text-white'
                          : 'border-white/10 bg-slate-950/40 text-slate-300 hover:-translate-y-0.5 hover:border-violet-300/25 hover:text-white'
                      } ${!isAdmin ? 'cursor-not-allowed opacity-50' : ''}`}
                    >
                      <p className="text-xs uppercase tracking-[0.22em] text-slate-400">Provider</p>
                      <p className="mt-2 text-sm font-semibold">{PROVIDER_INFO[p].name}</p>
                    </button>
                  ))}
                </div>

                <div className="mt-4 rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-3">
                  <p className="text-sm text-slate-300">
                    {t('settings.llmConfiguration.selectedProvider', {
                      provider: providerInfo.name,
                    })}
                  </p>
                </div>
              </div>
            ) : (
              <div className={fieldShellClass}>
                <Label className={fieldLabelClass}>{t('settings.providerLabel')}</Label>
                <div className="mt-4 rounded-2xl border border-white/10 bg-slate-950/40 p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                    Compatibility layer
                  </p>
                  <p className="mt-2 text-base font-semibold text-white">OpenAI compatible</p>
                  <p className="mt-2 text-sm leading-6 text-slate-300">
                    Bring your own endpoint and route requests through a custom-compatible API.
                  </p>
                </div>
              </div>
            )}

            <div className={fieldShellClass}>
              {provider === 'openrouter' ? (
                <>
                  <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <Label className={fieldLabelClass}>
                      {t('settings.llmConfiguration.modelLabel')}
                    </Label>

                    <label className="inline-flex items-center gap-3 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-medium uppercase tracking-[0.2em] text-slate-200">
                      <input
                        type="checkbox"
                        checked={showFreeModelsOnly}
                        onChange={(e) => onShowFreeModelsChange(e.target.checked)}
                        className="h-4 w-4 rounded border-white/20 bg-slate-950 text-violet-300 focus:ring-violet-300/30"
                      />
                      Free models only
                    </label>
                  </div>

                  <SearchableDropdown
                    options={openRouterModels
                      .filter(
                        (m) =>
                          !showFreeModelsOnly ||
                          m.id.includes(':free') ||
                          m.name?.toLowerCase().includes('(free)')
                      )
                      .map((m) => ({
                        id: m.id,
                        label: m.name || m.id,
                        description: m.description || undefined,
                        contextLength: m.context_length,
                        maxCompletionTokens: m.max_completion_tokens,
                      }))}
                    value={model}
                    onChange={onModelChange}
                    placeholder={providerInfo.defaultModel}
                    loading={openRouterModelsLoading}
                    loadingText={t('settings.llmConfiguration.loadingModels')}
                    emptyText={
                      openRouterModelsError || t('settings.llmConfiguration.noModelsFound')
                    }
                    allowFreeform={true}
                    pageSize={15}
                  />

                  {openRouterModelsError && (
                    <p className="mt-3 text-sm text-rose-300">{openRouterModelsError}</p>
                  )}
                </>
              ) : (
                <>
                  <Label htmlFor="model" className={fieldLabelClass}>
                    {t('settings.llmConfiguration.modelLabel')}
                  </Label>
                  <Input
                    id="model"
                    value={model}
                    onChange={(e) => onModelChange(e.target.value)}
                    placeholder={providerInfo.defaultModel}
                    className={inputClass}
                    disabled={!isAdmin}
                  />
                </>
              )}
            </div>

            <div className={fieldShellClass}>
              <Label htmlFor="apiKey" className={fieldLabelClass}>
                {t('settings.llmConfiguration.apiKeyLabel')}
                {!requiresApiKey && (
                  <span className="ml-2 normal-case tracking-normal text-slate-400">
                    {t('settings.llmConfiguration.apiKeyOptionalForOllama')}
                  </span>
                )}
              </Label>
              <Input
                id="apiKey"
                type="password"
                value={apiKey}
                onChange={(e) => onApiKeyChange(e.target.value)}
                placeholder={
                  requiresApiKey
                    ? t('settings.llmConfiguration.apiKeyPlaceholder')
                    : t('settings.llmConfiguration.apiKeyNotRequiredPlaceholder')
                }
                className={inputClass}
                disabled={!requiresApiKey || !isAdmin}
              />
              {requiresApiKey && hasStoredApiKey && !apiKey && (
                <p className="mt-3 text-sm leading-6 text-slate-400">
                  {t('settings.llmConfiguration.leaveBlankToKeepExistingKey')}
                </p>
              )}
            </div>

            <div className={fieldShellClass}>
              <Label htmlFor="apiBase" className={fieldLabelClass}>
                {t('settings.llmConfiguration.baseUrlLabel')}
              </Label>
              <Input
                id="apiBase"
                value={apiBase}
                onChange={(e) => onApiBaseChange(e.target.value)}
                placeholder={t('settings.llmConfiguration.baseUrlPlaceholder')}
                className={inputClass}
                disabled={!isAdmin}
              />
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-[2rem] border border-white/10 bg-slate-950/40 p-6">
              <div className="flex items-center gap-3">
                <ShieldCheck className="h-4 w-4 text-slate-300" />
                <p className="text-xs font-medium uppercase tracking-[0.2em] text-slate-400">
                  Actions
                </p>
              </div>

              <div className="mt-5 flex flex-col gap-4">
                <Button
                  onClick={onSave}
                  disabled={status === 'saving' || !isAdmin}
                  className="group h-14 rounded-full border border-white/10 bg-white text-sm font-semibold text-slate-950 transition-all duration-200 hover:-translate-y-0.5 hover:bg-violet-200 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {status === 'saving' ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : status === 'saved' ? (
                    <span className="flex items-center gap-2">
                      <CheckCircle2 className="h-5 w-5" />
                      {t('common.success')}
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <Save className="h-5 w-5" />
                      {t('common.save')}
                    </span>
                  )}
                </Button>

                <Button
                  variant="outline"
                  onClick={onTest}
                  disabled={status === 'testing' || status === 'saving' || !isAdmin}
                  className="h-14 rounded-full border border-white/15 bg-white/5 text-sm font-semibold text-slate-100 transition-all duration-200 hover:-translate-y-0.5 hover:border-violet-300/40 hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {status === 'testing' ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <span className="flex items-center gap-2">
                      <Activity className="h-5 w-5" />
                      {t('settings.llmConfiguration.testConnection')}
                    </span>
                  )}
                </Button>
              </div>

              <div className="mt-6 grid gap-3 sm:grid-cols-3 xl:grid-cols-1">
                <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Provider</p>
                  <p className="mt-2 text-sm font-semibold text-white">{providerInfo.name}</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Routing</p>
                  <p className="mt-2 text-sm font-semibold text-white">
                    {llmConfigMode === 'preset' ? 'Preset routing' : 'Custom endpoint'}
                  </p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Access</p>
                  <p className="mt-2 text-sm font-semibold text-white">
                    {requiresApiKey ? 'Secured auth' : 'Local-friendly'}
                  </p>
                </div>
              </div>
            </div>

            {error && (
              <div className="rounded-2xl border border-rose-400/25 bg-rose-400/10 p-5">
                <div className="flex items-start gap-3">
                  <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-rose-300" />
                  <p className="text-sm leading-6 text-rose-100">
                    {t('settings.llmConfiguration.errorPrefix', { error })}
                  </p>
                </div>
              </div>
            )}

            {healthCheck && (
              <div
                className={`rounded-[2rem] border p-6 ${
                  healthCheck.healthy
                    ? 'border-emerald-400/20 bg-emerald-400/10'
                    : 'border-rose-400/20 bg-rose-400/10'
                }`}
              >
                <div className="flex items-start gap-4">
                  <div
                    className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border ${
                      healthCheck.healthy
                        ? 'border-emerald-300/30 bg-emerald-300/10'
                        : 'border-rose-300/30 bg-rose-300/10'
                    }`}
                  >
                    {healthCheck.healthy ? (
                      <CheckCircle2 className="h-6 w-6 text-emerald-300" />
                    ) : (
                      <XCircle className="h-6 w-6 text-rose-300" />
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold uppercase tracking-[0.18em] text-white">
                      {healthCheck.healthy
                        ? t('settings.llmConfiguration.connectionSuccessful')
                        : t('settings.llmConfiguration.connectionFailed')}
                    </p>
                    <p className="mt-2 text-sm leading-6 text-slate-200">
                      {t('settings.llmConfiguration.connectionDetails', {
                        provider: healthCheck.provider,
                        model: healthCheck.model,
                      })}
                    </p>
                  </div>
                </div>

                {healthCheckError && (
                  <p className="mt-4 rounded-2xl border border-rose-300/20 bg-slate-950/40 p-4 text-sm leading-6 text-rose-100">
                    {healthCheckError}
                  </p>
                )}

                {healthCheckWarning && (
                  <p className="mt-4 rounded-2xl border border-amber-300/20 bg-slate-950/40 p-4 text-sm leading-6 text-amber-100">
                    {healthCheckWarning}
                  </p>
                )}

                {healthDetailItems.length > 0 && (
                  <div className="mt-5 space-y-4">
                    {healthDetailItems.map((item) => (
                      <div
                        key={item.key}
                        className="rounded-2xl border border-white/10 bg-slate-950/40 p-4"
                      >
                        <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                          {item.label}
                        </p>
                        <pre className="mt-3 whitespace-pre-wrap break-all text-sm leading-6 text-slate-200">
                          {item.value}
                        </pre>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
