'use client';

import { useState, useEffect } from 'react';
import { listMasterResumes, type MasterResume } from '@/lib/api/resume';
import Loader2 from 'lucide-react/dist/esm/icons/loader-2';
import AlertTriangle from 'lucide-react/dist/esm/icons/alert-triangle';
import { Dropdown } from '@/components/ui/dropdown';

interface MasterResumeSelectorProps {
  selectedResumeId: string | null;
  onSelect: (resumeId: string, category: string | null) => void;
  label?: string;
  required?: boolean;
}

export default function MasterResumeSelector({
  selectedResumeId,
  onSelect,
  label = 'Select Master Resume',
  required = false,
}: MasterResumeSelectorProps) {
  const [masters, setMasters] = useState<MasterResume[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  const getResumeDisplay = (master: MasterResume) => {
    const category = getCategoryDisplay(master.master_category);
    const name = master.personal_info?.name || 'Unnamed Resume';
    const title = master.personal_info?.title;

    if (title) {
      return `${category}: ${name} - ${title}`;
    }
    return `${category}: ${name}`;
  };

  if (loading) {
    return (
      <div className="space-y-2">
        {label && (
          <label className="text-xs font-bold text-white/40 uppercase tracking-widest ml-4 block">
            {label}
            {required && <span className="ml-1 text-red-500">*</span>}
          </label>
        )}
        <div className="flex h-14 w-full items-center gap-3 rounded-full border border-white/10 bg-white/5 px-6 py-2 text-sm shadow-sm opacity-50">
          <Loader2 className="h-4 w-4 animate-spin text-white/40" />
          <span className="font-semibold text-white">Loading master resumes...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-2">
        {label && (
          <label className="text-xs font-bold text-white/40 uppercase tracking-widest ml-4 block">
            {label}
            {required && <span className="ml-1 text-red-500">*</span>}
          </label>
        )}
        <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-4">
          <p className="text-sm text-red-300 font-medium">{error}</p>
        </div>
      </div>
    );
  }

  if (masters.length === 0) {
    return (
      <div className="space-y-2">
        {label && (
          <label className="text-xs font-bold text-white/40 uppercase tracking-widest ml-4 block">
            {label}
            {required && <span className="ml-1 text-red-500">*</span>}
          </label>
        )}
        <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-400" />
            <div>
              <h4 className="font-bold text-sm uppercase tracking-widest text-amber-300">
                No master resume found
              </h4>
              <p className="mt-1 text-xs text-amber-400/80 leading-relaxed">
                Please set at least one resume as master before tailoring. Go to the dashboard and
                click "Set as Master" on a resume.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const dropdownOptions = [
    { id: '', label: 'Select a master resume' },
    ...masters.map((master) => ({
      id: master.resume_id,
      label: getResumeDisplay(master),
    })),
  ];

  return (
    <div className="space-y-2">
      {label && (
        <label className="text-xs font-bold text-white/40 uppercase tracking-widest ml-4 block">
          {label}
          {required && <span className="ml-1 text-red-500">*</span>}
        </label>
      )}
      <Dropdown
        options={dropdownOptions}
        value={selectedResumeId || ''}
        onChange={(value) => {
          const selected = masters.find((m) => m.resume_id === value);
          if (selected) {
            onSelect(selected.resume_id, selected.master_category);
          } else if (value === '') {
            onSelect('', null);
          }
        }}
        description={masters.length > 1 ? 'Tip: Choose which master resume to use as the base for tailoring' : undefined}
      />
    </div>
  );
}
