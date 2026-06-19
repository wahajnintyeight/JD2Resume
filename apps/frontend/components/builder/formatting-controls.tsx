'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronUp, RotateCcw } from 'lucide-react';
import {
  type TemplateSettings,
  type TemplateType,
  type PageSize,
  type SpacingLevel,
  type HeaderFontFamily,
  type BodyFontFamily,
  type AccentColor,
  DEFAULT_TEMPLATE_SETTINGS,
  SECTION_SPACING_MAP,
  ITEM_SPACING_MAP,
  LINE_HEIGHT_MAP,
  FONT_SIZE_MAP,
  HEADER_SCALE_MAP,
  COMPACT_MULTIPLIER,
  COMPACT_LINE_HEIGHT_MULTIPLIER,
  TEMPLATE_OPTIONS,
  PAGE_SIZE_INFO,
  ACCENT_COLOR_MAP,
} from '@/lib/types/template-settings';
import { TemplateThumbnail } from './template-selector';
import { useTranslations } from '@/lib/i18n';

interface FormattingControlsProps {
  settings: TemplateSettings;
  onChange: (settings: TemplateSettings) => void;
}

export const FormattingControls: React.FC<FormattingControlsProps> = ({ settings, onChange }) => {
  const { t } = useTranslations();
  const [isExpanded, setIsExpanded] = useState(true);
  const compactMultiplier = settings.compactMode ? COMPACT_MULTIPLIER : 1;
  const sectionGapRem =
    parseFloat(SECTION_SPACING_MAP[settings.spacing.section]) * compactMultiplier;
  const itemGapRem = parseFloat(ITEM_SPACING_MAP[settings.spacing.item]) * compactMultiplier;
  const lineHeightValue = settings.compactMode
    ? LINE_HEIGHT_MAP[settings.spacing.lineHeight] * COMPACT_LINE_HEIGHT_MULTIPLIER
    : LINE_HEIGHT_MAP[settings.spacing.lineHeight];

  const formatRem = (value: number) =>
    `${value.toFixed(2).replace(/\.00$/, '').replace(/0$/, '')}rem`;

  const handleTemplateChange = (template: TemplateType) => {
    onChange({ ...settings, template });
  };

  const handlePageSizeChange = (pageSize: PageSize) => {
    onChange({ ...settings, pageSize });
  };

  const handleMarginChange = (key: keyof TemplateSettings['margins'], value: number) => {
    onChange({
      ...settings,
      margins: { ...settings.margins, [key]: value },
    });
  };

  const handleSpacingChange = (key: keyof TemplateSettings['spacing'], value: SpacingLevel) => {
    onChange({
      ...settings,
      spacing: { ...settings.spacing, [key]: value },
    });
  };

  const handleFontChange = (key: keyof TemplateSettings['fontSize'], value: SpacingLevel) => {
    onChange({
      ...settings,
      fontSize: { ...settings.fontSize, [key]: value },
    });
  };

  const handleHeaderFontChange = (headerFont: HeaderFontFamily) => {
    onChange({
      ...settings,
      fontSize: { ...settings.fontSize, headerFont },
    });
  };

  const handleBodyFontChange = (bodyFont: BodyFontFamily) => {
    onChange({
      ...settings,
      fontSize: { ...settings.fontSize, bodyFont },
    });
  };

  const handleCompactModeToggle = () => {
    onChange({ ...settings, compactMode: !settings.compactMode });
  };

  const handleShowContactIconsToggle = () => {
    onChange({ ...settings, showContactIcons: !settings.showContactIcons });
  };

  const handleAccentColorChange = (accentColor: AccentColor) => {
    onChange({ ...settings, accentColor });
  };

  const handleReset = () => {
    onChange(DEFAULT_TEMPLATE_SETTINGS);
  };

  const templateLabels = React.useMemo(
    () => ({
      'swiss-single': {
        name: t('builder.formatting.templates.swissSingle.name'),
        description: t('builder.formatting.templates.swissSingle.description'),
      },
      'swiss-two-column': {
        name: t('builder.formatting.templates.swissTwoColumn.name'),
        description: t('builder.formatting.templates.swissTwoColumn.description'),
      },
      modern: {
        name: t('builder.formatting.templates.modern.name'),
        description: t('builder.formatting.templates.modern.description'),
      },
      'modern-two-column': {
        name: t('builder.formatting.templates.modernTwoColumn.name'),
        description: t('builder.formatting.templates.modernTwoColumn.description'),
      },
      'classic-ats': {
        name: t('builder.formatting.templates.classicAts.name'),
        description: t('builder.formatting.templates.classicAts.description'),
      },
    }),
    [t]
  );

  const getFontLabel = (font: HeaderFontFamily | BodyFontFamily) => {
    if (font === 'sans-serif') return t('builder.formatting.fontNames.sans');
    if (font === 'serif') return t('builder.formatting.fontNames.serif');
    return t('builder.formatting.fontNames.mono');
  };

  return (
    <div className="relative mb-6 rounded-lg overflow-hidden bg-gradient-to-br from-slate-900/95 via-slate-800/95 to-slate-900/95 backdrop-blur-sm border border-white/5 shadow-[0_8px_32px_rgba(0,0,0,0.4)]">
      {/* Ambient glow effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-purple-500/5 pointer-events-none" />

      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="relative w-full flex items-center justify-between px-5 py-4 group transition-all duration-300 hover:bg-white/[0.02]"
      >
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-1.5 h-1.5 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
            <div className="absolute inset-0 w-1.5 h-1.5 rounded-full bg-blue-400 animate-ping opacity-20" />
          </div>
          <span className="font-['Geist_Mono',_'JetBrains_Mono',_monospace] text-[11px] font-semibold uppercase tracking-[0.15em] text-slate-300 group-hover:text-white transition-colors">
            {t('builder.formatting.panelTitle')}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="font-['Geist_Mono',_monospace] text-[10px] text-slate-500 uppercase tracking-wider">
            {isExpanded ? 'Collapse' : 'Expand'}
          </span>
          {isExpanded ? (
            <ChevronUp className="w-4 h-4 text-slate-400 group-hover:text-slate-200 transition-colors" />
          ) : (
            <ChevronDown className="w-4 h-4 text-slate-400 group-hover:text-slate-200 transition-colors" />
          )}
        </div>
      </button>

      {/* Expandable Content */}
      {isExpanded && (
        <div className="relative border-t border-white/5 px-5 py-6 space-y-8 animate-in fade-in slide-in-from-top-2 duration-300">
          {/* Template Selection */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
              <h4 className="font-['Geist',_system-ui] text-xs font-medium uppercase tracking-[0.12em] text-slate-400">
                {t('builder.formatting.template')}
              </h4>
              <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
            </div>
            <div className="grid grid-cols-5 gap-2.5">
              {TEMPLATE_OPTIONS.map((template) => (
                <button
                  key={template.id}
                  onClick={() => handleTemplateChange(template.id)}
                  className={`group relative flex flex-col items-center p-3 rounded-md transition-all duration-300 ${
                    settings.template === template.id
                      ? 'bg-gradient-to-br from-blue-500/20 to-blue-600/10 ring-1 ring-blue-400/40 shadow-[0_0_20px_rgba(59,130,246,0.15)]'
                      : 'bg-white/[0.02] hover:bg-white/[0.05] ring-1 ring-white/5 hover:ring-white/10'
                  }`}
                  title={templateLabels[template.id].description}
                >
                  <div className="w-14 h-20 mb-2 flex items-center justify-center">
                    <TemplateThumbnail
                      type={template.id}
                      isActive={settings.template === template.id}
                    />
                  </div>
                  <span
                    className={`font-['Geist_Mono',_monospace] text-[9px] uppercase tracking-wider font-semibold text-center leading-tight transition-colors ${
                      settings.template === template.id
                        ? 'text-blue-300'
                        : 'text-slate-400 group-hover:text-slate-300'
                    }`}
                  >
                    {templateLabels[template.id].name}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Accent Color Selection */}
          {(settings.template === 'modern' || settings.template === 'modern-two-column') && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                <h4 className="font-['Geist',_system-ui] text-xs font-medium uppercase tracking-[0.12em] text-slate-400">
                  {t('builder.formatting.accentColor')}
                </h4>
                <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
              </div>
              <div className="flex flex-wrap gap-2">
                {(Object.keys(ACCENT_COLOR_MAP) as AccentColor[]).map((color) => (
                  <button
                    key={color}
                    onClick={() => handleAccentColorChange(color)}
                    className={`group flex items-center gap-2.5 px-3.5 py-2 rounded-md font-['Geist',_system-ui] text-xs transition-all duration-300 ${
                      settings.accentColor === color
                        ? 'bg-white/10 ring-1 ring-white/20 shadow-lg'
                        : 'bg-white/[0.02] ring-1 ring-white/5 hover:bg-white/[0.05] hover:ring-white/10'
                    }`}
                    title={t(`builder.formatting.accentColors.${color}`)}
                  >
                    <span
                      className="w-5 h-5 rounded-sm ring-1 ring-white/20 shadow-inner transition-transform group-hover:scale-110"
                      style={{ backgroundColor: ACCENT_COLOR_MAP[color].primary }}
                    />
                    <span
                      className={
                        settings.accentColor === color ? 'text-white font-medium' : 'text-slate-400'
                      }
                    >
                      {t(`builder.formatting.accentColors.${color}`)}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Page Size Selection */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
              <h4 className="font-['Geist',_system-ui] text-xs font-medium uppercase tracking-[0.12em] text-slate-400">
                {t('builder.formatting.pageSize')}
              </h4>
              <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              {(Object.keys(PAGE_SIZE_INFO) as PageSize[]).map((size) => (
                <button
                  key={size}
                  onClick={() => handlePageSizeChange(size)}
                  className={`group px-4 py-3 rounded-md font-['Geist',_system-ui] text-sm transition-all duration-300 ${
                    settings.pageSize === size
                      ? 'bg-gradient-to-br from-blue-500/20 to-blue-600/10 ring-1 ring-blue-400/40 text-blue-200 shadow-[0_0_20px_rgba(59,130,246,0.15)]'
                      : 'bg-white/[0.02] ring-1 ring-white/5 text-slate-400 hover:bg-white/[0.05] hover:ring-white/10 hover:text-slate-300'
                  }`}
                  title={PAGE_SIZE_INFO[size].dimensions}
                >
                  <div className="font-semibold">
                    {size === 'A4' ? 'A4' : t('builder.pageSize.usLetter')}
                  </div>
                  <div className="text-[10px] opacity-60 mt-0.5">
                    {PAGE_SIZE_INFO[size].dimensions}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Margins Section */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
              <h4 className="font-['Geist',_system-ui] text-xs font-medium uppercase tracking-[0.12em] text-slate-400">
                {t('builder.formatting.margins')}
              </h4>
              <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <MarginSlider
                label={t('builder.formatting.margin.top')}
                value={settings.margins.top}
                onChange={(v) => handleMarginChange('top', v)}
              />
              <MarginSlider
                label={t('builder.formatting.margin.bottom')}
                value={settings.margins.bottom}
                onChange={(v) => handleMarginChange('bottom', v)}
              />
              <MarginSlider
                label={t('builder.formatting.margin.left')}
                value={settings.margins.left}
                onChange={(v) => handleMarginChange('left', v)}
              />
              <MarginSlider
                label={t('builder.formatting.margin.right')}
                value={settings.margins.right}
                onChange={(v) => handleMarginChange('right', v)}
              />
            </div>
          </div>

          {/* Spacing Section */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
              <h4 className="font-['Geist',_system-ui] text-xs font-medium uppercase tracking-[0.12em] text-slate-400">
                {t('builder.formatting.spacing')}
              </h4>
              <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
            </div>
            <div className="space-y-3">
              <SpacingSelector
                label={t('builder.formatting.spacingSection')}
                value={settings.spacing.section}
                onChange={(v) => handleSpacingChange('section', v)}
              />
              <SpacingSelector
                label={t('builder.formatting.spacingItems')}
                value={settings.spacing.item}
                onChange={(v) => handleSpacingChange('item', v)}
              />
              <SpacingSelector
                label={t('builder.formatting.spacingLines')}
                value={settings.spacing.lineHeight}
                onChange={(v) => handleSpacingChange('lineHeight', v)}
              />
            </div>
          </div>

          {/* Font Size Section */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
              <h4 className="font-['Geist',_system-ui] text-xs font-medium uppercase tracking-[0.12em] text-slate-400">
                {t('builder.formatting.fontSize')}
              </h4>
              <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
            </div>
            <div className="space-y-3">
              <SpacingSelector
                label={t('builder.formatting.baseFontSize')}
                value={settings.fontSize.base}
                onChange={(v) => handleFontChange('base', v)}
              />
              <SpacingSelector
                label={t('builder.formatting.headerScale')}
                value={settings.fontSize.headerScale}
                onChange={(v) => handleFontChange('headerScale', v)}
              />

              {/* Header Font Family */}
              <div className="flex items-center gap-3">
                <span className="font-['Geist',_system-ui] text-xs text-slate-400 w-24 shrink-0">
                  {t('builder.formatting.headerFontFamily')}
                </span>
                <div className="flex gap-1.5">
                  {(['serif', 'sans-serif', 'mono'] as HeaderFontFamily[]).map((font) => (
                    <button
                      key={font}
                      onClick={() => handleHeaderFontChange(font)}
                      className={`px-3 py-1.5 rounded-md font-['Geist',_system-ui] text-xs transition-all duration-300 ${
                        settings.fontSize.headerFont === font
                          ? 'bg-gradient-to-br from-blue-500/20 to-blue-600/10 ring-1 ring-blue-400/40 text-blue-200 shadow-[0_0_12px_rgba(59,130,246,0.2)]'
                          : 'bg-white/[0.02] ring-1 ring-white/5 text-slate-400 hover:bg-white/[0.05] hover:ring-white/10'
                      }`}
                      style={{
                        fontFamily:
                          font === 'serif'
                            ? 'Georgia, serif'
                            : font === 'mono'
                              ? 'monospace'
                              : 'system-ui, sans-serif',
                      }}
                    >
                      {getFontLabel(font)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Body Font Family */}
              <div className="flex items-center gap-3">
                <span className="font-['Geist',_system-ui] text-xs text-slate-400 w-24 shrink-0">
                  {t('builder.formatting.bodyFontFamily')}
                </span>
                <div className="flex gap-1.5">
                  {(['serif', 'sans-serif', 'mono'] as BodyFontFamily[]).map((font) => (
                    <button
                      key={font}
                      onClick={() => handleBodyFontChange(font)}
                      className={`px-3 py-1.5 rounded-md font-['Geist',_system-ui] text-xs transition-all duration-300 ${
                        settings.fontSize.bodyFont === font
                          ? 'bg-gradient-to-br from-blue-500/20 to-blue-600/10 ring-1 ring-blue-400/40 text-blue-200 shadow-[0_0_12px_rgba(59,130,246,0.2)]'
                          : 'bg-white/[0.02] ring-1 ring-white/5 text-slate-400 hover:bg-white/[0.05] hover:ring-white/10'
                      }`}
                      style={{
                        fontFamily:
                          font === 'serif'
                            ? 'Georgia, serif'
                            : font === 'mono'
                              ? 'monospace'
                              : 'system-ui, sans-serif',
                      }}
                    >
                      {getFontLabel(font)}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Options Section */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
              <h4 className="font-['Geist',_system-ui] text-xs font-medium uppercase tracking-[0.12em] text-slate-400">
                {t('builder.formatting.options')}
              </h4>
              <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
            </div>
            <div className="space-y-3">
              {/* Compact Mode Toggle */}
              <label className="flex items-center justify-between cursor-pointer group px-3 py-2.5 rounded-md bg-white/[0.02] hover:bg-white/[0.04] transition-colors">
                <span className="font-['Geist',_system-ui] text-sm text-slate-300 group-hover:text-white transition-colors">
                  {t('builder.formatting.compactMode')}
                </span>
                <button
                  onClick={handleCompactModeToggle}
                  className={`relative w-11 h-6 rounded-full transition-all duration-300 ${
                    settings.compactMode
                      ? 'bg-gradient-to-r from-blue-500 to-blue-600 shadow-[0_0_12px_rgba(59,130,246,0.4)]'
                      : 'bg-slate-700 ring-1 ring-white/10'
                  }`}
                >
                  <span
                    className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow-lg transition-all duration-300 ${
                      settings.compactMode ? 'left-6' : 'left-1'
                    }`}
                  />
                </button>
              </label>

              {/* Show Contact Icons Toggle */}
              <label className="flex items-center justify-between cursor-pointer group px-3 py-2.5 rounded-md bg-white/[0.02] hover:bg-white/[0.04] transition-colors">
                <span className="font-['Geist',_system-ui] text-sm text-slate-300 group-hover:text-white transition-colors">
                  {t('builder.formatting.contactIcons')}
                </span>
                <button
                  onClick={handleShowContactIconsToggle}
                  className={`relative w-11 h-6 rounded-full transition-all duration-300 ${
                    settings.showContactIcons
                      ? 'bg-gradient-to-r from-blue-500 to-blue-600 shadow-[0_0_12px_rgba(59,130,246,0.4)]'
                      : 'bg-slate-700 ring-1 ring-white/10'
                  }`}
                >
                  <span
                    className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow-lg transition-all duration-300 ${
                      settings.showContactIcons ? 'left-6' : 'left-1'
                    }`}
                  />
                </button>
              </label>
            </div>
          </div>

          {/* Summary & Reset */}
          <div className="pt-4 border-t border-white/5 space-y-4">
            <div className="px-3 py-3 rounded-md bg-white/[0.02] ring-1 ring-white/5">
              <h4 className="font-['Geist_Mono',_monospace] text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-2.5">
                {t('builder.formatting.effectiveOutput')}
              </h4>
              <div className="font-['Geist_Mono',_monospace] text-[10px] text-slate-400 space-y-1.5 leading-relaxed">
                <div>
                  {t('builder.formatting.effectiveMargins', {
                    top: settings.margins.top,
                    bottom: settings.margins.bottom,
                    left: settings.margins.left,
                    right: settings.margins.right,
                  })}
                </div>
                <div>
                  {t('builder.formatting.effectiveSectionGap')}: {formatRem(sectionGapRem)}
                </div>
                <div>
                  {t('builder.formatting.effectiveItemGap')}: {formatRem(itemGapRem)}
                </div>
                <div>
                  {t('builder.formatting.effectiveLineHeight')}: {lineHeightValue.toFixed(2)}
                </div>
                <div>
                  {t('builder.formatting.effectiveBaseFont')}:{' '}
                  {FONT_SIZE_MAP[settings.fontSize.base]}
                </div>
                <div>
                  {t('builder.formatting.effectiveHeaderScale')}:{' '}
                  {HEADER_SCALE_MAP[settings.fontSize.headerScale]}x
                </div>
                <div>
                  {t('builder.formatting.effectiveHeaderFont')}:{' '}
                  {getFontLabel(settings.fontSize.headerFont)}
                </div>
                <div>
                  {t('builder.formatting.effectiveBodyFont')}:{' '}
                  {getFontLabel(settings.fontSize.bodyFont)}
                </div>
              </div>
              {settings.compactMode && (
                <div className="font-['Geist',_system-ui] text-[10px] text-slate-500 mt-3 italic">
                  {t('builder.formatting.compactHint')}
                </div>
              )}
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={handleReset}
              className="w-full bg-white/[0.02] hover:bg-white/[0.05] border-white/10 hover:border-white/20 text-slate-300 hover:text-white transition-all duration-300"
            >
              <RotateCcw className="w-3.5 h-3.5 mr-2" />
              {t('builder.formatting.resetDefaults')}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

interface MarginSliderProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
}

const MarginSlider: React.FC<MarginSliderProps> = ({ label, value, onChange }) => {
  return (
    <div className="flex items-center gap-3">
      <span className="font-['Geist',_system-ui] text-xs text-slate-400 w-14 shrink-0">
        {label}
      </span>
      <input
        type="range"
        min={5}
        max={25}
        value={value}
        onChange={(e) => onChange(parseInt(e.target.value, 10))}
        className="flex-1 h-1.5 bg-slate-700/50 rounded-full appearance-none cursor-pointer
                   [&::-webkit-slider-thumb]:appearance-none
                   [&::-webkit-slider-thumb]:w-4
                   [&::-webkit-slider-thumb]:h-4
                   [&::-webkit-slider-thumb]:rounded-full
                   [&::-webkit-slider-thumb]:bg-gradient-to-br
                   [&::-webkit-slider-thumb]:from-blue-400
                   [&::-webkit-slider-thumb]:to-blue-600
                   [&::-webkit-slider-thumb]:shadow-[0_0_8px_rgba(59,130,246,0.5)]
                   [&::-webkit-slider-thumb]:cursor-pointer
                   [&::-webkit-slider-thumb]:transition-all
                   [&::-webkit-slider-thumb]:hover:scale-110
                   [&::-moz-range-thumb]:w-4
                   [&::-moz-range-thumb]:h-4
                   [&::-moz-range-thumb]:rounded-full
                   [&::-moz-range-thumb]:bg-gradient-to-br
                   [&::-moz-range-thumb]:from-blue-400
                   [&::-moz-range-thumb]:to-blue-600
                   [&::-moz-range-thumb]:border-none
                   [&::-moz-range-thumb]:cursor-pointer"
      />
      <span className="font-['Geist_Mono',_monospace] text-xs w-8 text-right text-slate-300 font-semibold">
        {value}
      </span>
    </div>
  );
};

interface SpacingSelectorProps {
  label: string;
  value: SpacingLevel;
  onChange: (value: SpacingLevel) => void;
}

const SpacingSelector: React.FC<SpacingSelectorProps> = ({ label, value, onChange }) => {
  const levels: SpacingLevel[] = [1, 2, 3, 4, 5];

  return (
    <div className="flex items-center gap-3">
      <span className="font-['Geist',_system-ui] text-xs text-slate-400 w-24 shrink-0">
        {label}
      </span>
      <div className="flex gap-1.5">
        {levels.map((level) => (
          <button
            key={level}
            onClick={() => onChange(level)}
            className={`w-8 h-8 rounded-md font-['Geist_Mono',_monospace] text-xs font-semibold transition-all duration-300 ${
              value === level
                ? 'bg-gradient-to-br from-blue-500/20 to-blue-600/10 ring-1 ring-blue-400/40 text-blue-200 shadow-[0_0_12px_rgba(59,130,246,0.2)]'
                : 'bg-white/[0.02] ring-1 ring-white/5 text-slate-400 hover:bg-white/[0.05] hover:ring-white/10 hover:text-slate-300'
            }`}
          >
            {level}
          </button>
        ))}
      </div>
    </div>
  );
};

export default FormattingControls;
