'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  fetchLlmConfig,
  updateLlmConfig,
  testLlmConnection,
  fetchFeatureConfig,
  updateFeatureConfig,
  fetchPromptConfig,
  updatePromptConfig,
  clearAllApiKeys,
  resetDatabase,
  fetchOpenRouterModels,
  fetchApiKey,
  PROVIDER_INFO,
  type LLMConfig,
  type LLMProvider,
  type LLMHealthCheck,
  type PromptOption,
  type OpenRouterModel,
} from '@/lib/api/config';
import { API_URL } from '@/lib/api/client';
import { getVersionString } from '@/lib/config/version';
import { ToggleSwitch } from '@/components/ui/toggle-switch';
import { useStatusCache } from '@/lib/context/status-cache';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Dropdown } from '@/components/ui/dropdown';
import { SearchableDropdown } from '@/components/ui/searchable-dropdown';
import {
  Save,
  Key,
  Database,
  Activity,
  Loader2,
  ArrowLeft,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Server,
  FileText,
  Briefcase,
  Sparkles,
  Clock,
  Settings2,
  Globe,
  Trash2,
  AlertTriangle,
} from 'lucide-react';
import { useLanguage } from '@/lib/context/language-context';
import { useTranslations } from '@/lib/i18n';
import type { SupportedLanguage } from '@/lib/api/config';
import type { Locale } from '@/i18n/config';

type Status = 'idle' | 'loading' | 'saving' | 'saved' | 'error' | 'testing';

const PROVIDERS: LLMProvider[] = [
  'openai',
  'anthropic',
  'openrouter',
  'gemini',
  'deepseek',
  'ollama',
];

const SEGMENTED_BUTTON_BASE =
  'rounded-full border border-white/10 bg-white/5 font-mono tracking-widest transition-all duration-200 hover:bg-white/10 hover:border-white/20 hover:text-white disabled:cursor-not-allowed disabled:opacity-50';
const SEGMENTED_BUTTON_ACTIVE =
  'bg-indigo-600 text-white border-indigo-400/30 shadow-lg shadow-indigo-500/20';
const SEGMENTED_BUTTON_INACTIVE = 'text-white/60';

const unwrapCodeBlock = (value?: string | null): string | null => {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  const fenced = trimmed.match(/^```[a-zA-Z0-9_-]*\n([\s\S]*?)\n```\s*$/);
  if (fenced) {
    return fenced[1]?.trimEnd() || null;
  }
  return trimmed;
};

const getHealthCheckMessage = (
  t: (key: string, params?: Record<string, string | number>) => string,
  baseKey: string,
  code?: string,
  fallback?: string
): string | null => {
  if (code) {
    const key = `${baseKey}.${code}`;
    const localized = t(key);
    return localized !== key ? localized : (fallback ?? code);
  }
  return fallback ?? null;
};

export default function SettingsPage() {
  const [status, setStatus] = useState<Status>('loading');
  const [error, setError] = useState<string | null>(null);

  // LLM Config state
  const [provider, setProvider] = useState<LLMProvider>('openai');
  const [model, setModel] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [apiBase, setApiBase] = useState('');
  const [hasStoredApiKey, setHasStoredApiKey] = useState(false);

  // OpenRouter models state
  const [openRouterModels, setOpenRouterModels] = useState<OpenRouterModel[]>([]);
  const [openRouterModelsLoading, setOpenRouterModelsLoading] = useState(false);
  const [openRouterModelsError, setOpenRouterModelsError] = useState<string | null>(null);
  const [showFreeModelsOnly, setShowFreeModelsOnly] = useState(false);

  // Use cached system status (loaded on app start, refreshes every 30 min)
  const {
    status: systemStatus,
    isLoading: statusLoading,
    lastFetched,
    refreshStatus,
  } = useStatusCache();

  // Health check result from manual test
  const [healthCheck, setHealthCheck] = useState<LLMHealthCheck | null>(null);

  // Feature config state
  const [enableCoverLetter, setEnableCoverLetter] = useState(false);
  const [enableOutreach, setEnableOutreach] = useState(false);
  const [featureConfigLoading, setFeatureConfigLoading] = useState(false);
  const [promptConfigLoading, setPromptConfigLoading] = useState(false);
  const [promptOptions, setPromptOptions] = useState<PromptOption[]>([]);
  const [defaultPromptId, setDefaultPromptId] = useState('keywords');

  // Danger Zone state
  const [showClearApiKeysDialog, setShowClearApiKeysDialog] = useState(false);
  const [showResetDatabaseDialog, setShowResetDatabaseDialog] = useState(false);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [successMessage, setSuccessDialogMessage] = useState({ title: '', description: '' });
  const [isResetting, setIsResetting] = useState(false);

  // Language settings
  const {
    contentLanguage,
    uiLanguage,
    setContentLanguage,
    setUiLanguage,
    languageNames,
    supportedLanguages,
    isLoading: languageLoading,
  } = useLanguage();

  // Translations
  const { t } = useTranslations();
  const providerInfo = PROVIDER_INFO[provider] ?? PROVIDER_INFO['openai'];
  const fallbackPromptOptions = useMemo<PromptOption[]>(
    () => [
      {
        id: 'nudge',
        label: t('tailor.promptOptions.nudge.label'),
        description: t('tailor.promptOptions.nudge.description'),
      },
      {
        id: 'keywords',
        label: t('tailor.promptOptions.keywords.label'),
        description: t('tailor.promptOptions.keywords.description'),
      },
      {
        id: 'full',
        label: t('tailor.promptOptions.full.label'),
        description: t('tailor.promptOptions.full.description'),
      },
    ],
    [t]
  );
  const promptOptionOverrides = useMemo<Record<string, { label: string; description: string }>>(
    () => ({
      nudge: {
        label: t('tailor.promptOptions.nudge.label'),
        description: t('tailor.promptOptions.nudge.description'),
      },
      keywords: {
        label: t('tailor.promptOptions.keywords.label'),
        description: t('tailor.promptOptions.keywords.description'),
      },
      full: {
        label: t('tailor.promptOptions.full.label'),
        description: t('tailor.promptOptions.full.description'),
      },
    }),
    [t]
  );
  const localizedPromptOptions = useMemo(() => {
    const options = promptOptions.length ? promptOptions : fallbackPromptOptions;
    return options.map((option) => {
      const override = promptOptionOverrides[option.id];
      return override ? { ...option, ...override } : option;
    });
  }, [promptOptions, fallbackPromptOptions, promptOptionOverrides]);
  const healthDetailItems = useMemo(() => {
    if (!healthCheck) return [];

    return [
      {
        key: 'testPrompt',
        label: t('settings.llmConfiguration.testPromptLabel'),
        value: unwrapCodeBlock(healthCheck.test_prompt),
      },
      {
        key: 'modelOutput',
        label: t('settings.llmConfiguration.modelOutputLabel'),
        value: unwrapCodeBlock(healthCheck.model_output),
      },
      {
        key: 'errorDetail',
        label: t('settings.llmConfiguration.errorDetailLabel'),
        value: unwrapCodeBlock(healthCheck.error_detail),
      },
    ].filter((item) => item.value);
  }, [healthCheck, t]);
  const healthCheckError = useMemo(() => {
    if (!healthCheck) return null;
    return getHealthCheckMessage(
      t,
      'settings.llmConfiguration.healthErrors',
      healthCheck.error_code,
      healthCheck.error
    );
  }, [healthCheck, t]);
  const healthCheckWarning = useMemo(() => {
    if (!healthCheck) return null;
    return getHealthCheckMessage(
      t,
      'settings.llmConfiguration.healthWarnings',
      healthCheck.warning_code,
      healthCheck.warning
    );
  }, [healthCheck, t]);

  // Load LLM config and feature config on mount
  useEffect(() => {
    let cancelled = false;

    async function loadConfig() {
      try {
        const [llmConfig, featureConfig, promptConfig] = await Promise.all([
          fetchLlmConfig().catch(() => null),
          fetchFeatureConfig().catch(() => null),
          fetchPromptConfig().catch(() => null),
        ]);

        if (cancelled) return;

        if (llmConfig) {
          const providerFromBackend = llmConfig.provider || 'openai';
          const safeProvider = PROVIDERS.includes(providerFromBackend as LLMProvider)
            ? (providerFromBackend as LLMProvider)
            : 'openai';
          setProvider(safeProvider);
          setModel(llmConfig.model || PROVIDER_INFO[safeProvider].defaultModel);
          const isMaskedKey = Boolean(llmConfig.api_key) && llmConfig.api_key.includes('*');
          setHasStoredApiKey(Boolean(llmConfig.api_key));
          setApiKey(isMaskedKey ? '' : llmConfig.api_key || '');
          setApiBase(llmConfig.api_base || '');

          // If provider is openrouter and we have a stored key (masked), fetch the full key
          if (safeProvider === 'openrouter' && isMaskedKey) {
            setIsLoadingApiKey(true);
            try {
              const storedKey = await fetchApiKey('openrouter');
              if (storedKey && !cancelled) {
                setApiKey(storedKey);
                setHasStoredApiKey(true);
              }
            } catch {
              // Failed to fetch key, will leave empty for user to enter
            } finally {
              if (!cancelled) {
                setIsLoadingApiKey(false);
              }
            }
          }

          if (providerFromBackend !== safeProvider) {
            setError(t('settings.errors.unknownProvider', { provider: providerFromBackend }));
          }
        }

        if (featureConfig) {
          setEnableCoverLetter(featureConfig.enable_cover_letter);
          setEnableOutreach(featureConfig.enable_outreach_message);
        }

        if (promptConfig) {
          setPromptOptions(promptConfig.prompt_options || []);
          setDefaultPromptId(promptConfig.default_prompt_id || 'keywords');
        }

        setStatus('idle');
      } catch (err) {
        console.error('Failed to load settings', err);
        if (!cancelled) {
          setError(t('settings.errors.unableToConnectBackend'));
          setStatus('error');
        }
      }
    }

    loadConfig();
    return () => {
      cancelled = true;
    };
  }, [t]);

  // Handle provider change
  const handleProviderChange = async (newProvider: LLMProvider) => {
    setProvider(newProvider);
    setModel(PROVIDER_INFO[newProvider].defaultModel);

    if (newProvider === 'ollama' && !apiBase.trim()) {
      setApiBase('http://localhost:11434');
    }

    // Clear OpenRouter models when switching away from openrouter
    if (newProvider !== 'openrouter') {
      setOpenRouterModels([]);
      setOpenRouterModelsError(null);
      setApiKey('');
      setHasStoredApiKey(false);
    } else {
      // For OpenRouter, try to fetch the stored API key
      setIsLoadingApiKey(true);
      try {
        const storedKey = await fetchApiKey('openrouter');
        if (storedKey) {
          setApiKey(storedKey);
          setHasStoredApiKey(true);
        } else {
          setApiKey('');
          setHasStoredApiKey(false);
        }
      } catch {
        setApiKey('');
        setHasStoredApiKey(false);
      } finally {
        setIsLoadingApiKey(false);
      }
    }
  };

  // Debounced function to fetch OpenRouter models
  const fetchModelsWithKey = useCallback(
    async (key: string, useStoredKey: boolean, cancelledRef: { current: boolean }) => {
      // Only fetch if we have a key value OR we're using stored key
      if (!key.trim() && !useStoredKey) return;

      setOpenRouterModelsLoading(true);
      setOpenRouterModelsError(null);

      try {
        // If key is provided, use it. Otherwise call without key to use stored key
        const response = await fetchOpenRouterModels(key.trim() || undefined);
        if (!cancelledRef.current) {
          setOpenRouterModels(response.models);
        }
      } catch (err) {
        if (!cancelledRef.current) {
          console.error('Failed to fetch OpenRouter models:', err);
          setOpenRouterModelsError(
            err instanceof Error ? err.message : 'Failed to load models'
          );
        }
      } finally {
        if (!cancelledRef.current) {
          setOpenRouterModelsLoading(false);
        }
      }
    },
    []
  );

  // Track if we're currently fetching the API key
  const [isLoadingApiKey, setIsLoadingApiKey] = useState(false);

  // Fetch OpenRouter models when provider is openrouter or API key changes
  useEffect(() => {
    if (provider !== 'openrouter') return;
    // Wait until API key loading is complete
    if (isLoadingApiKey) return;

    const cancelledRef = { current: false };
    const timeoutId = setTimeout(() => {
      // If we have an API key value, use it. Otherwise if we know there's a stored key,
      // call without key to let backend use stored key
      if (apiKey.trim()) {
        fetchModelsWithKey(apiKey.trim(), false, cancelledRef);
      } else if (hasStoredApiKey) {
        fetchModelsWithKey('', true, cancelledRef);
      }
    }, 500); // Debounce for 500ms

    return () => {
      cancelledRef.current = true;
      clearTimeout(timeoutId);
    };
  }, [provider, apiKey, hasStoredApiKey, isLoadingApiKey, fetchModelsWithKey]);

  // Save configuration
  const handleSave = async () => {
    setStatus('saving');
    setError(null);
    setHealthCheck(null);

    try {
      if (requiresApiKey && !apiKey.trim() && !hasStoredApiKey) {
        setError(t('settings.errors.apiKeyRequired'));
        setStatus('error');
        return;
      }

      const trimmedKey = apiKey.trim();
      const config: Partial<LLMConfig> = {
        provider,
        model: model.trim(),
        api_base: apiBase.trim() || null,
      };
      if (requiresApiKey) {
        if (trimmedKey) {
          config.api_key = trimmedKey;
        } else if (!hasStoredApiKey) {
          config.api_key = '';
        }
      } else {
        config.api_key = '';
      }

      await updateLlmConfig(config);

      // Refresh cached system status after save
      await refreshStatus();

      setStatus('saved');
      setTimeout(() => setStatus('idle'), 2000);
    } catch (err) {
      console.error('Failed to save config', err);
      setError((err as Error).message || t('settings.errors.unableToSaveConfiguration'));
      setStatus('error');
    }
  };

  // Test connection with current form values (pre-save testing)
  const handleTestConnection = async () => {
    setStatus('testing');
    setError(null);
    setHealthCheck(null);

    try {
      // Build config from current form values
      const testConfig: Partial<LLMConfig> = {
        provider,
        model: model.trim() || providerInfo.defaultModel,
        api_base: apiBase.trim() || null,
      };

      // Only include API key if provided or if we have a stored key
      if (requiresApiKey) {
        if (apiKey.trim()) {
          testConfig.api_key = apiKey.trim();
        }
        // If no new key but has stored key, don't send api_key (backend uses stored)
      }

      const result = await testLlmConnection(testConfig);
      setHealthCheck(result);
      setStatus('idle');
    } catch (err) {
      console.error('Failed to test connection', err);
      setHealthCheck({ healthy: false, provider, model, error: (err as Error).message });
      setStatus('idle');
    }
  };

  // Update feature config
  const handleFeatureConfigChange = async (
    key: 'enable_cover_letter' | 'enable_outreach_message',
    value: boolean
  ) => {
    setFeatureConfigLoading(true);
    try {
      const updated = await updateFeatureConfig({ [key]: value });
      setEnableCoverLetter(updated.enable_cover_letter);
      setEnableOutreach(updated.enable_outreach_message);
    } catch (err) {
      console.error('Failed to update feature config', err);
      // Revert on error
      if (key === 'enable_cover_letter') {
        setEnableCoverLetter(!value);
      } else {
        setEnableOutreach(!value);
      }
    } finally {
      setFeatureConfigLoading(false);
    }
  };

  const handlePromptConfigChange = async (value: string) => {
    setPromptConfigLoading(true);
    setError(null);
    try {
      const updated = await updatePromptConfig({ default_prompt_id: value });
      setDefaultPromptId(updated.default_prompt_id);
      if (updated.prompt_options?.length) {
        setPromptOptions(updated.prompt_options);
      }
    } catch (err) {
      console.error('Failed to update prompt config', err);
      setError((err as Error).message || t('settings.errors.unableToSaveConfiguration'));
    } finally {
      setPromptConfigLoading(false);
    }
  };

  // Handle Clear API Keys
  const handleClearApiKeys = async () => {
    setIsResetting(true);
    try {
      await clearAllApiKeys();

      // Refetch full LLM config to ensure local state is synced with backend
      const llmConfig = await fetchLlmConfig().catch(() => null);
      if (llmConfig) {
        setProvider(llmConfig.provider || 'openai');
        setModel(llmConfig.model || PROVIDER_INFO['openai'].defaultModel);
        const isMaskedKey = Boolean(llmConfig.api_key) && llmConfig.api_key.includes('*');
        setHasStoredApiKey(Boolean(llmConfig.api_key));
        setApiKey(isMaskedKey ? '' : llmConfig.api_key || '');
        setApiBase(llmConfig.api_base || '');
      } else {
        // Fallback if refetch fails
        setApiKey('');
        setHasStoredApiKey(false);
      }

      setHealthCheck(null);
      // Refresh status
      await refreshStatus();
      setError(null);
      setSuccessDialogMessage({
        title: t('common.success'),
        description: t('common.keysCleared'),
      });
      setShowSuccessDialog(true);
    } catch (err) {
      console.error('Failed to clear API keys', err);
      setError(t('settings.errors.failedToClearApiKeys'));
    } finally {
      setIsResetting(false);
      setShowClearApiKeysDialog(false);
    }
  };

  // Handle Reset Database
  const handleResetDatabase = async () => {
    setIsResetting(true);
    try {
      await resetDatabase();

      // Clear all related localStorage keys
      localStorage.removeItem('master_resume_id');
      localStorage.removeItem('resume_builder_draft');
      localStorage.removeItem('resume_builder_settings');
      localStorage.removeItem('resume_matcher_content_language');
      localStorage.removeItem('resume_matcher_ui_language');

      // Refresh status to show empty counts
      await refreshStatus();
      // Clear health check as context is lost
      setHealthCheck(null);
      setError(null);
      setSuccessDialogMessage({
        title: t('common.success'),
        description: t('common.databaseReset'),
      });
      setShowSuccessDialog(true);
    } catch (err) {
      console.error('Failed to reset database', err);
      setError(t('settings.errors.failedToResetDatabase'));
    } finally {
      setIsResetting(false);
      setShowResetDatabaseDialog(false);
    }
  };

  // Format last fetched time for display
  const formatLastFetched = () => {
    if (!lastFetched) return t('settings.systemStatus.lastFetched.never');
    const now = new Date();
    const diff = Math.floor((now.getTime() - lastFetched.getTime()) / 1000);
    if (diff < 60) return t('settings.systemStatus.lastFetched.justNow');
    if (diff < 3600)
      return t('settings.systemStatus.lastFetched.minutesAgo', { minutes: Math.floor(diff / 60) });
    return t('settings.systemStatus.lastFetched.hoursAgo', { hours: Math.floor(diff / 3600) });
  };

  const requiresApiKey = providerInfo.requiresKey ?? true;

  return (
    <div className="max-w-7xl mx-auto w-full px-6 md:px-12 py-10 md:py-16 space-y-12">
      {/* Page header */}
      <section className="grid grid-cols-1 lg:grid-cols-[1.5fr_1fr] items-start gap-10">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[10px] font-bold uppercase tracking-widest mb-4">
            <Settings2 className="w-3 h-3" />
            {t('settings.title')}
          </div>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-3">
            {t('settings.title')}
          </h1>
          <p className="text-white/50 text-base max-w-xl">{t('settings.subtitle')}</p>
        </div>
        <div className="flex flex-col sm:flex-row lg:flex-col gap-3 lg:items-end">
          <Link href="/dashboard">
            <Button variant="outline" size="lg" className="w-full lg:w-60">
              <ArrowLeft className="w-4 h-4" />
              {t('common.back')}
            </Button>
          </Link>
          <Button
            variant="secondary"
            size="lg"
            onClick={refreshStatus}
            disabled={statusLoading}
            className="w-full lg:w-60"
          >
            <RefreshCw className={`w-4 h-4 ${statusLoading ? 'animate-spin' : ''}`} />
            {t('settings.systemStatus.refresh')}
          </Button>
        </div>
      </section>

      <div className="space-y-10">
          {/* API Key Not Configured Warning */}
          {!statusLoading && systemStatus && !systemStatus.llm_configured && (
            <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-5">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/20 flex items-center justify-center shrink-0">
                  <AlertTriangle className="w-5 h-5 text-amber-400" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold text-amber-300 mb-1">
                    {t('settings.setupRequired.title')}
                  </p>
                  <p className="text-xs text-amber-400/80">
                    {t('settings.setupRequired.description')}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* System Status Panel */}
          <Card className="space-y-6">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                  <Activity className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-white/40 font-bold">
                    {t('settings.systemStatus.title')}
                  </p>
                  <h2 className="text-lg font-bold">{t('settings.systemStatus.title')}</h2>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {lastFetched && (
                  <span className="text-xs text-white/40 font-mono flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {formatLastFetched()}
                  </span>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={refreshStatus}
                  disabled={statusLoading}
                  className="gap-1 text-xs"
                >
                  <RefreshCw className={`w-3 h-3 ${statusLoading ? 'animate-spin' : ''}`} />
                  {t('settings.systemStatus.refresh')}
                </Button>
              </div>
            </div>

            {statusLoading ? (
              <div className="flex items-center justify-center p-8">
                <Loader2 className="w-6 h-6 animate-spin text-white/40" />
              </div>
            ) : !systemStatus ? (
              <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-6 text-center">
                <p className="text-xs uppercase tracking-widest text-red-300 font-bold">
                  {t('settings.systemStatus.unableToConnect')}
                </p>
                <p className="text-xs text-white/50 font-mono mt-2">
                  {t('settings.systemStatus.expectedAt', { apiUrl: API_URL })}
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={refreshStatus}
                  className="gap-1 text-xs mt-4"
                >
                  <RefreshCw className="w-3 h-3" />
                  {t('common.retry')}
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {/* LLM Status */}
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Server className="w-4 h-4 text-white/40" />
                    <span className="font-mono text-xs uppercase text-white/40">
                      {t('settings.statusCards.llm')}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {systemStatus.llm_healthy ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                    ) : (
                      <XCircle className="w-5 h-5 text-red-400" />
                    )}
                    <span className="font-mono text-sm font-bold">
                      {systemStatus.llm_healthy
                        ? t('settings.statusValues.healthy')
                        : t('settings.statusValues.offline')}
                    </span>
                  </div>
                </div>

                {/* Database Status */}
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Database className="w-4 h-4 text-white/40" />
                    <span className="font-mono text-xs uppercase text-white/40">
                      {t('settings.statusCards.database')}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                    <span className="font-mono text-sm font-bold">
                      {t('settings.statusValues.connected')}
                    </span>
                  </div>
                </div>

                {/* Resumes Count */}
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <FileText className="w-4 h-4 text-white/40" />
                    <span className="font-mono text-xs uppercase text-white/40">
                      {t('settings.statusCards.resumes')}
                    </span>
                  </div>
                  <span className="font-mono text-2xl font-bold">
                    {systemStatus.database_stats.total_resumes}
                  </span>
                </div>

                {/* Jobs Count */}
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Briefcase className="w-4 h-4 text-white/40" />
                    <span className="font-mono text-xs uppercase text-white/40">
                      {t('settings.statusCards.jobs')}
                    </span>
                  </div>
                  <span className="font-mono text-2xl font-bold">
                    {systemStatus.database_stats.total_jobs}
                  </span>
                </div>
              </div>
            )}

            {/* Additional Stats Row */}
            {systemStatus && (
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles className="w-4 h-4 text-white/40" />
                    <span className="font-mono text-xs uppercase text-white/40">
                      {t('settings.statusCards.improvements')}
                    </span>
                  </div>
                  <span className="font-mono text-2xl font-bold">
                    {systemStatus.database_stats.total_improvements}
                  </span>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <FileText className="w-4 h-4 text-white/40" />
                    <span className="font-mono text-xs uppercase text-white/40">
                      {t('settings.statusCards.masterResume')}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {systemStatus.has_master_resume ? (
                      <>
                        <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                        <span className="font-mono text-sm font-bold">
                          {t('settings.statusValues.configured')}
                        </span>
                      </>
                    ) : (
                      <>
                        <XCircle className="w-5 h-5 text-amber-400" />
                        <span className="font-mono text-sm font-bold">
                          {t('settings.statusValues.notSet')}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            )}
          </Card>

          {/* LLM Configuration */}
          <Card className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                <Key className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-widest text-white/40 font-bold">
                  {t('settings.llmConfigurationTitle')}
                </p>
                <h2 className="text-xl font-bold tracking-tight">
                  {t('settings.llmConfigurationTitle')}
                </h2>
              </div>
            </div>

            <div className="grid gap-6">
              {/* Provider Selection */}
              <div className="space-y-2">
                <Label>{t('settings.providerLabel')}</Label>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
                  {PROVIDERS.map((p) => (
                    <button
                      key={p}
                      onClick={() => handleProviderChange(p)}
                      className={`px-2 sm:px-3 py-2 text-xs uppercase ${SEGMENTED_BUTTON_BASE} ${
                        provider === p ? SEGMENTED_BUTTON_ACTIVE : SEGMENTED_BUTTON_INACTIVE
                      }`}
                    >
                      {PROVIDER_INFO[p].name.split(' ')[0]}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-white/40 font-mono">
                  {t('settings.llmConfiguration.selectedProvider', {
                    provider: providerInfo.name,
                  })}
                </p>
              </div>

              {/* Model Input */}
              <div className="space-y-2">
                {provider === 'openrouter' ? (
                  <>
                    <div className="flex items-center justify-between">
                      <Label>{t('settings.llmConfiguration.modelLabel')}</Label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={showFreeModelsOnly}
                          onChange={(e) => setShowFreeModelsOnly(e.target.checked)}
                          className="w-4 h-4 border border-white/20 rounded"
                        />
                        <span className="text-xs font-mono text-white/50">Show free models only</span>
                      </label>
                    </div>
                    <SearchableDropdown
                      options={openRouterModels
                        .filter((m) => !showFreeModelsOnly || m.id.includes(':free') || m.name?.toLowerCase().includes('(free)'))
                        .map((m) => ({
                          id: m.id,
                          label: m.name || m.id,
                          description: m.description || undefined,
                          contextLength: m.context_length,
                          maxCompletionTokens: m.max_completion_tokens,
                        }))}
                      value={model}
                      onChange={setModel}
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
                      <p className="text-xs text-red-300 font-mono">
                        {openRouterModelsError}
                      </p>
                    )}
                    <p className="text-xs text-white/40 font-mono">
                      {t('settings.llmConfiguration.openRouterModelHelp')}
                    </p>
                  </>
                ) : (
                  <>
                    <Label htmlFor="model">{t('settings.llmConfiguration.modelLabel')}</Label>
                    <Input
                      id="model"
                      value={model}
                      onChange={(e) => setModel(e.target.value)}
                      placeholder={providerInfo.defaultModel}
                      className="font-mono"
                    />
                    <p className="text-xs text-white/40 font-mono">
                      {t('settings.llmConfiguration.defaultModel', {
                        model: providerInfo.defaultModel,
                      })}
                    </p>
                  </>
                )}
              </div>

              {/* API Key Input */}
              <div className="space-y-2">
                <Label htmlFor="apiKey">
                  {t('settings.llmConfiguration.apiKeyLabel')}{' '}
                  {!requiresApiKey && (
                    <span className="text-white/50">
                      {t('settings.llmConfiguration.apiKeyOptionalForOllama')}
                    </span>
                  )}
                </Label>
                <Input
                  id="apiKey"
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder={
                    requiresApiKey
                      ? t('settings.llmConfiguration.apiKeyPlaceholder')
                      : t('settings.llmConfiguration.apiKeyNotRequiredPlaceholder')
                  }
                  className="font-mono"
                  disabled={!requiresApiKey}
                />
                {requiresApiKey && hasStoredApiKey && !apiKey && (
                  <p className="text-xs text-white/40 font-mono">
                    {t('settings.llmConfiguration.leaveBlankToKeepExistingKey')}
                  </p>
                )}
              </div>

              {/* API Base URL (optional, for proxies/aggregators/custom endpoints) */}
              <div className="space-y-2">
                <Label htmlFor="apiBase">{t('settings.llmConfiguration.baseUrlLabel')}</Label>
                <Input
                  id="apiBase"
                  value={apiBase}
                  onChange={(e) => setApiBase(e.target.value)}
                  placeholder={t('settings.llmConfiguration.baseUrlPlaceholder')}
                  className="font-mono"
                />
                <p className="text-xs text-white/40 font-mono">
                  {t('settings.llmConfiguration.baseUrlDescription')}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                <Button
                  onClick={handleSave}
                  disabled={status === 'saving' || status === 'loading'}
                  className="w-full sm:flex-1"
                >
                  {status === 'saving' ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : status === 'saved' ? (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      {t('common.success')}
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      {t('common.save')}
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={handleTestConnection}
                  disabled={status === 'testing' || status === 'saving'}
                  className="w-full sm:w-auto"
                >
                  {status === 'testing' ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <Activity className="w-4 h-4" />
                      {t('settings.llmConfiguration.testConnection')}
                    </>
                  )}
                </Button>
              </div>

              {/* Error Message */}
              {error && (
                <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-4">
                  <p className="text-xs text-red-300 font-mono">
                    {t('settings.llmConfiguration.errorPrefix', { error })}
                  </p>
                </div>
              )}

              {/* Health Check Result */}
              {healthCheck && (
                <div
                  className={`rounded-2xl border p-4 ${
                    healthCheck.healthy
                      ? 'border-emerald-500/20 bg-emerald-500/10'
                      : 'border-red-500/20 bg-red-500/10'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    {healthCheck.healthy ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                    ) : (
                      <XCircle className="w-5 h-5 text-red-400" />
                    )}
                    <span className="font-mono text-sm font-bold">
                      {healthCheck.healthy
                        ? t('settings.llmConfiguration.connectionSuccessful')
                        : t('settings.llmConfiguration.connectionFailed')}
                    </span>
                  </div>
                  <p className="font-mono text-xs text-white/50">
                    {t('settings.llmConfiguration.connectionDetails', {
                      provider: healthCheck.provider,
                      model: healthCheck.model,
                    })}
                  </p>
                  {healthCheckError && (
                    <p className="font-mono text-xs text-red-300 mt-1">{healthCheckError}</p>
                  )}
                  {healthCheckWarning && (
                    <p className="font-mono text-xs text-amber-300 mt-1">{healthCheckWarning}</p>
                  )}
                  {healthDetailItems.length > 0 && (
                    <div className="mt-3 space-y-3">
                      {healthDetailItems.map((item) => (
                        <div key={item.key}>
                          <p className="font-mono text-[10px] uppercase tracking-wider text-white/40">
                            {item.label}
                          </p>
                          <pre className="mt-1 whitespace-pre-wrap break-all rounded-2xl border border-white/10 bg-white/5 p-3 text-xs text-white/80">
                            {item.value}
                          </pre>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </Card>

          {/* Content Generation Section */}
          <Card className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white/70">
                <Settings2 className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-widest text-white/40 font-bold">
                  {t('settings.contentGeneration.title')}
                </p>
                <h2 className="text-xl font-bold tracking-tight">
                  {t('settings.contentGeneration.title')}
                </h2>
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-sm text-white/50 mb-4">
                {t('settings.contentGeneration.description')}
              </p>

              <div className="space-y-3">
                <ToggleSwitch
                  checked={enableCoverLetter}
                  onCheckedChange={(checked) => {
                    setEnableCoverLetter(checked);
                    handleFeatureConfigChange('enable_cover_letter', checked);
                  }}
                  label={t('settings.contentGeneration.coverLetter.label')}
                  description={t('settings.contentGeneration.coverLetter.description')}
                  disabled={featureConfigLoading}
                />
                <ToggleSwitch
                  checked={enableOutreach}
                  onCheckedChange={(checked) => {
                    setEnableOutreach(checked);
                    handleFeatureConfigChange('enable_outreach_message', checked);
                  }}
                  label={t('settings.contentGeneration.outreachMessage.label')}
                  description={t('settings.contentGeneration.outreachMessage.description')}
                  disabled={featureConfigLoading}
                />
              </div>

              <div className="pt-4 border-t border-white/10">
                <Dropdown
                  options={localizedPromptOptions}
                  value={defaultPromptId}
                  onChange={handlePromptConfigChange}
                  label={t('settings.promptSettings.title')}
                  description={t('settings.promptSettings.description')}
                  disabled={promptConfigLoading}
                />
              </div>
            </div>
          </Card>

          {/* Language Settings Section */}
          <Card className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white/70">
                <Globe className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-widest text-white/40 font-bold">
                  {t('settings.uiLanguage')} & {t('settings.contentLanguage')}
                </p>
                <h2 className="text-xl font-bold tracking-tight">
                  {t('settings.uiLanguage')} & {t('settings.contentLanguage')}
                </h2>
              </div>
            </div>

            {/* UI Language */}
            <div className="space-y-4">
              <div>
                <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-white/70 mb-2">
                  {t('settings.uiLanguage')}
                </h3>
                <p className="text-sm text-white/50 mb-3">{t('settings.uiLanguageDescription')}</p>
              </div>

              <div className="space-y-2">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {supportedLanguages.map((lang) => (
                    <button
                      key={`ui-${lang}`}
                      onClick={() => setUiLanguage(lang as Locale)}
                      disabled={languageLoading}
                      className={`px-4 py-3 text-xs ${SEGMENTED_BUTTON_BASE} ${uiLanguage === lang ? SEGMENTED_BUTTON_ACTIVE : SEGMENTED_BUTTON_INACTIVE}`}
                    >
                      {languageNames[lang]}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Content Language */}
            <div className="space-y-4 pt-4 border-t border-white/10">
              <div>
                <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-white/70 mb-2">
                  {t('settings.contentLanguage')}
                </h3>
                <p className="text-sm text-white/50 mb-3">
                  {t('settings.contentLanguageDescription')}
                </p>
              </div>

              <div className="space-y-2">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {supportedLanguages.map((lang) => (
                    <button
                      key={`content-${lang}`}
                      onClick={() => setContentLanguage(lang as SupportedLanguage)}
                      disabled={languageLoading}
                      className={`px-4 py-3 text-xs ${SEGMENTED_BUTTON_BASE} ${contentLanguage === lang ? SEGMENTED_BUTTON_ACTIVE : SEGMENTED_BUTTON_INACTIVE}`}
                    >
                      {languageNames[lang]}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </Card>

          {/* Danger Zone */}
          <Card className="space-y-6 border-red-500/20 bg-red-500/[0.07]">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-red-500/20 border border-red-500/30 flex items-center justify-center text-red-300">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-widest text-red-300/80 font-bold">
                  {t('settings.dangerZone')}
                </p>
                <h2 className="text-xl font-bold tracking-tight text-red-200">
                  {t('settings.dangerZone')}
                </h2>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {/* Clear API Keys */}
              <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-6 space-y-4">
                <div>
                  <h3 className="font-bold text-sm text-red-100 mb-1">
                    {t('settings.clearApiKeys')}
                  </h3>
                  <p className="text-xs text-red-200/70">{t('settings.clearApiKeysDescription')}</p>
                </div>
                <Button
                  variant="outline"
                  className="w-full border-red-500/30 text-red-200 hover:bg-red-500/20 hover:text-red-100"
                  onClick={() => setShowClearApiKeysDialog(true)}
                  disabled={isResetting}
                >
                  <Key className="w-4 h-4 mr-2" />
                  {t('settings.clearApiKeys')}
                </Button>
              </div>

              {/* Reset Database */}
              <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-6 space-y-4">
                <div>
                  <h3 className="font-bold text-sm text-red-100 mb-1">
                    {t('settings.resetDatabase')}
                  </h3>
                  <p className="text-xs text-red-200/70">{t('settings.resetDatabaseDescription')}</p>
                </div>
                <Button
                  variant="destructive"
                  className="w-full"
                  onClick={() => setShowResetDatabaseDialog(true)}
                  disabled={isResetting}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  {t('settings.resetDatabase')}
                </Button>
              </div>
            </div>
          </Card>
        </div>

        {/* Footer: version + system status */}
        <div className="mt-8 flex flex-col sm:flex-row justify-between items-center gap-3 py-4 border-t border-white/5 text-white/30">
          <div className="flex items-center gap-2">
            <Image src="/logo.svg" alt="Resume Matcher" width={16} height={16} className="w-4 h-4 opacity-40" />
            <span className="font-mono text-xs">{getVersionString().toUpperCase()}</span>
          </div>
          <div className="flex items-center gap-2">
            {statusLoading ? (
              <><Loader2 className="w-3 h-3 animate-spin" /><span className="font-mono text-xs">{t('settings.footer.status.checking')}</span></>
            ) : systemStatus ? (
              <>
                <div className={`w-2 h-2 rounded-full ${systemStatus.status === 'ready' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                <span className={`font-mono text-xs font-bold ${
                  systemStatus.status === 'ready' ? 'text-emerald-400' : 'text-amber-400'
                }`}>
                  {systemStatus.status === 'ready' ? t('settings.footer.status.ready') : t('settings.footer.status.setupRequired')}
                </span>
              </>
            ) : (
              <span className="font-mono text-xs">{t('settings.footer.status.offline')}</span>
            )}
          </div>
        </div>

      <ConfirmDialog
        open={showClearApiKeysDialog}
        onOpenChange={setShowClearApiKeysDialog}
        title={t('confirmations.clearApiKeys')}
        description={t('confirmations.clearApiKeysDescription')}
        confirmLabel={t('common.delete')}
        variant="warning"
        onConfirm={handleClearApiKeys}
      />

      <ConfirmDialog
        open={showResetDatabaseDialog}
        onOpenChange={setShowResetDatabaseDialog}
        title={t('confirmations.resetDatabase')}
        description={t('confirmations.resetDatabaseDescription')}
        confirmLabel={t('common.reset')}
        variant="destructive"
        onConfirm={handleResetDatabase}
      />

      <ConfirmDialog
        open={showSuccessDialog}
        onOpenChange={setShowSuccessDialog}
        title={successMessage.title}
        description={successMessage.description}
        confirmLabel={t('common.close')}
        variant="default"
        onConfirm={() => setShowSuccessDialog(false)}
      />
    </div>
  );
}



