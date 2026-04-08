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
  UploadIcon,
  Loader2Icon,
  AlertCircleIcon,
  FileIcon,
  XIcon,
  CheckCircle2Icon,
} from 'lucide-react';
import { useFileUpload, formatBytes } from '@/hooks/use-file-upload';
import { getUploadUrl } from '@/lib/api/client';
import { useTranslations } from '@/lib/i18n';
import { retryProcessing } from '@/lib/api/resume';

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
          <Button className="h-11 rounded-[1.2rem] border border-blue-300 bg-blue-100 px-4 text-blue-700 font-semibold shadow-[0_8px_24px_rgba(59,130,246,0.12)] transition-all duration-300 hover:-translate-y-0.5 hover:border-blue-400 hover:bg-blue-200">
            <UploadIcon className="w-4 h-4 mr-2" />
            {t('dashboard.uploadResume')}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent 
        className="sm:max-w-2xl p-0 gap-0 rounded-[2rem] border border-gray-300 bg-white text-gray-900 shadow-[0_20px_60px_rgba(0,0,0,0.12)]"
      >
        <DialogHeader className="relative p-7 border-b border-gray-200">
          <DialogTitle 
            className="font-serif text-4xl font-black uppercase leading-tight tracking-[-0.06em] text-gray-900"
            style={{ fontFamily: 'var(--font-playfair-display), "Times New Roman", serif' }}
          >
            {t('dashboard.uploadResume')}
          </DialogTitle>
          <p className="mt-3 text-sm font-medium text-gray-600">
            Archive your resume and elevate it as a master variant for tailoring runs.
          </p>
        </DialogHeader>

        <div className="relative p-8 space-y-6">
          <div
            className={`
              relative overflow-hidden rounded-[1.6rem] border transition-all duration-300
              ${isDragging 
                ? 'border-blue-500 bg-blue-50 shadow-[0_20px_60px_rgba(59,130,246,0.15)]' 
                : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
              }
              ${currentFile ? 'border-amber-300 bg-amber-50' : ''}
              ${!currentFile && !isRetryingProcessing ? 'cursor-pointer' : 'cursor-default'}
              ${isRetryingProcessing ? 'opacity-60 pointer-events-none' : ''}
            `}
            onClick={!currentFile && !isRetryingProcessing ? openFileDialog : undefined}
            onDragEnter={isRetryingProcessing ? preventDropzoneInteraction : handleDragEnter}
            onDragLeave={isRetryingProcessing ? preventDropzoneInteraction : handleDragLeave}
            onDragOver={isRetryingProcessing ? preventDropzoneInteraction : handleDragOver}
            onDrop={isRetryingProcessing ? preventDropzoneInteraction : handleDrop}
          >
            <input {...getInputProps()} />

            {isUploadingGlobal ? (
              <div className="relative flex flex-col items-center py-12">
                <div className="flex h-16 w-16 items-center justify-center rounded-[1.2rem] border border-blue-300 bg-blue-100 shadow-[0_12px_40px_rgba(59,130,246,0.12)]">
                  <Loader2Icon className="h-8 w-8 animate-spin text-blue-600" />
                </div>
                <p className="mt-5 text-[11px] font-semibold uppercase tracking-[0.32em] text-gray-600">
                  processing resume
                </p>
                <p className="mt-2 text-sm font-medium text-gray-700">Analyzing content...</p>
              </div>
            ) : currentFile ? (
              <div className="relative flex items-center justify-between gap-4 p-4">
                <div className="flex items-center gap-4 overflow-hidden">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[1.1rem] border border-amber-300 bg-amber-100 shadow-[0_8px_24px_rgba(217,119,6,0.1)]">
                    <FileIcon className="h-6 w-6 text-amber-700" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">
                      {currentFile.file.name}
                    </p>
                    <p className="mt-1 text-xs font-mono text-gray-600 uppercase tracking-wider">
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
                  className="h-10 w-10 shrink-0 rounded-[1rem] border border-red-300 bg-red-100 text-red-700 hover:border-red-400 hover:bg-red-200 transition-all"
                >
                  <XIcon className="h-5 w-5" />
                </Button>
              </div>
            ) : (
              <div className="relative flex flex-col items-center py-12">
                <div className="flex h-16 w-16 items-center justify-center rounded-[1.2rem] border border-amber-300 bg-amber-100 shadow-[0_12px_40px_rgba(217,119,6,0.12)]">
                  <UploadIcon className="h-8 w-8 text-amber-700" />
                </div>
                <h3 
                  className="mt-6 text-2xl font-black uppercase tracking-[-0.05em] text-gray-900"
                  style={{ fontFamily: 'var(--font-playfair-display), "Times New Roman", serif' }}
                >
                  Drop Resume Here
                </h3>
                <p className="mt-3 max-w-sm text-sm leading-6 text-gray-700">
                  PDF, DOCX, or DOC. Maximum 4MB. We'll parse and analyze intelligently.
                </p>
                <p className="mt-4 text-[11px] font-semibold uppercase tracking-[0.24em] text-gray-600">
                  or click to browse
                </p>
              </div>
            )}
          </div>

          {/* Feedback Messages */}
          {displayErrors.length > 0 && (
            <div className="rounded-[1.2rem] border border-red-300 bg-red-50 p-4 shadow-[0_8px_24px_rgba(239,68,68,0.08)]">
              <div className="flex items-start gap-3">
                <AlertCircleIcon className="h-5 w-5 shrink-0 text-red-600 mt-0.5" />
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-red-700 mb-1">
                    Upload Issue
                  </p>
                  {displayErrors.map((err, i) => (
                    <p key={i} className="text-sm leading-5 text-red-600">{err}</p>
                  ))}
                </div>
              </div>
            </div>
          )}

          {uploadFeedback?.type === 'success' && (
            <div className="rounded-[1.2rem] border border-green-300 bg-green-50 p-4 shadow-[0_8px_24px_rgba(34,197,94,0.08)]">
              <div className="flex items-center gap-3">
                <CheckCircle2Icon className="h-5 w-5 shrink-0 text-green-600" />
                <div>
                  <p className="text-sm font-semibold text-green-700">{uploadFeedback.message}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="relative border-t border-gray-200 bg-white px-8 py-5 flex flex-col-reverse sm:flex-row justify-between gap-3 sm:items-center">
          <div className="flex flex-wrap gap-2">
            {uploadFeedback?.type === 'error' && failedResumeId && (
              <Button
                onClick={handleRetryProcessing}
                disabled={isRetryingProcessing}
                className="h-10 rounded-[1.1rem] border border-blue-300 bg-blue-100 px-4 text-blue-700 font-semibold hover:border-blue-400 hover:bg-blue-200 transition-all disabled:opacity-50"
              >
                {isRetryingProcessing
                  ? t('dashboard.retryingProcessing')
                  : t('dashboard.retryProcessing')}
              </Button>
            )}
            {uploadFeedback?.type === 'error' && files.length > 0 && (
              <Button
                className="h-10 rounded-[1.1rem] border border-amber-300 bg-amber-100 px-4 text-amber-700 font-semibold hover:border-amber-400 hover:bg-amber-200 transition-all disabled:opacity-50"
                disabled={isRetryingProcessing}
                onClick={() => {
                  if (files[0]) removeFile(files[0].id);
                  setUploadFeedback(null);
                  setFailedResumeId(null);
                }}
              >
                {t('dashboard.uploadDialog.tryDifferentFile')}
              </Button>
            )}
          </div>
          <DialogClose asChild>
            <Button 
              variant="outline" 
              className="h-10 rounded-[1.1rem] border border-gray-300 bg-gray-100 text-gray-700 font-semibold hover:bg-gray-200 transition-all"
            >
              {t('common.cancel')}
            </Button>
          </DialogClose>
        </div>
      </DialogContent>
    </Dialog>
  );
}
