'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface SwissGridProps {
  children: React.ReactNode;
  title?: string;
  description?: string;
  headerContent?: React.ReactNode;
  contentClassName?: string;
  gridClassName?: string;
}

export const SwissGrid = ({
  children,
  title,
  description,
  headerContent,
  contentClassName,
  gridClassName,
}: SwissGridProps) => {
  return (
    <div className="flex h-full w-full items-start justify-center overflow-hidden bg-transparent">
      <div className="flex h-full w-full flex-col overflow-hidden bg-transparent">
        {(title || description || headerContent) && (
          <div className="relative z-20 shrink-0 px-4 pb-4 pt-4 sm:px-6 sm:pb-5 sm:pt-5 lg:px-8 lg:pb-6 lg:pt-6">
            <div className="rounded-[1.9rem] border border-white/70 bg-white/66 p-5 shadow-[0_20px_50px_rgba(15,23,42,0.08)] backdrop-blur-2xl sm:p-6 lg:p-7">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                <div className="min-w-0 space-y-2">
                  {title && (
                    <h1 className="font-sans text-[2rem] font-bold tracking-tight text-slate-950 sm:text-[2.5rem] lg:text-[3.25rem]">
                      {title}
                    </h1>
                  )}
                  {description && (
                    <p className="max-w-2xl text-sm leading-6 text-slate-500 sm:text-[15px]">
                      {description}
                    </p>
                  )}
                </div>
                {headerContent && <div className="min-w-0">{headerContent}</div>}
              </div>
            </div>
          </div>
        )}

        <div
          className={cn(
            'relative z-10 flex-1 overflow-y-auto overflow-x-hidden px-4 pb-5 sm:px-6 sm:pb-6 lg:px-8 lg:pb-8',
            contentClassName
          )}
        >
          <div
            className={cn(
              'grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 xl:grid-cols-3 2xl:grid-cols-4',
              gridClassName
            )}
          >
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};
