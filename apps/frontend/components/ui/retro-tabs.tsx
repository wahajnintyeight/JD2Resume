'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

/**
 * Modern Design Tabs Component
 *
 * Design Principles:
 * - Soft rounded containers
 * - Subtle background highlights for active states
 * - Clean sans-serif typography
 */

export interface Tab {
  id: string;
  label: string;
  disabled?: boolean;
}

export interface RetroTabsProps {
  tabs: Tab[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
  className?: string;
}

export const RetroTabs: React.FC<RetroTabsProps> = ({
  tabs,
  activeTab,
  onTabChange,
  className,
}) => {
  return (
    <div className={cn('flex items-center gap-1 p-1 bg-accent/30 rounded-2xl border border-border/20 backdrop-blur-sm', className)}>
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        const isDisabled = tab.disabled;

        return (
          <button
            key={tab.id}
            onClick={() => !isDisabled && onTabChange(tab.id)}
            disabled={isDisabled}
            className={cn(
              'relative px-5 py-2.5 text-sm font-semibold font-sans transition-all duration-300 rounded-xl select-none',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20',
              isActive && [
                'bg-white text-primary shadow-[0_4px_12px_rgba(0,0,0,0.05)] border border-border/10',
                'scale-[1.02]',
              ],
              !isActive &&
                !isDisabled && [
                  'text-muted-foreground hover:text-foreground hover:bg-white/50',
                ],
              isDisabled && ['text-muted-foreground/30 cursor-not-allowed opacity-50']
            )}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
};
