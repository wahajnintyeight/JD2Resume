'use client';

import { useState, useEffect } from 'react';
import { listMasterResumes, type MasterResume } from '@/lib/api/resume';
import { Dropdown } from '@/components/ui/dropdown';
import Loader2 from 'lucide-react/dist/esm/icons/loader-2';
import AlertTriangle from 'lucide-react/dist/esm/icons/alert-triangle';
import { useTranslations } from '@/lib/i18n';

interface MasterResumeSelectorProps {
  selectedResumeId: string | null;
  onSelect: (resumeId: string, category: string | null) => void;
  label?: string;
  required?: boolean;
}

export default function MasterResumeSelector({
  selectedResumeId,
  onSelect,
  label,
  required = false,
}: MasterResumeSelectorProps) {
  const { t } = useTranslations();
  const [masters, setMasters] = useState<MasterResume[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const displayLabel = label || t('tailor.selectMasterLabel') || 'Select Master Resume';

  useEffect(() => {
    const loadMasters = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await listMasterResumes();
        setMasters(response.masters);

        // Auto-select if only one master exists
        if (response.masters.length === 1 && !selectedResumeId) {
          onSelect(response.masters[0].resume_id, response.masters[0].master_category);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load master resumes');
      } finally {
        setLoading(false);
      }
    };

    loadMasters();
  }, []);

  const getCategoryDisplay = (category: string | null) => {
    return category || 'Default';
  };

  const getResumeLabel = (master: MasterResume) => {
    return master.personal_info?.name || master.filename || 'Unnamed Resume';
  };

  const getResumeDescription = (master: MasterResume) => {
    const category = getCategoryDisplay(master.master_category);
    const title = master.personal_info?.title;
    return title ? `${category} • ${title}` : category;
  };

  if (loading) {
    return (
      <div className="space-y-3">
        <label className="font-serif text-lg font-black uppercase tracking-tight text-slate-900 block px-1">
          {displayLabel}
          {required && <span className="ml-1 text-red-600">*</span>}
        </label>
        <div className="flex items-center gap-4 bg-white border border-slate-200 rounded-2xl px-5 py-4 shadow-sm">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
          <span className="font-sans text-sm text-slate-500 font-medium italic">
            {t('common.loading') || 'Loading master resumes...'}
          </span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-3">
        <label className="font-serif text-lg font-black uppercase tracking-tight text-slate-900 block px-1">
          {displayLabel}
          {required && <span className="ml-1 text-red-600">*</span>}
        </label>
        <div className="border border-red-200 bg-red-50 p-6 rounded-2xl flex items-center gap-4">
          <AlertTriangle className="h-6 w-6 text-red-600 shrink-0" />
          <p className="font-sans text-sm text-red-800 font-medium">{error}</p>
        </div>
      </div>
    );
  }

  if (masters.length === 0) {
    return (
      <div className="space-y-3">
        <label className="font-serif text-lg font-black uppercase tracking-tight text-slate-900 block px-1">
          {displayLabel}
          {required && <span className="ml-1 text-red-600">*</span>}
        </label>
        <div className="border-2 border-amber-200 bg-amber-50 p-6 rounded-2xl shadow-sm">
          <div className="flex items-start gap-4">
            <AlertTriangle className="mt-1 h-6 w-6 flex-shrink-0 text-amber-600" />
            <div>
              <h4 className="font-serif text-lg font-black uppercase tracking-tight text-amber-900">
                No master resume found
              </h4>
              <p className="mt-2 font-sans text-sm text-amber-800/80 font-medium leading-relaxed italic">
                {'// '}Please set at least one resume as master before tailoring. Go to the
                dashboard and click "Set as Master" on a resume.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const dropdownOptions = masters.map((m) => ({
    id: m.resume_id,
    label: getResumeLabel(m),
    description: getResumeDescription(m),
  }));

  return (
    <Dropdown
      label={displayLabel}
      options={dropdownOptions}
      value={selectedResumeId || ''}
      onChange={(id) => {
        const selected = masters.find((m) => m.resume_id === id);
        if (selected) {
          onSelect(selected.resume_id, selected.master_category);
        }
      }}
      placeholder={t('tailor.selectMasterPlaceholder') || '-- Select a master resume --'}
      className="w-full"
    />
  );
}
