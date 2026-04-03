'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useTranslations } from '@/lib/i18n';

export const SwissGrid = ({ children }: { children: React.ReactNode }) => {
  const { t } = useTranslations();

  return (
    // 1. Outer Wrapper: Clean modern background
    <div className="flex h-full w-full items-start justify-center overflow-hidden bg-background">
      {/* 2. The Main Container: Modern layout */}
      <div className="flex h-full w-full flex-col overflow-hidden bg-background">
        {/* Header Section */}
        <div className="p-8 md:p-12 shrink-0 bg-background relative z-30">
          <h1 className="font-sans text-4xl md:text-5xl font-bold text-foreground tracking-tight leading-tight">
            {t('nav.dashboard')}
          </h1>
          <p className="mt-2 text-sm font-sans text-muted-foreground max-w-md font-medium">
            {t('dashboard.selectModule')}
          </p>
        </div>

        {/* Content Grid - Scrollable area with modern spacing */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden relative z-10 px-8 md:px-12 pb-12">
          <div className="grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {children}
          </div>
        </div>

        {/* Footer - Modern design */}
        <div className="p-6 bg-card/50 backdrop-blur-sm flex justify-between items-center font-sans text-xs border-t border-border/50 shrink-0 relative z-30">
          <div className="flex items-center gap-2">
            <Image
              src="/logo.svg"
              alt="JD2Resume"
              width={20}
              height={20}
              className="w-5 h-5 opacity-80"
            />
            <span className="font-semibold text-muted-foreground uppercase tracking-wider">JD2Resume</span>
          </div>
        </div>
      </div>
    </div>
  );
};
