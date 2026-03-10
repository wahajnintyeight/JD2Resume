'use client';

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  Upload,
  Loader2,
  AlertCircle,
  FileText,
  X,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import { useFileUpload, formatBytes } from '@/hooks/use-file-upload';
import { getUploadUrl } from '@/lib/api/client';
import { useTranslations } from '@/lib/i18n';
import { retryProcessing } from '@/lib/api/resume';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'motion/react';

interface ResumeUploadDialogProps {
  trigger?: React.ReactNode;
  onUploadComplete?: (resumeId: string) => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  isOpen?: boolean;
  onClose?: () => void;
}

const ACCEPTED_FILE_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
  'application/msword', // .doc
];
const MAX_FILE_SIZE = 4 * 1024 * 1024; // 4MB

export function ResumeUploadDialog({
  trigger,
  onUploadComplete,
  open: controlledOpen,
  onOpenChange,
  isOpen: isOpenProp,
  onClose,
}: ResumeUploadDialogProps) {
  const { t } = useTranslations();
  const [internalOpen, setInternalOpen] = useState(false);
  const [uploadFeedback, setUploadFeedback] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);
  const [failedResumeId, setFailedResumeId] = useState<string | null>(null);
  const [isRetryingProcessing, setIsRetryingProcessing] = useState(false);
  
  // Support both prop naming conventions
  const effectiveOpen = isOpenProp !== undefined ? isOpenProp : controlledOpen;
  const isControlled = effectiveOpen !== undefined;
  const isOpen = isControlled ? effectiveOpen : internalOpen;
  
  const setIsOpen = (nextOpen: boolean) => {
    if (!isControlled) {
      setInternalOpen(nextOpen);
    }
    onOpenChange?.(nextOpen);
    if (!nextOpen) {
      onClose?.();
    }
  };

  const UPLOAD_URL = getUploadUrl();

  const handleUploadSuccess = ({
    resumeId,
    fileId,
    message,
  }: {
    resumeId: string;
    fileId?: string;
    message: string;
  }) => {
    setUploadFeedback({ type: 'success', message });
    setFailedResumeId(null);

    // Defer parent state update to avoid setState during render
    setTimeout(() => {
      onUploadComplete?.(resumeId);
    }, 0);

    // Close dialog after a short delay to show success state
    setTimeout(() => {
      setIsOpen(false);
      setUploadFeedback(null);
      setFailedResumeId(null);
      if (fileId) {
        removeFile(fileId); // Clear file for next time
      }
    }, 1500);
  };

  const [
    { files, isDragging, errors, isUploadingGlobal },
    {
      getInputProps,
      openFileDialog,
      removeFile,
      handleDragEnter,
      handleDragLeave,
      handleDragOver,
      handleDrop,
    },
  ] = useFileUpload({
    maxSize: MAX_FILE_SIZE,
    accept: ACCEPTED_FILE_TYPES.join(','),
    multiple: false,
    uploadUrl: UPLOAD_URL,
    onUploadSuccess: (uploadedFile, response) => {
      const data = response as {
        resume_id?: string;
        processing_status?: 'pending' | 'processing' | 'ready' | 'failed';
        is_master?: boolean;
      };
      if (data.resume_id) {
        const processingFailed = data.processing_status === 'failed';
        const successMessage = data.is_master
          ? t('dashboard.uploadDialog.successMaster')
          : t('dashboard.uploadDialog.success');
        if (processingFailed) {
          // Keep dialog open on failure so users can retry processing.
          setUploadFeedback({
            type: 'error',
            message: t('dashboard.uploadDialog.parsingFailedKeepOpen'),
          });
          setFailedResumeId(data.resume_id);
          return;
        }
        handleUploadSuccess({
          resumeId: data.resume_id,
          fileId: uploadedFile.id,
          message: successMessage,
        });
      } else {
        setFailedResumeId(null);
        setUploadFeedback({
          type: 'error',
          message: t('dashboard.uploadDialog.successMissingId'),
        });
      }
    },
    onUploadError: (file, errorMsg) => {
      setFailedResumeId(null);
      setUploadFeedback({
        type: 'error',
        message: errorMsg || t('dashboard.uploadDialog.failed'),
      });
    },
    onFilesChange: (currentFiles) => {
      if (currentFiles.length === 0) {
        setUploadFeedback(null);
        setFailedResumeId(null);
      }
    },
  });

  const currentFile = files[0];
  const displayErrors = uploadFeedback?.type === 'error' ? [uploadFeedback.message] : errors;
  const preventDropzoneInteraction = (e: React.DragEvent<HTMLElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleRetryProcessing = async () => {
    if (!failedResumeId) return;
    const resumeIdToRetry = failedResumeId;
    const fileIdToRemove = currentFile?.id;
    setIsRetryingProcessing(true);
    try {
      const result = await retryProcessing(resumeIdToRetry);
      if (result.processing_status !== 'ready') {
        setUploadFeedback({ type: 'error', message: t('dashboard.retryFailed') });
        return;
      }

      handleUploadSuccess({
        resumeId: resumeIdToRetry,
        fileId: fileIdToRemove,
        message: t('dashboard.retrySuccess'),
      });
    } catch (err) {
      console.error('Retry processing failed:', err);
      setUploadFeedback({ type: 'error', message: t('dashboard.retryFailed') });
    } finally {
      setIsRetryingProcessing(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button size="lg" className="group">
            <Upload className="h-5 w-5" />
            {t('dashboard.uploadResume')}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-xl bg-[#050505] border-white/10 text-white shadow-2xl shadow-indigo-500/10">
        <DialogHeader className="px-10 pt-10 pb-0">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-indigo-500/20 bg-indigo-600 text-white shadow-lg shadow-indigo-500/20">
              <Upload className="h-6 w-6" />
            </div>
            <div>
              <DialogTitle className="text-2xl font-bold tracking-tight text-white">
                {t('dashboard.uploadResume')}
              </DialogTitle>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/40 mt-1">
                Professional Document Import
              </p>
            </div>
          </div>
        </DialogHeader>

        <div className="p-10 space-y-10">
          <div
            className={cn(
              "relative group flex flex-col items-center justify-center border-2 border-dashed border-white/10 rounded-[2.5rem] p-16 text-center transition-all duration-500",
              isDragging ? "border-indigo-500 bg-indigo-500/10" : "hover:border-indigo-500/50 hover:bg-indigo-500/[0.02]",
              currentFile && "border-solid border-white/5 bg-white/[0.02]",
              !currentFile && !isRetryingProcessing ? "cursor-pointer" : "cursor-default",
              isRetryingProcessing && "opacity-50"
            )}
            onClick={!currentFile && !isRetryingProcessing ? openFileDialog : undefined}
            onDragEnter={isRetryingProcessing ? preventDropzoneInteraction : handleDragEnter}
            onDragLeave={isRetryingProcessing ? preventDropzoneInteraction : handleDragLeave}
            onDragOver={isRetryingProcessing ? preventDropzoneInteraction : handleDragOver}
            onDrop={isRetryingProcessing ? preventDropzoneInteraction : handleDrop}
          >
            <input {...getInputProps()} />

            <AnimatePresence mode="wait">
              {isUploadingGlobal ? (
                <motion.div 
                  key="uploading"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="flex flex-col items-center py-4"
                >
                  <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-3xl border border-indigo-500/20 bg-indigo-600/10 text-indigo-400">
                    <Loader2 className="h-10 w-10 animate-spin" />
                  </div>
                  <p className="text-xl font-bold tracking-tight text-white">
                    {t('common.uploading')}
                  </p>
                  <p className="mt-2 text-[10px] font-bold uppercase tracking-widest text-indigo-400/60">Processing data...</p>
                </motion.div>
              ) : currentFile ? (
                <motion.div 
                  key="file"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="w-full flex items-center justify-between gap-6 p-8 rounded-[2rem] bg-white/[0.02] border border-white/5"
                >
                  <div className="flex items-center gap-6 text-left overflow-hidden">
                    <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-white/5 bg-white/[0.02] text-white/40">
                      <FileText className="h-8 w-8" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xl font-bold tracking-tight text-white truncate max-w-[240px]">
                        {currentFile.file.name}
                      </p>
                      <p className="mt-1 text-[10px] font-bold uppercase tracking-widest text-white/20">
                        {formatBytes(currentFile.file.size)}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    disabled={isRetryingProcessing}
                    onClick={(e) => {
                      e.stopPropagation();
                      removeFile(currentFile.id);
                    }}
                    className="h-12 w-12 rounded-full hover:bg-red-500/10 text-red-400"
                  >
                    <X className="h-6 w-6" />
                  </Button>
                </motion.div>
              ) : (
                <motion.div 
                  key="idle"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex flex-col items-center py-4"
                >
                  <div className="mb-8 flex h-24 w-24 items-center justify-center rounded-3xl border border-white/5 bg-white/[0.02] text-white/10 group-hover:bg-indigo-600 group-hover:text-white group-hover:border-indigo-500/20 transition-all duration-500">
                    <Upload className="h-12 w-12" />
                  </div>
                  <p className="text-2xl font-bold tracking-tight text-white">
                    {t('dashboard.uploadDialog.dropzoneTitle')}
                  </p>
                  <p className="mt-3 text-sm font-medium text-white/40">
                    {t('dashboard.uploadDialog.dropzoneSubtitle')}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Feedback Messages */}
          <AnimatePresence>
            {displayErrors.length > 0 && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="p-6 rounded-3xl bg-red-500/10 border border-red-500/20 flex items-start gap-4 text-red-400"
              >
                <AlertCircle className="w-6 h-6 shrink-0" />
                <div className="text-sm font-medium leading-relaxed">
                  {displayErrors.map((err, i) => (
                    <p key={i}>{err}</p>
                  ))}
                </div>
              </motion.div>
            )}

            {uploadFeedback?.type === 'success' && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="p-6 rounded-3xl bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-4 text-emerald-400"
              >
                <CheckCircle2 className="w-6 h-6 shrink-0" />
                <p className="text-sm font-bold tracking-tight">{uploadFeedback.message}</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="p-10 border-t border-white/5 bg-transparent flex justify-end gap-4">
          {uploadFeedback?.type === 'error' && failedResumeId && (
            <Button
              variant="outline"
              onClick={handleRetryProcessing}
              disabled={isRetryingProcessing}
              className="bg-white/[0.02] border-white/10 hover:bg-white/[0.05] text-white transition-colors"
            >
              {isRetryingProcessing ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="mr-2 h-4 w-4" />
              )}
              {isRetryingProcessing
                ? t('dashboard.retryingProcessing')
                : t('dashboard.retryProcessing')}
            </Button>
          )}
          {uploadFeedback?.type === 'error' && files.length > 0 && (
            <Button
              variant="outline"
              disabled={isRetryingProcessing}
              className="bg-white/[0.02] border-white/10 hover:bg-white/[0.05] text-white transition-colors"
              onClick={() => {
                if (files[0]) removeFile(files[0].id);
                setUploadFeedback(null);
                setFailedResumeId(null);
              }}
            >
              {t('dashboard.uploadDialog.tryDifferentFile')}
            </Button>
          )}
          <DialogClose asChild>
            <Button variant="outline" className="bg-white/[0.02] border-white/10 hover:bg-white/[0.05] text-white transition-colors">
              {t('common.cancel')}
            </Button>
          </DialogClose>
        </div>
      </DialogContent>
    </Dialog>
  );
}
