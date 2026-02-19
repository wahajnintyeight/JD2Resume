'use client';

import { useState, useEffect } from 'react';
import { fetchResumeList, type ResumeListItem, deleteResume } from '@/lib/api/resume';
import { Button } from '@/components/ui/button';
import { Card, CardTitle, CardDescription } from '@/components/ui/card';
import { ResumeUploadDialog } from '@/components/dashboard/resume-upload-dialog';
import SetMasterDialog from '@/components/dashboard/set-master-dialog';
import { unsetMasterResume } from '@/lib/api/resume';
import Loader2 from 'lucide-react/dist/esm/icons/loader-2';
import X from 'lucide-react/dist/esm/icons/x';
import Upload from 'lucide-react/dist/esm/icons/upload';
import FileText from 'lucide-react/dist/esm/icons/file-text';
import Trash2 from 'lucide-react/dist/esm/icons/trash-2';

interface ResumeManagerDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onResumeChanged?: () => void;
}

export default function ResumeManagerDialog({
  isOpen,
  onClose,
  onResumeChanged,
}: ResumeManagerDialogProps) {
  const [resumes, setResumes] = useState<ResumeListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [showSetMasterDialog, setShowSetMasterDialog] = useState(false);
  const [selectedResume, setSelectedResume] = useState<{ id: string; name: string } | null>(null);

  const loadResumes = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchResumeList(true); // Include masters
      setResumes(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load resumes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadResumes();
    }
  }, [isOpen]);

  const handleSetAsMaster = (resume: ResumeListItem) => {
    setSelectedResume({
      id: resume.resume_id,
      name: resume.filename || resume.title || 'Resume',
    });
    setShowSetMasterDialog(true);
  };

  const handleRemoveMaster = async (resumeId: string) => {
    if (!confirm('Remove master status from this resume?')) return;

    try {
      await unsetMasterResume(resumeId);
      await loadResumes();
      onResumeChanged?.();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to remove master status');
    }
  };

  const handleDeleteResume = async (resumeId: string, resumeName: string) => {
    if (!confirm(`Are you sure you want to delete "${resumeName}"? This action cannot be undone.`)) return;

    try {
      await deleteResume(resumeId);
      await loadResumes();
      onResumeChanged?.();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete resume');
    }
  };

  const handleUploadComplete = () => {
    setShowUploadDialog(false);
    loadResumes();
    onResumeChanged?.();
  };

  const getCategoryDisplay = (category: string | null | undefined) => {
    return category || 'Default';
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop with fade animation */}
      <div
        className="fixed inset-0 z-50 bg-black bg-opacity-50 transition-opacity duration-300 ease-out"
        onClick={onClose}
      />

      {/* Dialog with slide-up animation */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div
          className="pointer-events-auto w-full max-w-5xl max-h-[90vh] overflow-hidden border-2 border-black bg-[#F0F0E8] shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] animate-slide-up"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="border-b-2 border-black bg-[#E5E5E0] p-6">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="font-serif text-3xl font-bold uppercase text-black">
                  Manage Resumes
                </h2>
                <p className="mt-1 font-mono text-sm uppercase text-gray-600">
                  {'// '}Upload, view, and set master resumes
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={() => setShowUploadDialog(true)}
                  variant="default"
                  size="sm"
                  className="flex items-center gap-2"
                >
                  <Upload className="h-4 w-4" />
                  Upload Resume
                </Button>
                <Button onClick={onClose} variant="ghost" size="icon">
                  <X className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="overflow-y-auto p-6" style={{ maxHeight: 'calc(90vh - 120px)' }}>
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-blue-700" />
                <p className="ml-3 font-mono text-sm uppercase text-gray-600">
                  Loading resumes...
                </p>
              </div>
            ) : error ? (
              <div className="border-2 border-red-600 bg-red-50 p-4 shadow-[4px_4px_0px_0px_#000000]">
                <p className="font-mono text-sm text-red-800">{error}</p>
              </div>
            ) : resumes.length === 0 ? (
              <Card variant="outline" className="p-12 text-center">
                <FileText className="mx-auto h-16 w-16 text-gray-400" />
                <h3 className="mt-4 font-serif text-xl font-bold uppercase text-gray-900">
                  No resumes yet
                </h3>
                <p className="mt-2 font-mono text-sm text-gray-600">
                  Upload your first resume to get started
                </p>
                <Button
                  onClick={() => setShowUploadDialog(true)}
                  variant="default"
                  className="mt-4"
                >
                  <Upload className="mr-2 h-4 w-4" />
                  Upload Resume
                </Button>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {resumes.map((resume) => (
                  <Card
                    key={resume.resume_id}
                    variant="outline"
                    className="flex flex-col transition-all hover:shadow-[6px_6px_0px_0px_#000000]"
                  >
                    {/* Master Badge */}
                    {resume.is_master && (
                      <div className="mb-3">
                        <span className="inline-block border-2 border-black bg-blue-700 px-3 py-1 font-mono text-xs font-bold uppercase text-white shadow-[2px_2px_0px_0px_#000000]">
                          Master: {getCategoryDisplay(resume.master_category)}
                        </span>
                      </div>
                    )}

                    {/* Resume Info */}
                    <CardTitle className="text-lg line-clamp-2">
                      {resume.title || resume.filename || 'Untitled Resume'}
                    </CardTitle>

                    {resume.filename && (
                      <p className="mt-2 font-mono text-xs text-gray-600 truncate">
                        {resume.filename}
                      </p>
                    )}

                    <CardDescription className="mt-auto pt-3">
                      {new Date(resume.updated_at || resume.created_at).toLocaleDateString()}
                    </CardDescription>

                    {/* Actions */}
                    <div className="mt-4 flex flex-col gap-2">
                      <div className="flex gap-2">
                        {resume.is_master ? (
                          <Button
                            onClick={() => handleRemoveMaster(resume.resume_id)}
                            variant="destructive"
                            size="sm"
                            className="flex-1"
                          >
                            Remove Master
                          </Button>
                        ) : (
                          <Button
                            onClick={() => handleSetAsMaster(resume)}
                            variant="default"
                            size="sm"
                            className="flex-1"
                          >
                            Set as Master
                          </Button>
                        )}
                      </div>
                      <Button
                        onClick={() => handleDeleteResume(resume.resume_id, resume.title || resume.filename || 'Resume')}
                        variant="outline"
                        size="sm"
                        className="flex items-center justify-center gap-2 border-red-600 text-red-600 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                        Delete
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            )}

            {/* Info Box */}
            {resumes.length > 0 && (
              <div className="mt-6 border-2 border-blue-700 bg-blue-50 p-4 shadow-[4px_4px_0px_0px_#000000]">
                <h4 className="font-mono text-sm font-bold uppercase text-blue-900">💡 Tip</h4>
                <p className="mt-2 font-mono text-sm text-blue-800">
                  Master resumes are used as templates when tailoring. You can have multiple
                  masters for different career paths (e.g., "Software Engineer", "Data
                  Scientist").
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Upload Dialog */}
      {showUploadDialog && (
        <ResumeUploadDialog
          isOpen={showUploadDialog}
          onClose={() => setShowUploadDialog(false)}
          onUploadComplete={handleUploadComplete}
        />
      )}

      {/* Set Master Dialog */}
      {showSetMasterDialog && selectedResume && (
        <SetMasterDialog
          resumeId={selectedResume.id}
          resumeName={selectedResume.name}
          onClose={() => {
            setShowSetMasterDialog(false);
            setSelectedResume(null);
          }}
          onSuccess={() => {
            loadResumes();
            onResumeChanged?.();
          }}
        />
      )}

      <style jsx global>{`
        @keyframes slide-up {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-slide-up {
          animation: slide-up 0.3s ease-out;
        }
      `}</style>
    </>
  );
}
