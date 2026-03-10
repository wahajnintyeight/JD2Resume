'use client';

import { useState, useEffect } from 'react';
import { fetchResumeList, type ResumeListItem, deleteResume, unsetMasterResume } from '@/lib/api/resume';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ResumeUploadDialog } from '@/components/dashboard/resume-upload-dialog';
import SetMasterDialog from '@/components/dashboard/set-master-dialog';
import Loader2 from 'lucide-react/dist/esm/icons/loader-2';
import X from 'lucide-react/dist/esm/icons/x';
import Upload from 'lucide-react/dist/esm/icons/upload';
import FileText from 'lucide-react/dist/esm/icons/file-text';
import Trash2 from 'lucide-react/dist/esm/icons/trash-2';
import { cn } from '@/lib/utils';

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

      {/* Dialog Content */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div
          className="pointer-events-auto w-full max-w-5xl max-h-[90vh] overflow-hidden border border-border bg-background shadow-sw-card animate-in fade-in zoom-in duration-200"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="border-b border-border bg-card p-8">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="font-serif text-4xl font-medium tracking-tight text-foreground">
                  Manage Library
                </h2>
                <p className="mt-2 font-mono text-xs uppercase tracking-widest text-muted-foreground">
                  {'// '}Upload, view, and set master resumes
                </p>
              </div>
              <div className="flex items-center gap-4">
                <Button
                  onClick={() => setShowUploadDialog(true)}
                  className="flex items-center gap-2"
                >
                  <Upload className="h-4 w-4" />
                  Upload New
                </Button>
                <Button onClick={onClose} variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
                  <X className="h-6 w-6" />
                </Button>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="overflow-y-auto p-8 bg-background" style={{ maxHeight: 'calc(90vh - 140px)' }}>
            {loading ? (
              <div className="flex flex-col items-center justify-center py-24 gap-4">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
                <p className="font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                  Syncing library...
                </p>
              </div>
            ) : error ? (
              <div className="border border-destructive/20 bg-destructive/5 p-6 flex items-center gap-4">
                <div className="h-10 w-10 rounded-full bg-destructive/10 flex items-center justify-center text-destructive">
                  <X className="h-5 w-5" />
                </div>
                <p className="font-mono text-sm text-destructive">{error}</p>
              </div>
            ) : resumes.length === 0 ? (
              <Card className="p-20 text-center border-dashed border-2">
                <div className="mx-auto h-20 w-20 flex items-center justify-center border border-border bg-secondary text-muted-foreground mb-6">
                  <FileText className="h-10 w-10" />
                </div>
                <h3 className="font-serif text-3xl font-medium text-foreground">
                  No documents found
                </h3>
                <p className="mt-3 text-muted-foreground max-w-sm mx-auto">
                  Start by uploading your first professional resume to begin tailoring.
                </p>
                <Button
                  onClick={() => setShowUploadDialog(true)}
                  className="mt-8"
                  size="lg"
                >
                  <Upload className="mr-2 h-5 w-5" />
                  Upload Now
                </Button>
              </Card>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {resumes.map((resume) => (
                  <Card
                    key={resume.resume_id}
                    variant="interactive"
                    className="flex flex-col group h-full"
                  >
                    <CardContent className="p-6 flex flex-col h-full">
                      {/* Master Badge */}
                      <div className="h-8 mb-4">
                        {resume.is_master ? (
                          <span className="inline-flex items-center gap-2 border border-success/20 bg-success/10 px-3 py-1 font-mono text-[10px] font-bold uppercase tracking-widest text-success">
                            <CheckCircle2Icon className="h-3 w-3" />
                            Master: {getCategoryDisplay(resume.master_category)}
                          </span>
                        ) : (
                          <span className="inline-block px-3 py-1 font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground bg-secondary opacity-0 group-hover:opacity-100 transition-opacity">
                            Standard Draft
                          </span>
                        )}
                      </div>

                      {/* Resume Info */}
                      <CardTitle className="text-xl font-medium text-foreground line-clamp-2 leading-tight">
                        {resume.title || resume.filename || 'Untitled Profile'}
                      </CardTitle>

                      {resume.filename && (
                        <p className="mt-2 font-mono text-[10px] uppercase tracking-widest text-muted-foreground truncate">
                          {resume.filename}
                        </p>
                      )}

                      <div className="mt-auto pt-6 flex flex-col gap-4">
                        <p className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground flex items-center justify-between border-t border-border/50 pt-4">
                          <span>Updated</span>
                          <span className="font-bold text-foreground">
                            {new Date(resume.updated_at || resume.created_at).toLocaleDateString()}
                          </span>
                        </p>

                        <div className="flex flex-col gap-2">
                          {resume.is_master ? (
                            <Button
                              onClick={() => handleRemoveMaster(resume.resume_id)}
                              variant="outline"
                              size="sm"
                              className="w-full text-foreground border-border hover:bg-secondary"
                            >
                              Remove Master Status
                            </Button>
                          ) : (
                            <Button
                              onClick={() => handleSetAsMaster(resume)}
                              variant="default"
                              size="sm"
                              className="w-full"
                            >
                              Promote to Master
                            </Button>
                          )}
                          <Button
                            onClick={() => handleDeleteResume(resume.resume_id, resume.title || resume.filename || 'Resume')}
                            variant="secondary"
                            size="sm"
                            className="w-full text-destructive hover:bg-destructive/10 hover:text-destructive hover:border-destructive/20 border-transparent"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete Document
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {/* Info Box */}
            {resumes.length > 0 && (
              <Card className="mt-8 bg-primary/5 border-primary/10">
                <CardContent className="p-6 flex items-start gap-5">
                  <div className="h-10 w-10 flex items-center justify-center border border-primary/20 bg-primary/10 text-primary shrink-0">
                    <Info className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="font-mono text-[10px] font-bold uppercase tracking-widest text-primary">Library Architecture</h4>
                    <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                      Master resumes serve as base templates for AI tailoring. You can maintain separate masters for distinct career paths (e.g., &quot;Lead Developer&quot; vs &quot;Product Manager&quot;).
                    </p>
                  </div>
                </CardContent>
              </Card>
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
