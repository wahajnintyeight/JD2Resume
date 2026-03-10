'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

interface LuxuryTabsProps {
  tabs: {
    id: string;
    label: string;
    disabled?: boolean;
  }[];
  activeTab: string;
  onTabChange: (id: string) => void;
  className?: string;
}

export function LuxuryTabs({ tabs, activeTab, onTabChange, className }: LuxuryTabsProps) {
  return (
    <div className={cn('flex items-center gap-1 p-1 bg-white/[0.03] border border-white/5 rounded-full backdrop-blur-xl', className)}>
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            disabled={tab.disabled}
            onClick={() => onTabChange(tab.id)}
            className={cn(
              'relative px-6 py-2 text-sm font-medium transition-all duration-300 rounded-full outline-none',
              isActive 
                ? 'text-white shadow-lg shadow-indigo-500/20' 
                : 'text-white/40 hover:text-white/60 hover:bg-white/5',
              tab.disabled && 'opacity-20 cursor-not-allowed grayscale'
            )}
          >
            {isActive && (
              <div className="absolute inset-0 bg-indigo-600 rounded-full -z-10" />
            )}
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
