'use client';

import { Plus } from 'lucide-react';
import { useTranslations } from '@/lib/i18n';

interface ResumeCardProps {
  type: 'new' | 'existing';
  title?: string;
  lastEdited?: string;
  onClick?: () => void;
}

export const ResumeCard = ({ type, title, lastEdited, onClick }: ResumeCardProps) => {
  const { t } = useTranslations();
  const baseClasses =
    'aspect-[3/4] w-full border border-slate-100 transition-all duration-300 hover:shadow-xl hover:-translate-y-2 cursor-pointer flex flex-col p-6 bg-white rounded-2xl';

  if (type === 'new') {
    return (
      <button
        onClick={onClick}
        className={`${baseClasses} items-center justify-center group bg-slate-50/50 border-dashed border-2 border-slate-200 hover:bg-white hover:border-primary/30`}
      >
        <div className="w-14 h-14 rounded-2xl bg-white shadow-sm flex items-center justify-center text-slate-400 group-hover:text-primary group-hover:scale-110 transition-all">
          <Plus size={32} />
        </div>
        <span className="mt-6 font-bold text-slate-500 group-hover:text-primary tracking-tight">
          {t('dashboard.createNew')}
        </span>
      </button>
    );
  }

  return (
    <div onClick={onClick} className={baseClasses}>
      <div className="flex-1 bg-slate-50 rounded-xl mb-6 overflow-hidden relative group-hover:bg-slate-100/50 transition-colors">
        {/* Placeholder for resume preview */}
        <div className="absolute inset-0 flex items-center justify-center text-slate-300 font-sans text-xs font-bold uppercase tracking-widest opacity-50">
          {t('dashboard.preview')}
        </div>
      </div>
      <h3 className="font-bold text-lg leading-tight truncate text-slate-900">{title}</h3>
      {lastEdited && (
        <p className="text-[10px] text-slate-400 mt-2 font-bold uppercase tracking-wider">
          {t('dashboard.edited', { date: lastEdited })}
        </p>
      )}
    </div>
  );
};
