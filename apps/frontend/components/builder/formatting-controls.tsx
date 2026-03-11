'use client';

import React, { useState } from 'react';
import { ChevronDown, ChevronUp, RotateCcw, Settings, Palette, Type, Layout, Maximize2 } from 'lucide-react';
import {
  type TemplateSettings,
  type TemplateType,
  type PageSize,
  type SpacingLevel,
  type HeaderFontFamily,
  type BodyFontFamily,
  type AccentColor,
  DEFAULT_TEMPLATE_SETTINGS,
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
  const [expandedSections, setExpandedSections] = useState({
    template: true,
    pageSize: false,
    margins: false,
    spacing: false,
    fonts: false,
    options: false,
  });

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

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

  const SectionHeader = ({ icon: Icon, title, sectionKey, children }: { 
    icon: any, 
    title: string, 
    sectionKey: keyof typeof expandedSections,
    children: React.ReactNode 
  }) => (
    <div className="bg-zinc-900/30 rounded-3xl border border-zinc-800 shadow-sm">
      <button
        onClick={() => toggleSection(sectionKey)}
        className="w-full flex items-center justify-between p-6 hover:bg-zinc-900/50 transition-colors rounded-3xl"
      >
        <div className="flex items-center gap-3">
          <div className="p-2 bg-zinc-900 rounded-lg text-zinc-400 border border-zinc-800">
            <Icon size={18} />
          </div>
          <h3 className="text-lg font-semibold text-zinc-100 tracking-tight">{title}</h3>
        </div>
        {expandedSections[sectionKey] ? (
          <ChevronUp className="w-5 h-5 text-zinc-400" />
        ) : (
          <ChevronDown className="w-5 h-5 text-zinc-400" />
        )}
      </button>
      
      {expandedSections[sectionKey] && (
        <div className="px-6 pb-6 space-y-6">
          {children}
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Template Selection */}
      <SectionHeader icon={Layout} title={t('builder.formatting.template')} sectionKey="template">
        <div className="grid grid-cols-2 gap-3">
          {TEMPLATE_OPTIONS.map((template) => (
            <button
              key={template.id}
              onClick={() => handleTemplateChange(template.id)}
              className={`group flex flex-col items-center p-4 rounded-2xl border transition-all ${
                settings.template === template.id
                  ? 'border-indigo-500 bg-indigo-500/10 shadow-lg shadow-indigo-900/20'
                  : 'border-zinc-800 bg-zinc-900/50 hover:bg-zinc-900 hover:border-zinc-700'
              }`}
              title={templateLabels[template.id].description}
            >
              <div className="w-16 h-20 mb-3 flex items-center justify-center">
                <TemplateThumbnail
                  type={template.id}
                  isActive={settings.template === template.id}
                />
              </div>
              <span
                className={`text-xs font-bold uppercase tracking-widest ${
                  settings.template === template.id ? 'text-indigo-400' : 'text-zinc-400'
                }`}
              >
                {templateLabels[template.id].name}
              </span>
            </button>
          ))}
        </div>
      </SectionHeader>

      {/* Page Size Selection */}
      <SectionHeader icon={Maximize2} title={t('builder.formatting.pageSize')} sectionKey="pageSize">
        <div className="grid grid-cols-2 gap-3">
          {(Object.keys(PAGE_SIZE_INFO) as PageSize[]).map((size) => (
            <button
              key={size}
              onClick={() => handlePageSizeChange(size)}
              className={`px-4 py-3 rounded-xl border transition-all ${
                settings.pageSize === size
                  ? 'border-indigo-500 bg-indigo-500/10 text-indigo-400'
                  : 'border-zinc-800 bg-zinc-900/50 text-zinc-300 hover:bg-zinc-900'
              }`}
              title={PAGE_SIZE_INFO[size].dimensions}
            >
              <div className="font-bold text-sm">
                {size === 'A4' ? 'A4' : t('builder.pageSize.usLetter')}
              </div>
              <div className="text-xs opacity-70">{PAGE_SIZE_INFO[size].dimensions}</div>
            </button>
          ))}
        </div>
      </SectionHeader>

      {/* Margins Section */}
      <SectionHeader icon={Settings} title={t('builder.formatting.margins')} sectionKey="margins">
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
      </SectionHeader>

      {/* Spacing Section */}
      <SectionHeader icon={Layout} title={t('builder.formatting.spacing')} sectionKey="spacing">
        <div className="space-y-4">
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
      </SectionHeader>

      {/* Font Section */}
      <SectionHeader icon={Type} title={t('builder.formatting.fontSize')} sectionKey="fonts">
        <div className="space-y-4">
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
          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">
              {t('builder.formatting.headerFontFamily')}
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['serif', 'sans-serif', 'mono'] as HeaderFontFamily[]).map((font) => (
                <button
                  key={font}
                  onClick={() => handleHeaderFontChange(font)}
                  className={`px-3 py-2 text-sm rounded-xl border transition-all ${
                    settings.fontSize.headerFont === font
                      ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500'
                      : 'bg-zinc-900/50 text-zinc-300 border-zinc-800 hover:bg-zinc-900'
                  }`}
                >
                  {getFontLabel(font)}
                </button>
              ))}
            </div>
          </div>

          {/* Body Font Family */}
          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">
              {t('builder.formatting.bodyFontFamily')}
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['serif', 'sans-serif', 'mono'] as BodyFontFamily[]).map((font) => (
                <button
                  key={font}
                  onClick={() => handleBodyFontChange(font)}
                  className={`px-3 py-2 text-sm rounded-xl border transition-all ${
                    settings.fontSize.bodyFont === font
                      ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500'
                      : 'bg-zinc-900/50 text-zinc-300 border-zinc-800 hover:bg-zinc-900'
                  }`}
                >
                  {getFontLabel(font)}
                </button>
              ))}
            </div>
          </div>
        </div>
      </SectionHeader>

      {/* Options Section */}
      <SectionHeader icon={Settings} title={t('builder.formatting.options')} sectionKey="options">
        <div className="space-y-4">
          {/* Compact Mode Toggle */}
          <label className="flex items-center justify-between cursor-pointer p-3 bg-zinc-900/50 rounded-xl border border-zinc-800 hover:bg-zinc-900 transition-colors">
            <span className="text-sm font-medium text-zinc-300">
              {t('builder.formatting.compactMode')}
            </span>
            <button
              onClick={handleCompactModeToggle}
              className={`relative w-12 h-6 rounded-full transition-all ${
                settings.compactMode
                  ? 'bg-indigo-600'
                  : 'bg-zinc-700'
              }`}
            >
              <span
                className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition-all ${
                  settings.compactMode ? 'left-6' : 'left-0.5'
                }`}
              />
            </button>
          </label>

          {/* Show Contact Icons Toggle */}
          <label className="flex items-center justify-between cursor-pointer p-3 bg-zinc-900/50 rounded-xl border border-zinc-800 hover:bg-zinc-900 transition-colors">
            <span className="text-sm font-medium text-zinc-300">
              {t('builder.formatting.contactIcons')}
            </span>
            <button
              onClick={handleShowContactIconsToggle}
              className={`relative w-12 h-6 rounded-full transition-all ${
                settings.showContactIcons
                  ? 'bg-indigo-600'
                  : 'bg-zinc-700'
              }`}
            >
              <span
                className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition-all ${
                  settings.showContactIcons ? 'left-6' : 'left-0.5'
                }`}
              />
            </button>
          </label>
        </div>
      </SectionHeader>

      {/* Reset Button */}
      <button
        onClick={handleReset}
        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-zinc-900/50 text-zinc-300 rounded-xl border border-zinc-800 hover:bg-zinc-900 hover:text-indigo-400 transition-all"
      >
        <RotateCcw size={16} />
        <span className="font-medium">{t('builder.formatting.resetDefaults')}</span>
      </button>
    </div>
  );
};

/**
 * Margin Slider Component - Dark Theme
 */
interface MarginSliderProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
}

const MarginSlider: React.FC<MarginSliderProps> = ({ label, value, onChange }) => {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">
          {label}
        </label>
        <span className="text-sm font-bold text-zinc-300">{value}mm</span>
      </div>
      <input
        type="range"
        min={5}
        max={25}
        value={value}
        onChange={(e) => onChange(parseInt(e.target.value, 10))}
        className="w-full h-2 bg-zinc-800 rounded-full appearance-none cursor-pointer
                   [&::-webkit-slider-thumb]:appearance-none
                   [&::-webkit-slider-thumb]:w-4
                   [&::-webkit-slider-thumb]:h-4
                   [&::-webkit-slider-thumb]:bg-indigo-600
                   [&::-webkit-slider-thumb]:rounded-full
                   [&::-webkit-slider-thumb]:border-none
                   [&::-webkit-slider-thumb]:cursor-pointer
                   [&::-webkit-slider-thumb]:shadow-lg
                   [&::-moz-range-thumb]:w-4
                   [&::-moz-range-thumb]:h-4
                   [&::-moz-range-thumb]:bg-indigo-600
                   [&::-moz-range-thumb]:rounded-full
                   [&::-moz-range-thumb]:border-none
                   [&::-moz-range-thumb]:cursor-pointer"
      />
    </div>
  );
};

/**
 * Spacing Selector Component - Dark Theme
 */
interface SpacingSelectorProps {
  label: string;
  value: SpacingLevel;
  onChange: (value: SpacingLevel) => void;
}

const SpacingSelector: React.FC<SpacingSelectorProps> = ({ label, value, onChange }) => {
  const levels: SpacingLevel[] = [1, 2, 3, 4, 5];

  return (
    <div className="space-y-2">
      <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">
        {label}
      </label>
      <div className="grid grid-cols-5 gap-2">
        {levels.map((level) => (
          <button
            key={level}
            onClick={() => onChange(level)}
            className={`h-10 text-sm font-bold rounded-xl border transition-all ${
              value === level
                ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-900/40'
                : 'bg-zinc-900/50 text-zinc-300 border-zinc-800 hover:bg-zinc-900'
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