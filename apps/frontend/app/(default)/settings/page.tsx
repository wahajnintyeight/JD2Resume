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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Dropdown } from '@/components/ui/dropdown';
import { SearchableDropdown } from '@/components/ui/searchable-dropdown';
import { LoadingAnimation } from '@/components/ui/loading-animation';
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
  Lock as LockIcon,
} from 'lucide-react';
import { useLanguage } from '@/lib/context/language-context';
import { useTranslations } from '@/lib/i18n';
import { useAuth } from '@/lib/context/auth-context';
import type { SupportedLanguage } from '@/lib/api/config';
import type { Locale } from '@/i18n/config';

const ADMIN_EMAILS = ['miksmth502@gmail.com', 'wahaj.dkz@gmail.com'];

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
  'border border-black font-mono transition-all duration-150 ease-out shadow-[2px_2px_0px_0px_#000000] hover:translate-y-[1px] hover:translate-x-[1px] hover:shadow-none disabled:cursor-not-allowed disabled:opacity-50';
const SEGMENTED_BUTTON_ACTIVE = 'bg-blue-700 text-white border-black hover:bg-blue-800';
const SEGMENTED_BUTTON_INACTIVE = 'bg-white text-black hover:bg-[#E5E5E0]';

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
  const { t } = useTranslations();
  const { user } = useAuth();
  const [status, setStatus] = useState<Status>('loading');
  const [error, setError] = useState<string | null>(null);

  const isAdmin = useMemo(() => {
    return user?.email && ADMIN_EMAILS.includes(user.email);
  }, [user]);

  // LLM Config state
  const [provider, setProvider] = useState<LLMProvider>('openai');
  const [llmConfigMode, setLlmConfigMode] = useState<'preset' | 'custom'>('preset');
  const [lastPresetProvider, setLastPresetProvider] = useState<LLMProvider>('openai');
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
  // const { t } = useTranslations(); // Remove duplicate
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
          setLastPresetProvider(safeProvider);
          setModel(llmConfig.model || PROVIDER_INFO[safeProvider].defaultModel);
          const isMaskedKey = Boolean(llmConfig.api_key) && llmConfig.api_key.includes('*');
          setHasStoredApiKey(Boolean(llmConfig.api_key));
          setApiKey(isMaskedKey ? '' : llmConfig.api_key || '');
          setApiBase(llmConfig.api_base || '');

          const inferredMode =
            safeProvider === 'openai' && Boolean((llmConfig.api_base || '').trim())
              ? 'custom'
              : 'preset';
          setLlmConfigMode(inferredMode);

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
    setLastPresetProvider(newProvider);
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

  const handleLlmConfigModeChange = async (mode: 'preset' | 'custom') => {
    setLlmConfigMode(mode);
    if (mode === 'custom') {
      if (provider !== 'openai') {
        // Switch to an OpenAI-compatible config without clearing any currently typed key.
        setOpenRouterModels([]);
        setOpenRouterModelsError(null);
        setIsLoadingApiKey(false);
        setProvider('openai');
        setModel(PROVIDER_INFO['openai'].defaultModel);
      }
      if (!model.trim()) {
        setModel(PROVIDER_INFO['openai'].defaultModel);
      }
    } else {
      await handleProviderChange(lastPresetProvider);
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

  // Show full-page loading animation while initial config loads
  if (status === 'loading') {
    return (
      <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-slate-50 via-indigo-50/20 to-purple-50/30">
        <div className="bg-white rounded-3xl shadow-2xl border border-slate-200/60 p-12">
          <LoadingAnimation 
            message="Loading settings..." 
            variant="sparkle" 
            size="lg" 
          />
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full w-full flex-col bg-gradient-to-br from-slate-50 via-indigo-50/20 to-purple-50/30 font-sans">
      <div className="flex h-full w-full flex-1 flex-col">
        {/* Header */}
        <div className="border-b border-slate-200/60 backdrop-blur-xl bg-white/80 p-6 sm:p-8 lg:p-10 flex flex-col sm:flex-row justify-between items-start gap-6 sticky top-0 z-10 shadow-sm">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-200/50">
                <Settings2 className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-3xl sm:text-4xl font-bold tracking-tight bg-gradient-to-r from-slate-900 via-indigo-900 to-purple-900 bg-clip-text text-transparent">
                {t('settings.title')}
              </h1>
            </div>
            <p className="text-sm text-slate-600 ml-[52px]">
              {t('settings.subtitle')}
            </p>
          </div>
          <Link href="/dashboard">
            <Button variant="outline" size="sm" className="w-full sm:w-auto shadow-sm hover:shadow-md transition-shadow">
              <ArrowLeft className="w-4 h-4" />
              {t('common.back')}
            </Button>
          </Link>
        </div>

        <div className="p-6 sm:p-8 lg:p-10 space-y-10 lg:space-y-12 max-w-7xl mx-auto w-full">
          {/* API Key Not Configured Warning */}
          {!statusLoading && systemStatus && !systemStatus.llm_configured && (
            <div className="relative overflow-hidden rounded-3xl border-2 border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50 p-6 shadow-lg shadow-amber-100/50">
              <div className="absolute top-0 right-0 w-32 h-32 bg-amber-200/20 rounded-full -mr-16 -mt-16" />
              <div className="relative flex items-start gap-4">
                <div className="w-12 h-12 bg-amber-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-amber-200/50 shrink-0">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <div className="flex-1 space-y-1">
                  <p className="text-lg font-bold text-amber-900">
                    {t('settings.setupRequired.title')}
                  </p>
                  <p className="text-sm text-amber-800/80">
                    {t('settings.setupRequired.description')}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* System Status Panel */}
          <section className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-blue-200/50">
                  <Activity className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900">
                    {t('settings.systemStatus.title')}
                  </h2>
                  {lastFetched && (
                    <span className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
                      <Clock className="w-3 h-3" />
                      {formatLastFetched()}
                    </span>
                  )}
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={refreshStatus}
                disabled={statusLoading}
                className="gap-2 hover:bg-slate-100 rounded-xl"
              >
                <RefreshCw className={`w-4 h-4 ${statusLoading ? 'animate-spin' : ''}`} />
                {t('settings.systemStatus.refresh')}
              </Button>
            </div>

            {statusLoading ? (
              <div className="bg-white rounded-3xl border border-slate-200/60 shadow-sm overflow-hidden">
                <LoadingAnimation 
                  message="Checking system status..." 
                  variant="sparkle" 
                  size="md" 
                />
              </div>
            ) : !systemStatus ? (
              <div className="flex flex-col items-center justify-center p-12 gap-4 rounded-3xl border-2 border-dashed border-red-200 bg-red-50/50">
                <div className="w-16 h-16 rounded-2xl bg-red-100 flex items-center justify-center">
                  <XCircle className="w-8 h-8 text-red-600" />
                </div>
                <div className="text-center space-y-2">
                  <p className="text-sm font-semibold text-red-900">
                    {t('settings.systemStatus.unableToConnect')}
                  </p>
                  <p className="text-xs text-slate-600">
                    {t('settings.systemStatus.expectedAt', { apiUrl: API_URL })}
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={refreshStatus}
                  className="gap-2 mt-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  {t('common.retry')}
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {/* LLM Status */}
                <div className="group relative overflow-hidden bg-white rounded-3xl border border-slate-200/60 p-6 shadow-sm hover:shadow-xl hover:border-indigo-200 transition-all duration-300">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-green-100 to-emerald-100 rounded-full -mr-12 -mt-12 opacity-50 group-hover:opacity-100 transition-opacity" />
                  <div className="relative space-y-3">
                    <div className="flex items-center justify-between">
                      <Server className="w-5 h-5 text-slate-400" />
                      {systemStatus.llm_healthy ? (
                        <CheckCircle2 className="w-5 h-5 text-green-600" />
                      ) : (
                        <XCircle className="w-5 h-5 text-red-500" />
                      )}
                    </div>
                    <div>
                      <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                        {t('settings.statusCards.llm')}
                      </p>
                      <p className="text-lg font-bold text-slate-900 mt-1">
                        {systemStatus.llm_healthy
                          ? t('settings.statusValues.healthy')
                          : t('settings.statusValues.offline')}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Database Status */}
                <div className="group relative overflow-hidden bg-white rounded-3xl border border-slate-200/60 p-6 shadow-sm hover:shadow-xl hover:border-indigo-200 transition-all duration-300">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-blue-100 to-cyan-100 rounded-full -mr-12 -mt-12 opacity-50 group-hover:opacity-100 transition-opacity" />
                  <div className="relative space-y-3">
                    <div className="flex items-center justify-between">
                      <Database className="w-5 h-5 text-slate-400" />
                      <CheckCircle2 className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                        {t('settings.statusCards.database')}
                      </p>
                      <p className="text-lg font-bold text-slate-900 mt-1">
                        {t('settings.statusValues.connected')}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Resumes Count */}
                <div className="group relative overflow-hidden bg-white rounded-3xl border border-slate-200/60 p-6 shadow-sm hover:shadow-xl hover:border-indigo-200 transition-all duration-300">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-full -mr-12 -mt-12 opacity-50 group-hover:opacity-100 transition-opacity" />
                  <div className="relative space-y-3">
                    <FileText className="w-5 h-5 text-slate-400" />
                    <div>
                      <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                        {t('settings.statusCards.resumes')}
                      </p>
                      <p className="text-3xl font-bold text-slate-900 mt-1">
                        {systemStatus.database_stats.total_resumes}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Jobs Count */}
                <div className="group relative overflow-hidden bg-white rounded-3xl border border-slate-200/60 p-6 shadow-sm hover:shadow-xl hover:border-indigo-200 transition-all duration-300">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-purple-100 to-pink-100 rounded-full -mr-12 -mt-12 opacity-50 group-hover:opacity-100 transition-opacity" />
                  <div className="relative space-y-3">
                    <Briefcase className="w-5 h-5 text-slate-400" />
                    <div>
                      <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                        {t('settings.statusCards.jobs')}
                      </p>
                      <p className="text-3xl font-bold text-slate-900 mt-1">
                        {systemStatus.database_stats.total_jobs}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Additional Stats Row */}
            {systemStatus && (
              <div className="grid grid-cols-2 gap-4">
                <div className="group relative overflow-hidden bg-white rounded-3xl border border-slate-200/60 p-6 shadow-sm hover:shadow-xl hover:border-indigo-200 transition-all duration-300">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-amber-100 to-yellow-100 rounded-full -mr-12 -mt-12 opacity-50 group-hover:opacity-100 transition-opacity" />
                  <div className="relative space-y-3">
                    <Sparkles className="w-5 h-5 text-slate-400" />
                    <div>
                      <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                        {t('settings.statusCards.improvements')}
                      </p>
                      <p className="text-3xl font-bold text-slate-900 mt-1">
                        {systemStatus.database_stats.total_improvements}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="group relative overflow-hidden bg-white rounded-3xl border border-slate-200/60 p-6 shadow-sm hover:shadow-xl hover:border-indigo-200 transition-all duration-300">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-teal-100 to-cyan-100 rounded-full -mr-12 -mt-12 opacity-50 group-hover:opacity-100 transition-opacity" />
                  <div className="relative space-y-3">
                    <div className="flex items-center justify-between">
                      <FileText className="w-5 h-5 text-slate-400" />
                      {systemStatus.has_master_resume ? (
                        <CheckCircle2 className="w-5 h-5 text-green-600" />
                      ) : (
                        <XCircle className="w-5 h-5 text-amber-500" />
                      )}
                    </div>
                    <div>
                      <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                        {t('settings.statusCards.masterResume')}
                      </p>
                      <p className="text-lg font-bold text-slate-900 mt-1">
                        {systemStatus.has_master_resume
                          ? t('settings.statusValues.configured')
                          : t('settings.statusValues.notSet')}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </section>

          {/* LLM Configuration */}
          <section className="bg-white rounded-3xl border border-slate-200/60 shadow-lg overflow-hidden">
            <div className="bg-gradient-to-r from-indigo-50 to-purple-50 p-6 sm:p-8 border-b border-slate-200/60">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-200/50">
                  <Key className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">
                    {t('settings.llmConfigurationTitle')}
                  </h2>
                  <p className="text-sm text-slate-600 mt-1">Configure your AI model provider and credentials</p>
                </div>
              </div>
            </div>

            <div className="p-6 sm:p-8 space-y-8">
              <div className="space-y-3">
                <Label className="text-sm font-semibold text-slate-700">Configuration Mode</Label>
                <div className="inline-flex p-1 bg-slate-100 rounded-2xl gap-1">
                  <button
                    type="button"
                    onClick={() => handleLlmConfigModeChange('preset')}
                    disabled={!isAdmin}
                    className={`px-6 py-2.5 text-sm font-medium rounded-xl transition-all duration-200 ${
                      llmConfigMode === 'preset'
                        ? 'bg-white text-indigo-700 shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    } ${!isAdmin ? 'cursor-not-allowed opacity-50' : ''}`}
                  >
                    Providers
                  </button>
                  <button
                    type="button"
                    onClick={() => handleLlmConfigModeChange('custom')}
                    disabled={!isAdmin}
                    className={`px-6 py-2.5 text-sm font-medium rounded-xl transition-all duration-200 ${
                      llmConfigMode === 'custom'
                        ? 'bg-white text-indigo-700 shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    } ${!isAdmin ? 'cursor-not-allowed opacity-50' : ''}`}
                  >
                    Custom Provider
                  </button>
                </div>
              </div>

              {/* Provider Selection */}
              {llmConfigMode === 'preset' ? (
                <div className="space-y-3">
                  <Label className="text-sm font-semibold text-slate-700">{t('settings.providerLabel')}</Label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                    {PROVIDERS.map((p) => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => handleProviderChange(p)}
                        disabled={!isAdmin}
                        className={`relative px-4 py-4 text-sm font-medium rounded-2xl border-2 transition-all duration-200 ${
                          provider === p
                            ? 'bg-gradient-to-br from-indigo-50 to-purple-50 border-indigo-300 text-indigo-700 shadow-lg shadow-indigo-100'
                            : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300 hover:shadow-md'
                        } ${!isAdmin ? 'cursor-not-allowed opacity-50' : ''}`}
                      >
                        {provider === p && (
                          <div className="absolute top-2 right-2 w-2 h-2 bg-indigo-600 rounded-full" />
                        )}
                        {PROVIDER_INFO[p].name}
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-slate-500 bg-slate-50 rounded-xl p-3">
                    {t('settings.llmConfiguration.selectedProvider', {
                      provider: providerInfo.name,
                    })}
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  <Label className="text-sm font-semibold text-slate-700">{t('settings.providerLabel')}</Label>
                  <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-2xl border border-slate-200 p-4">
                    <p className="text-sm font-medium text-slate-700">
                      OpenAI-compatible
                    </p>
                  </div>
                </div>
              )}

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
                          className="w-4 h-4 border-2 border-black rounded-none"
                        />
                        <span className="text-xs font-mono text-gray-600">Show free models only</span>
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
                      <p className="text-xs text-red-600 font-mono">
                        {openRouterModelsError}
                      </p>
                    )}
                    <p className="text-xs text-gray-500 font-mono">
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
                      disabled={!isAdmin}
                    />
                    <p className="text-xs text-gray-500 font-mono">
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
                    <span className="text-gray-400">
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
                  disabled={!requiresApiKey || !isAdmin}
                />
                {requiresApiKey && hasStoredApiKey && !apiKey && (
                  <p className="text-xs text-gray-500 font-mono">
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
                  disabled={!isAdmin}
                />
                <p className="text-xs text-gray-500 font-mono">
                  {t('settings.llmConfiguration.baseUrlDescription')}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <Button
                  onClick={handleSave}
                  disabled={status === 'saving' || status === 'loading' || !isAdmin}
                  className="w-full sm:flex-1 h-12 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-lg shadow-indigo-200/50 hover:shadow-xl transition-all duration-200"
                >
                  {status === 'saving' ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : status === 'saved' ? (
                    <>
                      <CheckCircle2 className="w-5 h-5" />
                      {t('common.success')}
                    </>
                  ) : (
                    <>
                      <Save className="w-5 h-5" />
                      {t('common.save')}
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={handleTestConnection}
                  disabled={status === 'testing' || status === 'saving' || !isAdmin}
                  className="w-full sm:w-auto h-12 border-2 hover:bg-slate-50 hover:border-slate-300 transition-all duration-200"
                >
                  {status === 'testing' ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      <Activity className="w-5 h-5" />
                      {t('settings.llmConfiguration.testConnection')}
                    </>
                  )}
                </Button>
              </div>

              {/* Error Message */}
              {error && (
                <div className="rounded-2xl border-2 border-red-200 bg-red-50 p-4">
                  <div className="flex items-start gap-3">
                    <XCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                    <p className="text-sm text-red-700">
                      {t('settings.llmConfiguration.errorPrefix', { error })}
                    </p>
                  </div>
                </div>
              )}

              {/* Health Check Result */}
              {healthCheck && (
                <div
                  className={`rounded-2xl border-2 p-6 ${
                    healthCheck.healthy
                      ? 'border-green-200 bg-gradient-to-br from-green-50 to-emerald-50'
                      : 'border-red-200 bg-gradient-to-br from-red-50 to-rose-50'
                  }`}
                >
                  <div className="flex items-center gap-3 mb-3">
                    {healthCheck.healthy ? (
                      <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center">
                        <CheckCircle2 className="w-6 h-6 text-green-600" />
                      </div>
                    ) : (
                      <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center">
                        <XCircle className="w-6 h-6 text-red-600" />
                      </div>
                    )}
                    <div>
                      <p className="text-base font-bold text-slate-900">
                        {healthCheck.healthy
                          ? t('settings.llmConfiguration.connectionSuccessful')
                          : t('settings.llmConfiguration.connectionFailed')}
                      </p>
                      <p className="text-sm text-slate-600 mt-0.5">
                        {t('settings.llmConfiguration.connectionDetails', {
                          provider: healthCheck.provider,
                          model: healthCheck.model,
                        })}
                      </p>
                    </div>
                  </div>
                  {healthCheckError && (
                    <p className="text-sm text-red-700 bg-red-100/50 rounded-xl p-3 mt-3">{healthCheckError}</p>
                  )}
                  {healthCheckWarning && (
                    <p className="text-sm text-amber-700 bg-amber-100/50 rounded-xl p-3 mt-3">{healthCheckWarning}</p>
                  )}
                  {healthDetailItems.length > 0 && (
                    <div className="mt-4 space-y-4">
                      {healthDetailItems.map((item) => (
                        <div key={item.key}>
                          <p className="text-xs font-semibold uppercase tracking-wider text-slate-600 mb-2">
                            {item.label}
                          </p>
                          <pre className="whitespace-pre-wrap break-all rounded-xl border border-slate-200 bg-white p-4 text-xs text-slate-800 shadow-sm">
                            {item.value}
                          </pre>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </section>

          {/* Content Generation Section */}
          <section className="bg-white rounded-3xl border border-slate-200/60 shadow-lg overflow-hidden">
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-6 sm:p-8 border-b border-slate-200/60">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center shadow-lg shadow-purple-200/50">
                  <Settings2 className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">
                    {t('settings.contentGeneration.title')}
                  </h2>
                  <p className="text-sm text-slate-600 mt-1">
                    {t('settings.contentGeneration.description')}
                  </p>
                </div>
              </div>
            </div>

            <div className="p-6 sm:p-8 space-y-6">
              <div className="space-y-4">
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

              <div className="pt-6 border-t border-slate-200">
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
          </section>

          {/* Language Settings Section */}
          <section className="bg-white rounded-3xl border border-slate-200/60 shadow-lg overflow-hidden">
            <div className="bg-gradient-to-r from-blue-50 to-cyan-50 p-6 sm:p-8 border-b border-slate-200/60">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-600 to-cyan-600 flex items-center justify-center shadow-lg shadow-blue-200/50">
                  <Globe className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">
                    {t('settings.uiLanguage')} & {t('settings.contentLanguage')}
                  </h2>
                  <p className="text-sm text-slate-600 mt-1">Customize language preferences for interface and content</p>
                </div>
              </div>
            </div>

            <div className="p-6 sm:p-8 space-y-8">
              {/* UI Language */}
              <div className="space-y-4">
                <div>
                  <h3 className="text-base font-bold text-slate-900 mb-1">
                    {t('settings.uiLanguage')}
                  </h3>
                  <p className="text-sm text-slate-600">{t('settings.uiLanguageDescription')}</p>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {supportedLanguages.map((lang) => (
                    <button
                      key={`ui-${lang}`}
                      onClick={() => setUiLanguage(lang as Locale)}
                      disabled={languageLoading}
                      className={`px-4 py-3 text-sm font-medium rounded-2xl border-2 transition-all duration-200 ${
                        uiLanguage === lang
                          ? 'bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-300 text-blue-700 shadow-lg shadow-blue-100'
                          : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300 hover:shadow-md'
                      }`}
                    >
                      {languageNames[lang]}
                    </button>
                  ))}
                </div>
              </div>

              {/* Content Language */}
              <div className="space-y-4 pt-6 border-t border-slate-200">
                <div>
                  <h3 className="text-base font-bold text-slate-900 mb-1">
                    {t('settings.contentLanguage')}
                  </h3>
                  <p className="text-sm text-slate-600">
                    {t('settings.contentLanguageDescription')}
                  </p>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {supportedLanguages.map((lang) => (
                    <button
                      key={`content-${lang}`}
                      onClick={() => setContentLanguage(lang as SupportedLanguage)}
                      disabled={languageLoading}
                      className={`px-4 py-3 text-sm font-medium rounded-2xl border-2 transition-all duration-200 ${
                        contentLanguage === lang
                          ? 'bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-300 text-blue-700 shadow-lg shadow-blue-100'
                          : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300 hover:shadow-md'
                      }`}
                    >
                      {languageNames[lang]}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* Danger Zone */}
          <section className="bg-gradient-to-br from-red-50 to-rose-50 rounded-3xl border-2 border-red-200 shadow-lg overflow-hidden">
            <div className="bg-gradient-to-r from-red-100 to-rose-100 p-6 sm:p-8 border-b border-red-200">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-red-600 to-rose-600 flex items-center justify-center shadow-lg shadow-red-200/50">
                  <AlertTriangle className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-red-900">
                    {t('settings.dangerZone')}
                  </h2>
                  <p className="text-sm text-red-700 mt-1">Irreversible actions that affect your data</p>
                </div>
              </div>
            </div>

            <div className="p-6 sm:p-8">
              <div className="grid md:grid-cols-2 gap-6">
                {/* Clear API Keys */}
                <div className="bg-white rounded-2xl border-2 border-red-200 p-6 space-y-4 hover:shadow-lg transition-shadow">
                  <div>
                    <h3 className="text-base font-bold text-red-900 mb-2">
                      {t('settings.clearApiKeys')}
                    </h3>
                    <p className="text-sm text-red-700">{t('settings.clearApiKeysDescription')}</p>
                  </div>
                  <Button
                    variant="outline"
                    className="w-full border-2 border-red-300 text-red-700 hover:bg-red-50 hover:border-red-400 transition-all"
                    onClick={() => setShowClearApiKeysDialog(true)}
                    disabled={isResetting || !isAdmin}
                  >
                    <Key className="w-4 h-4 mr-2" />
                    {t('settings.clearApiKeys')}
                    {!isAdmin && <LockIcon className="ml-2 w-3 h-3" />}
                  </Button>
                </div>

                {/* Reset Database */}
                <div className="bg-white rounded-2xl border-2 border-red-200 p-6 space-y-4 hover:shadow-lg transition-shadow">
                  <div>
                    <h3 className="text-base font-bold text-red-900 mb-2">
                      {t('settings.resetDatabase')}
                    </h3>
                    <p className="text-sm text-red-700">{t('settings.resetDatabaseDescription')}</p>
                  </div>
                  <Button
                    variant="destructive"
                    className="w-full shadow-lg hover:shadow-xl transition-all"
                    onClick={() => setShowResetDatabaseDialog(true)}
                    disabled={isResetting || !isAdmin}
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    {t('settings.resetDatabase')}
                    {!isAdmin && <LockIcon className="ml-2 w-3 h-3" />}
                  </Button>
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* Footer */}
        <div className="bg-white/80 backdrop-blur-xl border-t border-slate-200/60 p-6 flex flex-col sm:flex-row justify-between items-center gap-4 shadow-lg">
          <div className="flex items-center gap-3">
            <Image
              src="/logo.svg"
              alt="Resume Matcher"
              width={24}
              height={24}
              className="w-6 h-6"
            />
            <span className="text-sm font-medium text-slate-600">
              {getVersionString()}
            </span>
          </div>
          <div className="flex items-center gap-3">
            {statusLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-indigo-500" />
                <span className="text-sm text-slate-600">
                  {t('settings.footer.status.checking')}
                </span>
              </>
            ) : systemStatus ? (
              <>
                <div
                  className={`w-3 h-3 rounded-full ${systemStatus.status === 'ready' ? 'bg-green-500 shadow-lg shadow-green-200' : 'bg-amber-500 shadow-lg shadow-amber-200'}`}
                ></div>
                <span
                  className={`text-sm font-semibold ${systemStatus.status === 'ready' ? 'text-green-700' : 'text-amber-700'}`}
                >
                  {systemStatus.status === 'ready'
                    ? t('settings.footer.status.ready')
                    : t('settings.footer.status.setupRequired')}
                </span>
              </>
            ) : (
              <span className="text-sm text-slate-500">
                {t('settings.footer.status.offline')}
              </span>
            )}
          </div>
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
        variant="danger"
        onConfirm={handleResetDatabase}
      />

      <ConfirmDialog
        open={showSuccessDialog}
        onOpenChange={setShowSuccessDialog}
        title={successMessage.title}
        description={successMessage.description}
        confirmLabel={t('common.close')}
        showCancelButton={false}
        variant="success"
        onConfirm={() => setShowSuccessDialog(false)}
      />
    </div>
  );
}
