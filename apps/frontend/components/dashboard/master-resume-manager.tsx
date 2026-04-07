'use client';

import { useState, useEffect } from 'react';
import {
  listMasterResumes,
  setMasterResume,
  unsetMasterResume,
  type MasterResume,
} from '@/lib/api/resume';
import { Button } from '@/components/ui/button';
import { Card, CardTitle, CardDescription } from '@/components/ui/card';
import Loader2 from 'lucide-react/dist/esm/icons/loader-2';
import X from 'lucide-react/dist/esm/icons/x';
import FileText from 'lucide-react/dist/esm/icons/file-text';

interface MasterResumeManagerProps {
  onClose?: () => void;
  onMasterChanged?: () => void;
}

export default function MasterResumeManager({
  onClose,
  onMasterChanged,
}: MasterResumeManagerProps) {
  const [masters, setMasters] = useState<MasterResume[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadMasters = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await listMasterResumes();
      setMasters(response.masters);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load master resumes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMasters();
  }, []);

  const handleUnsetMaster = async (resumeId: string) => {
    if (!confirm('Remove master status from this resume?')) return;

    try {
      await unsetMasterResume(resumeId);
      await loadMasters();
      onMasterChanged?.();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to unset master');
    }
  };

  const getCategoryDisplay = (category: string | null) => {
    return category || 'Default';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F6F5EE] p-8">
        <div className=" mx-auto">
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-blue-700" />
            <p className="ml-3 font-mono text-sm uppercase text-gray-600">
              Loading master resumes...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F6F5EE] p-8">
      <div className=" mx-auto">
        {/* Header */}
        <div className="mb-8 flex items-start justify-between">
          <div>
            <h1 className="font-serif text-4xl font-bold uppercase tracking-tight text-black">
              Master Resumes
            </h1>
            <p className="mt-2 font-mono text-sm uppercase text-gray-600">
              {'// '}Manage your master resumes for different career paths
            </p>
          </div>
          {onClose && (
            <Button
              onClick={onClose}
              variant="ghost"
              size="icon"
              className="text-black hover:bg-gray-200"
            >
              <X className="h-6 w-6" />
            </Button>
          )}
        </div>

        {/* Error State */}
        {error && (
          <div className="mb-6 border-2 border-red-600 bg-red-50 p-4 shadow-[4px_4px_0px_0px_#000000]">
            <p className="font-mono text-sm text-red-800">{error}</p>
          </div>
        )}

        {/* Empty State */}
        {masters.length === 0 ? (
          <Card variant="outline" className="p-12 text-center">
            <FileText className="mx-auto h-16 w-16 text-gray-400" />
            <h3 className="mt-4 font-serif text-xl font-bold uppercase text-gray-900">
              No master resumes
            </h3>
            <p className="mt-2 font-mono text-sm text-gray-600">
              Set a resume as master from the dashboard to get started.
            </p>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {masters.map((master) => (
              <Card key={master.resume_id} variant="outline" className="flex flex-col">
                <div className="mb-4">
                  <span className="inline-block border-2 border-black bg-blue-700 px-3 py-1 font-mono text-xs font-bold uppercase text-white shadow-[2px_2px_0px_0px_#000000]">
                    {getCategoryDisplay(master.master_category)}
                  </span>
                </div>

                <CardTitle className="text-xl">
                  {master.personal_info?.name || 'Unnamed Resume'}
                </CardTitle>

                {master.personal_info?.title && (
                  <p className="mt-2 font-mono text-sm text-gray-600">
                    {master.personal_info.title}
                  </p>
                )}

                {master.filename && (
                  <p className="mt-2 font-mono text-xs text-gray-500">File: {master.filename}</p>
                )}

                <CardDescription className="mt-auto pt-4">
                  Created: {new Date(master.created_at).toLocaleDateString()}
                </CardDescription>

                <div className="mt-4">
                  <Button
                    onClick={() => handleUnsetMaster(master.resume_id)}
                    variant="destructive"
                    size="sm"
                    className="w-full"
                  >
                    Remove Master
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Info Box */}
        <div className="mt-8 border-2 border-blue-700 bg-blue-50 p-6 shadow-[4px_4px_0px_0px_#000000]">
          <h4 className="font-mono text-sm font-bold uppercase text-blue-900">💡 Tip</h4>
          <p className="mt-2 font-mono text-sm text-blue-800">
            You can have multiple master resumes for different career paths. For example, one for
            "Software Engineer" and another for "Data Scientist". When tailoring a resume, you'll be
            able to choose which master to use.
          </p>
        </div>
      </div>
    </div>
  );
}
