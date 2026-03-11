'use client';

import React, { useRef, useState, useCallback, useEffect } from 'react';
import { ZoomIn, ZoomOut, Eye, EyeOff, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Resume, { type ResumeData } from '@/components/dashboard/resume-component';
import { type TemplateSettings } from '@/lib/types/template-settings';
import { PageContainer } from './page-container';
import { usePagination } from './use-pagination';
import { PAGE_DIMENSIONS, mmToPx, getContentAreaPx } from '@/lib/constants/page-dimensions';
import { useTranslations } from '@/lib/i18n';

interface PaginatedPreviewProps {
  resumeData: ResumeData;
  settings: TemplateSettings;
}

const MIN_ZOOM = 0.4;
const MAX_ZOOM = 1.5;
const ZOOM_STEP = 0.1;

/**
 * PaginatedPreview shows a WYSIWYG preview of the resume with actual page dimensions,
 * margin guides, and automatic pagination.
 */
export function PaginatedPreview({ resumeData, settings }: PaginatedPreviewProps) {
  const { t } = useTranslations();
  const measurementRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(0.6);
  const [showMargins, setShowMargins] = useState(false);
  const [autoZoom, setAutoZoom] = useState(true);
  const resumeSettings: TemplateSettings = {
    ...settings,
    margins: { top: 0, bottom: 0, left: 0, right: 0 },
  };

  const additionalSectionLabels = React.useMemo(
    () => ({
      technicalSkills: t('resume.additionalLabels.technicalSkills'),
      languages: t('resume.additionalLabels.languages'),
      certifications: t('resume.additionalLabels.certifications'),
      awards: t('resume.additionalLabels.awards'),
    }),
    [t]
  );
  const sectionHeadings = React.useMemo(
    () => ({
      summary: t('resume.sections.summary'),
      experience: t('resume.sections.experience'),
      education: t('resume.sections.education'),
      projects: t('resume.sections.projects'),
      certifications: t('resume.sections.certifications'),
      skills: t('resume.sections.skillsOnly'),
      languages: t('resume.sections.languages'),
      awards: t('resume.sections.awards'),
      links: t('resume.sections.links'),
    }),
    [t]
  );
  const fallbackLabels = React.useMemo(
    () => ({
      name: t('resume.defaults.name'),
    }),
    [t]
  );

  const { pages, isCalculating } = usePagination({
    pageSize: settings.pageSize,
    margins: settings.margins,
    measurementRef,
  });

  // Calculate auto-zoom to fit container width
  const calculateAutoZoom = useCallback(() => {
    if (!containerRef.current || !autoZoom) return;

    const containerWidth = containerRef.current.clientWidth - 48; // Padding
    const pageWidthPx = mmToPx(PAGE_DIMENSIONS[settings.pageSize].width);
    const optimalZoom = Math.min(containerWidth / pageWidthPx, MAX_ZOOM);
    setZoom(Math.max(MIN_ZOOM, Math.min(optimalZoom, 0.75))); // Cap at 75% for usability
  }, [settings.pageSize, autoZoom]);

  // Auto-zoom on mount and when page size changes
  useEffect(() => {
    calculateAutoZoom();
    // Add resize listener
    const handleResize = () => calculateAutoZoom();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [calculateAutoZoom]);

  const handleZoomIn = () => {
    setAutoZoom(false);
    setZoom((z) => Math.min(z + ZOOM_STEP, MAX_ZOOM));
  };

  const handleZoomOut = () => {
    setAutoZoom(false);
    setZoom((z) => Math.max(z - ZOOM_STEP, MIN_ZOOM));
  };

  const toggleMargins = () => setShowMargins((s) => !s);

  // Get content area dimensions for the hidden measurement container
  const contentArea = getContentAreaPx(settings.pageSize, settings.margins);

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Controls bar */}
      <div className="max-w-[800px] mx-auto w-full mb-8 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2 p-1 bg-zinc-900 rounded-xl border border-zinc-800 shadow-sm">
          <button
            onClick={handleZoomOut}
            disabled={zoom <= MIN_ZOOM}
            className="p-2 text-zinc-500 hover:text-white transition-colors disabled:opacity-30"
          >
            <ZoomOut size={16} />
          </button>
          <span className="px-2 text-xs font-bold text-zinc-400">
            {Math.round(zoom * 100)}%
          </span>
          <button
            onClick={handleZoomIn}
            disabled={zoom >= MAX_ZOOM}
            className="p-2 text-zinc-500 hover:text-white transition-colors disabled:opacity-30"
          >
            <ZoomIn size={16} />
          </button>
          <div className="w-px h-4 bg-zinc-800 mx-1" />
          <button
            onClick={toggleMargins}
            className={`flex items-center gap-2 px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${
              showMargins ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:bg-zinc-800'
            }`}
          >
            {showMargins ? <Eye size={14} /> : <EyeOff size={14} />}
            {t('preview.margins')}
          </button>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-xs font-bold text-zinc-600 uppercase tracking-widest">
            {isCalculating
              ? t('preview.calculating')
              : `Page ${pages.length} of ${pages.length}`}
          </span>
        </div>
      </div>

      {/* Scrollable preview area */}
      <div
        ref={containerRef}
        className="flex-1 overflow-auto"
      >
        {/* Hidden measurement container - renders content at actual size */}
        <div
          ref={measurementRef}
          className="absolute opacity-0 pointer-events-none"
          style={{
            width: contentArea.width,
            left: -9999,
            top: 0,
          }}
          aria-hidden="true"
        >
          <Resume
            resumeData={resumeData}
            template={settings.template}
            settings={resumeSettings}
            additionalSectionLabels={additionalSectionLabels}
            sectionHeadings={sectionHeadings}
            fallbackLabels={fallbackLabels}
          />
        </div>

        {/* Visible pages */}
        <div className="max-w-[800px] mx-auto flex flex-col items-center gap-4">
          {pages.map((page, index) => (
            <React.Fragment key={page.pageNumber}>
              {index > 0 && (
                <div className="flex items-center gap-2 py-2">
                  <div className="h-px w-8 bg-zinc-600" />
                  <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-bold">
                    {t('preview.pageBreak')}
                  </span>
                  <div className="h-px w-8 bg-zinc-600" />
                </div>
              )}
              <PageContainer
                pageSize={settings.pageSize}
                margins={settings.margins}
                pageNumber={page.pageNumber}
                totalPages={pages.length}
                scale={zoom}
                showMarginGuides={showMargins}
                contentOffset={page.contentOffset}
                contentEnd={page.contentEnd}
              >
                <Resume
                  resumeData={resumeData}
                  template={settings.template}
                  settings={resumeSettings}
                  additionalSectionLabels={additionalSectionLabels}
                  sectionHeadings={sectionHeadings}
                  fallbackLabels={fallbackLabels}
                />
              </PageContainer>
            </React.Fragment>
          ))}
        </div>
      </div>
    </div>
  );
}
