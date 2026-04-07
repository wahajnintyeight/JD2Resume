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
import { useStatusCache } from '@/lib/context/status-cache';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { SearchableDropdown } from '@/components/ui/searchable-dropdown';
import { ToggleSwitch } from '@/components/ui/toggle-switch';
import { Dropdown } from '@/components/ui/dropdown';
import { LoadingAnimation } from '@/components/ui/loading-animation';
import {
  Loader2,
  ArrowLeft,
  Settings2,
  Activity,
  Key,
  Sparkles,
  Globe,
  AlertTriangle,
  RefreshCw,
  Clock,
  XCircle,
  CheckCircle2,
  Server,
  Database,
  FileText,
  Briefcase,
  Save,
  Trash2,
  Lock as LockIcon,
} from 'lucide-react';
import { useLanguage } from '@/lib/context/language-context';
import { useTranslations } from '@/lib/i18n';
import { useAuth } from '@/lib/context/auth-context';
import type { SupportedLanguage } from '@/lib/api/config';
import type { Locale } from '@/i18n/config';
import { cn } from '@/lib/utils';

// Import section components
import { SystemStatusSection } from '@/components/settings/system-status-section';
import { LLMConfigSection } from '@/components/settings/llm-config-section';
import { ContentGenerationSection } from '@/components/settings/content-generation-section';
import { LanguageSettingsSection } from '@/components/settings/language-settings-section';
import { DangerZoneSection } from '@/components/settings/danger-zone-section';

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
  const [activeSection, setActiveSection] = useState<
    'system' | 'llm' | 'features' | 'language' | 'danger'
  >('system');

  const isAdmin = useMemo(() => {
    return Boolean(user?.email && ADMIN_EMAILS.includes(user.email));
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
          setOpenRouterModelsError(err instanceof Error ? err.message : 'Failed to load models');
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
      <div className="flex h-full w-full items-center justify-center bg-slate-100 dark:bg-[#050505]">
        <div className="bg-white dark:bg-[#0A0A0A] rounded-2xl border border-slate-200 dark:border-white/10 p-12 shadow-2xl">
          <LoadingAnimation message="Loading settings..." variant="sparkle" size="lg" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-[#0A0A0A] dark:via-[#0F0F0F] dark:to-[#0A0A0A]">
      {/* Header */}
      <div className="border-b border-slate-200/50 dark:border-white/5 bg-white/80 dark:bg-[#0A0A0A]/80 backdrop-blur-xl sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/dashboard">
                <Button variant="ghost" size="sm" className="gap-2">
                  <ArrowLeft className="w-4 h-4" />
                  {t('common.back')}
                </Button>
              </Link>
              <div className="h-8 w-px bg-slate-200 dark:bg-white/10" />
              <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
                Settings
              </h1>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-12">
        <div className="space-y-12">
          {/* Content sections will go here */}
          {/* API Key Not Configured Warning */}
          {!statusLoading && systemStatus && !systemStatus.llm_configured && (
            <div className="relative overflow-hidden rounded-2xl border-2 border-amber-500/20 bg-amber-50 dark:bg-amber-500/10 p-6">
              <div className="relative flex items-start gap-4">
                <div className="w-12 h-12 bg-amber-500 rounded-xl flex items-center justify-center text-white shadow-md shadow-amber-500/20 shrink-0">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <div className="flex-1 space-y-1">
                  <p className="text-base font-bold text-amber-900 dark:text-amber-200">
                    {t('settings.setupRequired.title')}
                  </p>
                  <p className="text-sm text-amber-800 dark:text-amber-300 font-medium">
                    {t('settings.setupRequired.description')}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* System Status Panel */}
          <SystemStatusSection
            systemStatus={systemStatus}
            statusLoading={statusLoading}
            lastFetched={lastFetched}
            refreshStatus={refreshStatus}
            t={t}
          />

          {/* LLM Configuration */}
          <LLMConfigSection
            provider={provider}
            llmConfigMode={llmConfigMode}
            model={model}
            apiKey={apiKey}
            apiBase={apiBase}
            hasStoredApiKey={hasStoredApiKey}
            openRouterModels={openRouterModels}
            openRouterModelsLoading={openRouterModelsLoading}
            openRouterModelsError={openRouterModelsError}
            showFreeModelsOnly={showFreeModelsOnly}
            status={status}
            error={error}
            healthCheck={healthCheck}
            isAdmin={isAdmin}
            onProviderChange={handleProviderChange}
            onModeChange={handleLlmConfigModeChange}
            onModelChange={setModel}
            onApiKeyChange={setApiKey}
            onApiBaseChange={setApiBase}
            onShowFreeModelsChange={setShowFreeModelsOnly}
            onSave={handleSave}
            onTest={handleTestConnection}
            t={t}
            healthCheckError={healthCheckError}
            healthCheckWarning={healthCheckWarning}
            healthDetailItems={healthDetailItems}
          />

          {/* Content Generation Section */}
          <ContentGenerationSection
            enableCoverLetter={enableCoverLetter}
            enableOutreach={enableOutreach}
            featureConfigLoading={featureConfigLoading}
            promptConfigLoading={promptConfigLoading}
            localizedPromptOptions={localizedPromptOptions}
            defaultPromptId={defaultPromptId}
            onFeatureConfigChange={handleFeatureConfigChange}
            onPromptConfigChange={handlePromptConfigChange}
            t={t}
          />

          {/* Language Settings Section */}
          <LanguageSettingsSection
            contentLanguage={contentLanguage}
            uiLanguage={uiLanguage}
            supportedLanguages={supportedLanguages}
            languageNames={languageNames}
            languageLoading={languageLoading}
            onContentLanguageChange={setContentLanguage}
            onUiLanguageChange={setUiLanguage}
            t={t}
          />

          {/* Danger Zone */}
          <DangerZoneSection
            isResetting={isResetting}
            isAdmin={isAdmin}
            onClearApiKeys={() => setShowClearApiKeysDialog(true)}
            onResetDatabase={() => setShowResetDatabaseDialog(true)}
            t={t}
          />
        </div>

        {/* Footer */}
        <div className="bg-white dark:bg-[#0A0A0A] border-t border-slate-200 dark:border-white/10 p-6 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <Image
              src="/logo.svg"
              alt="Resume Matcher"
              width={24}
              height={24}
              className="w-6 h-6"
            />
            <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
              {getVersionString()}
            </span>
          </div>
          <div className="flex items-center gap-3">
            {statusLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-indigo-500" />
                <span className="text-sm text-slate-600 dark:text-slate-400">
                  {t('settings.footer.status.checking')}
                </span>
              </>
            ) : systemStatus ? (
              <>
                <div
                  className={`w-3 h-3 rounded-full ${systemStatus.status === 'ready' ? 'bg-emerald-500 shadow-md shadow-emerald-500/20' : 'bg-amber-500 shadow-md shadow-amber-500/20'}`}
                ></div>
                <span
                  className={`text-sm font-bold ${systemStatus.status === 'ready' ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`}
                >
                  {systemStatus.status === 'ready'
                    ? t('settings.footer.status.ready')
                    : t('settings.footer.status.setupRequired')}
                </span>
              </>
            ) : (
              <span className="text-sm text-slate-500 dark:text-slate-500">
                {t('settings.footer.status.offline')}
              </span>
            )}
          </div>
        </div>
      </main>

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
