'use client';

import { useState, useEffect } from 'react';
import { listMasterResumes, type MasterResume } from '@/lib/api/resume';
import Loader2 from 'lucide-react/dist/esm/icons/loader-2';
import AlertTriangle from 'lucide-react/dist/esm/icons/alert-triangle';

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
        <label className="block font-mono text-sm font-bold uppercase text-black">
          {label}
          {required && <span className="ml-1 text-red-600">*</span>}
        </label>
        <div className="flex items-center gap-3 border-2 border-black bg-[#E5E5E0] px-4 py-3">
          <Loader2 className="h-4 w-4 animate-spin text-blue-700" />
          <span className="font-mono text-sm text-gray-700">Loading master resumes...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-2">
        <label className="block font-mono text-sm font-bold uppercase text-black">
          {label}
          {required && <span className="ml-1 text-red-600">*</span>}
        </label>
        <div className="border-2 border-red-600 bg-red-50 p-4 shadow-[2px_2px_0px_0px_#000000]">
          <p className="font-mono text-sm text-red-800">{error}</p>
        </div>
      </div>
    );
  }

  if (masters.length === 0) {
    return (
      <div className="space-y-2">
        <label className="block font-mono text-sm font-bold uppercase text-black">
          {label}
          {required && <span className="ml-1 text-red-600">*</span>}
        </label>
        <div className="border-2 border-amber-500 bg-amber-50 p-4 shadow-[2px_2px_0px_0px_#000000]">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-600" />
            <div>
              <h4 className="font-mono text-sm font-bold uppercase text-amber-800">
                No master resume found
              </h4>
              <p className="mt-1 font-mono text-sm text-amber-700">
                Please set at least one resume as master before tailoring. Go to the dashboard and
                click "Set as Master" on a resume.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <label htmlFor="master-resume-select" className="block font-mono text-sm font-bold uppercase text-black">
        {label}
        {required && <span className="ml-1 text-red-600">*</span>}
      </label>
      <select
        id="master-resume-select"
        value={selectedResumeId || ''}
        onChange={(e) => {
          const selected = masters.find((m) => m.resume_id === e.target.value);
          if (selected) {
            onSelect(selected.resume_id, selected.master_category);
          }
        }}
        className="block w-full border-2 border-black bg-white px-4 py-3 font-mono text-sm text-black shadow-[2px_2px_0px_0px_#000000] focus:outline-none focus:ring-2 focus:ring-blue-700"
        required={required}
      >
        <option value="">-- Select a master resume --</option>
        {masters.map((master) => (
          <option key={master.resume_id} value={master.resume_id}>
            {getResumeDisplay(master)}
          </option>
        ))}
      </select>
      
      {masters.length > 1 && (
        <p className="font-mono text-xs text-gray-600">
          💡 Choose which master resume to use as the base for tailoring
        </p>
      )}
    </div>
  );
}
