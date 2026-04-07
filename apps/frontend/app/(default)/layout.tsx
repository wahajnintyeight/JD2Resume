'use client';

import React from 'react';
import { ResumePreviewProvider } from '@/components/common/resume_previewer_context';
import { StatusCacheProvider } from '@/lib/context/status-cache';
import { LanguageProvider } from '@/lib/context/language-context';
import { LocalizedErrorBoundary } from '@/components/common/error-boundary';
import UserPanelShell from '@/components/auth/user-panel-shell';

export default function DefaultLayout({ children }: { children: React.ReactNode }) {
  return (
    <UserPanelShell>
      <StatusCacheProvider>
        <LanguageProvider>
          <ResumePreviewProvider>
            <LocalizedErrorBoundary>{children}</LocalizedErrorBoundary>
          </ResumePreviewProvider>
        </LanguageProvider>
      </StatusCacheProvider>
    </UserPanelShell>
  );
}
