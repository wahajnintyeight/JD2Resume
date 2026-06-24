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

  const sectionLabelClassName =
    'font-mono text-[10px] font-bold uppercase tracking-wider text-[#4B5563]';

  return (
    <div className="relative mb-4 border-2 border-black bg-white shadow-[4px_4px_0px_0px_#000000]">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="relative flex w-full items-center justify-between border-b-2 border-black bg-[#F0F0E8] px-4 py-3 transition-colors hover:bg-[#E8E8E0]"
      >
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 bg-[#1D4ED8]" />
          <span className={`font-mono text-[11px] font-bold uppercase tracking-wider text-black`}>
            {t('builder.formatting.panelTitle')}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="font-mono text-[10px] uppercase tracking-wider text-[#4B5563]">
            {isExpanded ? 'Collapse' : 'Expand'}
          </span>
          {isExpanded ? (
            <ChevronUp className="h-4 w-4 text-black" />
          ) : (
            <ChevronDown className="h-4 w-4 text-black" />
          )}
        </div>
      </button>

      {isExpanded && (
        <div className="space-y-6 px-4 py-5">
          {/* Template Selection */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <h4 className={sectionLabelClassName}>{t('builder.formatting.template')}</h4>
              <div className="h-px flex-1 bg-black" />
            </div>
            <div className="grid grid-cols-5 gap-2">
              {TEMPLATE_OPTIONS.map((template) => (
                <button
                  key={template.id}
                  onClick={() => handleTemplateChange(template.id)}
                  className={`flex flex-col items-center border-2 p-2 transition-colors ${
                    settings.template === template.id
                      ? 'border-[#1D4ED8] bg-[#F0F0E8]'
                      : 'border-black bg-white hover:bg-[#F0F0E8]'
                  }`}
                  title={templateLabels[template.id].description}
                >
                  <div className="mb-1 flex h-20 w-14 items-center justify-center">
                    <TemplateThumbnail
                      type={template.id}
                      isActive={settings.template === template.id}
                    />
                  </div>
                  <span
                    className={`text-center font-mono text-[9px] font-bold uppercase leading-tight tracking-wider ${
                      settings.template === template.id ? 'text-[#1D4ED8]' : 'text-[#4B5563]'
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
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <h4 className={sectionLabelClassName}>{t('builder.formatting.accentColor')}</h4>
                <div className="h-px flex-1 bg-black" />
              </div>
              <div className="flex flex-wrap gap-2">
                {(Object.keys(ACCENT_COLOR_MAP) as AccentColor[]).map((color) => (
                  <button
                    key={color}
                    onClick={() => handleAccentColorChange(color)}
                    className={`flex items-center gap-2 border-2 px-3 py-1.5 font-mono text-xs transition-colors ${
                      settings.accentColor === color
                        ? 'border-[#1D4ED8] bg-[#F0F0E8]'
                        : 'border-black bg-white hover:bg-[#F0F0E8]'
                    }`}
                    title={t(`builder.formatting.accentColors.${color}`)}
                  >
                    <span
                      className="h-4 w-4 border border-black"
                      style={{ backgroundColor: ACCENT_COLOR_MAP[color].primary }}
                    />
                    <span
                      className={
                        settings.accentColor === color ? 'font-bold text-black' : 'text-[#4B5563]'
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
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <h4 className={sectionLabelClassName}>{t('builder.formatting.pageSize')}</h4>
              <div className="h-px flex-1 bg-black" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              {(Object.keys(PAGE_SIZE_INFO) as PageSize[]).map((size) => (
                <button
                  key={size}
                  onClick={() => handlePageSizeChange(size)}
                  className={`border-2 px-3 py-2 text-left font-mono text-sm transition-colors ${
                    settings.pageSize === size
                      ? 'border-[#1D4ED8] bg-[#F0F0E8] text-[#1D4ED8]'
                      : 'border-black bg-white text-[#4B5563] hover:bg-[#F0F0E8]'
                  }`}
                  title={PAGE_SIZE_INFO[size].dimensions}
                >
                  <div className="font-bold">
                    {size === 'A4' ? 'A4' : t('builder.pageSize.usLetter')}
                  </div>
                  <div className="mt-0.5 text-[10px] opacity-70">
                    {PAGE_SIZE_INFO[size].dimensions}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Margins Section */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <h4 className={sectionLabelClassName}>{t('builder.formatting.margins')}</h4>
              <div className="h-px flex-1 bg-black" />
            </div>
            <div className="grid grid-cols-2 gap-3">
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
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <h4 className={sectionLabelClassName}>{t('builder.formatting.spacing')}</h4>
              <div className="h-px flex-1 bg-black" />
            </div>
            <div className="space-y-2">
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
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <h4 className={sectionLabelClassName}>{t('builder.formatting.fontSize')}</h4>
              <div className="h-px flex-1 bg-black" />
            </div>
            <div className="space-y-2">
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

              <div className="flex items-center gap-3">
                <span className="w-24 shrink-0 font-mono text-xs text-[#4B5563]">
                  {t('builder.formatting.headerFontFamily')}
                </span>
                <div className="flex gap-1.5">
                  {(['serif', 'sans-serif', 'mono'] as HeaderFontFamily[]).map((font) => (
                    <button
                      key={font}
                      onClick={() => handleHeaderFontChange(font)}
                      className={`border-2 px-3 py-1.5 font-mono text-xs transition-colors ${
                        settings.fontSize.headerFont === font
                          ? 'border-[#1D4ED8] bg-[#1D4ED8] text-white'
                          : 'border-black bg-white text-[#4B5563] hover:bg-[#F0F0E8]'
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

              <div className="flex items-center gap-3">
                <span className="w-24 shrink-0 font-mono text-xs text-[#4B5563]">
                  {t('builder.formatting.bodyFontFamily')}
                </span>
                <div className="flex gap-1.5">
                  {(['serif', 'sans-serif', 'mono'] as BodyFontFamily[]).map((font) => (
                    <button
                      key={font}
                      onClick={() => handleBodyFontChange(font)}
                      className={`border-2 px-3 py-1.5 font-mono text-xs transition-colors ${
                        settings.fontSize.bodyFont === font
                          ? 'border-[#1D4ED8] bg-[#1D4ED8] text-white'
                          : 'border-black bg-white text-[#4B5563] hover:bg-[#F0F0E8]'
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
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <h4 className={sectionLabelClassName}>{t('builder.formatting.options')}</h4>
              <div className="h-px flex-1 bg-black" />
            </div>
            <div className="space-y-2">
              <label className="flex cursor-pointer items-center justify-between border border-black bg-[#F0F0E8] px-3 py-2 transition-colors hover:bg-[#E8E8E0]">
                <span className="font-mono text-xs text-black">
                  {t('builder.formatting.compactMode')}
                </span>
                <button
                  onClick={handleCompactModeToggle}
                  className={`relative h-5 w-10 border-2 border-black transition-colors ${
                    settings.compactMode ? 'bg-[#1D4ED8]' : 'bg-white'
                  }`}
                >
                  <span
                    className={`absolute top-0.5 h-3 w-3 bg-black transition-all ${
                      settings.compactMode ? 'left-[22px] bg-white' : 'left-0.5'
                    }`}
                  />
                </button>
              </label>

              <label className="flex cursor-pointer items-center justify-between border border-black bg-[#F0F0E8] px-3 py-2 transition-colors hover:bg-[#E8E8E0]">
                <span className="font-mono text-xs text-black">
                  {t('builder.formatting.contactIcons')}
                </span>
                <button
                  onClick={handleShowContactIconsToggle}
                  className={`relative h-5 w-10 border-2 border-black transition-colors ${
                    settings.showContactIcons ? 'bg-[#1D4ED8]' : 'bg-white'
                  }`}
                >
                  <span
                    className={`absolute top-0.5 h-3 w-3 bg-black transition-all ${
                      settings.showContactIcons ? 'left-[22px] bg-white' : 'left-0.5'
                    }`}
                  />
                </button>
              </label>
            </div>
          </div>

          {/* Summary & Reset */}
          <div className="space-y-3 border-t-2 border-black pt-4">
            <div className="border border-black bg-[#F0F0E8] p-3">
              <h4 className="mb-2 font-mono text-[10px] font-bold uppercase tracking-wider text-[#4B5563]">
                {t('builder.formatting.effectiveOutput')}
              </h4>
              <div className="space-y-1 font-mono text-[10px] leading-relaxed text-[#4B5563]">
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
                <div className="mt-2 text-[10px] italic text-[#4B5563]">
                  {t('builder.formatting.compactHint')}
                </div>
              )}
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={handleReset}
              className="w-full rounded-none border-2 border-black bg-white font-mono text-xs font-bold uppercase text-black shadow-[2px_2px_0px_0px_#000000] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none"
            >
              <RotateCcw className="mr-2 h-3.5 w-3.5" />
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
    <div className="flex items-center gap-2">
      <span className="w-14 shrink-0 font-mono text-xs text-[#4B5563]">{label}</span>
      <input
        type="range"
        min={5}
        max={25}
        value={value}
        onChange={(e) => onChange(parseInt(e.target.value, 10))}
        className="h-1.5 flex-1 cursor-pointer appearance-none bg-[#4B5563]
                   [&::-webkit-slider-thumb]:h-4
                   [&::-webkit-slider-thumb]:w-4
                   [&::-webkit-slider-thumb]:appearance-none
                   [&::-webkit-slider-thumb]:border-2
                   [&::-webkit-slider-thumb]:border-black
                   [&::-webkit-slider-thumb]:bg-[#1D4ED8]
                   [&::-webkit-slider-thumb]:cursor-pointer
                   [&::-moz-range-thumb]:h-4
                   [&::-moz-range-thumb]:w-4
                   [&::-moz-range-thumb]:border-2
                   [&::-moz-range-thumb]:border-black
                   [&::-moz-range-thumb]:bg-[#1D4ED8]
                   [&::-moz-range-thumb]:border-none
                   [&::-moz-range-thumb]:cursor-pointer"
      />
      <span className="w-8 text-right font-mono text-xs font-bold text-black">{value}</span>
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
      <span className="w-24 shrink-0 font-mono text-xs text-[#4B5563]">{label}</span>
      <div className="flex gap-1.5">
        {levels.map((level) => (
          <button
            key={level}
            onClick={() => onChange(level)}
            className={`h-8 w-8 border-2 font-mono text-xs font-bold transition-colors ${
              value === level
                ? 'border-[#1D4ED8] bg-[#1D4ED8] text-white'
                : 'border-black bg-white text-[#4B5563] hover:bg-[#F0F0E8]'
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
