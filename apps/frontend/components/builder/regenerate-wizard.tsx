'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { Sparkles, Wand2, FileSearch, CheckCircle2 } from 'lucide-react';
import { RegenerateDialog } from './regenerate-dialog';
import { RegenerateInstructionDialog } from './regenerate-instruction-dialog';
import { RegenerateDiffPreview } from './regenerate-diff-preview';
import type {
  RegenerateItemError,
  RegenerateItemInput,
  RegeneratedItem,
} from '@/lib/api/enrichment';

export type RegenerateWizardStep =
  | 'idle'
  | 'selecting'
  | 'instructing'
  | 'generating'
  | 'previewing'
  | 'complete';

interface RegenerateWizardProps {
  // Step state
  step: RegenerateWizardStep;
  onStepChange: (step: RegenerateWizardStep) => void;

  // Data from resume
  experienceItems: RegenerateItemInput[];
  projectItems: RegenerateItemInput[];
  skillsItem: RegenerateItemInput | null;

  // Selection state
  selectedItems: RegenerateItemInput[];
  onSelectionChange: (items: RegenerateItemInput[]) => void;

  // Instruction state
  instruction: string;
  onInstructionChange: (instruction: string) => void;

  // Generated content
  regeneratedItems: RegeneratedItem[];
  regenerateErrors: RegenerateItemError[];

  // Loading states
  isGenerating: boolean;
  isApplying: boolean;

  // Error state
  error: string | null;

  // Actions
  onGenerate: () => void;
  onAccept: () => void;
  onReject: () => void;
  onClose: () => void;
}

/**
 * RegenerateWizard Component
 *
 * Main container that coordinates the 3-step regenerate flow:
 * 1. Select items to regenerate
 * 2. Enter improvement instructions
 * 3. Preview diff and accept/reject
 */
export const RegenerateWizard: React.FC<RegenerateWizardProps> = ({
  step,
  onStepChange,
  experienceItems,
  projectItems,
  skillsItem,
  selectedItems,
  onSelectionChange,
  instruction,
  onInstructionChange,
  regeneratedItems,
  regenerateErrors,
  isGenerating,
  isApplying,
  error,
  onGenerate,
  onAccept,
  onReject,
  onClose,
}) => {
  const wizardSteps = [
    {
      id: 'selecting',
      label: 'Select',
      description: 'Choose bullets, projects, and skills to refine',
      icon: Sparkles,
    },
    {
      id: 'instructing',
      label: 'Guide',
      description: 'Tell AI how to sharpen impact and relevance',
      icon: Wand2,
    },
    {
      id: 'previewing',
      label: 'Review',
      description: 'Compare changes before applying them',
      icon: FileSearch,
    },
  ] as const;

  const currentVisualStep =
    step === 'generating'
      ? 'instructing'
      : step === 'complete'
        ? 'previewing'
        : step;
  // Handle dialog open state based on step
  const isSelectDialogOpen = step === 'selecting';
  const isInstructionDialogOpen = step === 'instructing' || step === 'generating';
  const isDiffPreviewOpen = step === 'previewing';

  // Handle selection dialog close
  const handleSelectDialogClose = (open: boolean) => {
    if (!open) {
      onClose();
    }
  };

  // Handle instruction dialog close
  const handleInstructionDialogClose = (open: boolean) => {
    if (!open && !isGenerating) {
      onClose();
    }
  };

  // Handle diff preview dialog close
  const handleDiffPreviewClose = (open: boolean) => {
    if (!open && !isApplying) {
      onClose();
    }
  };

  // Move to instruction step
  const handleContinueToInstruction = () => {
    onStepChange('instructing');
  };

  // Go back to selection step
  const handleBackToSelection = () => {
    onStepChange('selecting');
  };

  return (
    <>
      {(isSelectDialogOpen || isInstructionDialogOpen || isDiffPreviewOpen) && (
        <div className="pointer-events-none fixed inset-x-0 top-0 z-[60] flex justify-center px-4 pt-4 sm:px-6 sm:pt-6">
          <div className="w-full max-w-4xl overflow-hidden rounded-[2rem] border border-white/10 bg-slate-950/70 shadow-[0_24px_80px_rgba(2,6,23,0.45)] backdrop-blur-2xl">
            <div className="relative overflow-hidden px-4 py-4 sm:px-6">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(244,114,182,0.18),_transparent_28%),radial-gradient(circle_at_78%_20%,_rgba(34,211,238,0.16),_transparent_24%),linear-gradient(135deg,_rgba(15,23,42,0.96),_rgba(15,23,42,0.86))]" />
              <div className="relative">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="inline-flex items-center gap-2 rounded-full border border-fuchsia-300/25 bg-fuchsia-300/10 px-3 py-1.5 font-sans text-[10px] font-bold uppercase tracking-[0.28em] text-fuchsia-100">
                        <Sparkles className="h-3.5 w-3.5" />
                        AI Regenerate
                      </span>
                      {(isGenerating || isApplying) && (
                        <span className="inline-flex items-center gap-2 rounded-full border border-cyan-300/25 bg-cyan-300/10 px-3 py-1.5 font-sans text-[10px] font-bold uppercase tracking-[0.24em] text-cyan-100">
                          <span className="h-2 w-2 rounded-full bg-cyan-300 shadow-[0_0_12px_rgba(103,232,249,0.8)]" />
                          {isGenerating ? 'Generating' : 'Applying'}
                        </span>
                      )}
                      {error && (
                        <span className="rounded-full border border-rose-300/25 bg-rose-300/10 px-3 py-1.5 font-sans text-[10px] font-bold uppercase tracking-[0.2em] text-rose-100">
                          Attention needed
                        </span>
                      )}
                    </div>

                    <h2 className="mt-3 font-serif text-2xl font-black uppercase tracking-[0.08em] text-white sm:text-3xl">
                      Polish content with guided AI edits
                    </h2>
                    <p className="mt-2 max-w-2xl text-sm text-slate-300 sm:text-[15px]">
                      Move through selection, instruction, and review with a cleaner,
                      mobile-friendly workflow before committing changes.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-3 lg:min-w-[420px]">
                    {wizardSteps.map(({ id, label, description, icon: Icon }, index) => {
                      const isActive = currentVisualStep === id;
                      const isCompleted =
                        (id === 'selecting' &&
                          (currentVisualStep === 'instructing' ||
                            currentVisualStep === 'previewing')) ||
                        (id === 'instructing' && currentVisualStep === 'previewing');

                      return (
                        <div
                          key={id}
                          className={cn(
                            'rounded-[1.25rem] border px-3 py-3 transition-all',
                            isActive
                              ? 'border-cyan-300/30 bg-cyan-300/10 shadow-[0_0_0_1px_rgba(103,232,249,0.14)]'
                              : isCompleted
                                ? 'border-emerald-300/20 bg-emerald-300/10'
                                : 'border-white/10 bg-white/5'
                          )}
                        >
                          <div className="flex items-start gap-3">
                            <div
                              className={cn(
                                'mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl border',
                                isActive
                                  ? 'border-cyan-300/35 bg-cyan-300/15 text-cyan-100'
                                  : isCompleted
                                    ? 'border-emerald-300/30 bg-emerald-300/15 text-emerald-100'
                                    : 'border-white/10 bg-white/5 text-slate-300'
                              )}
                            >
                              {isCompleted ? (
                                <CheckCircle2 className="h-4 w-4" />
                              ) : (
                                <Icon className="h-4 w-4" />
                              )}
                            </div>
                            <div className="min-w-0">
                              <p className="font-sans text-[10px] font-bold uppercase tracking-[0.24em] text-slate-400">
                                Step {index + 1}
                              </p>
                              <p className="mt-1 font-sans text-sm font-semibold uppercase tracking-[0.14em] text-white">
                                {label}
                              </p>
                              <p className="mt-1 text-xs leading-5 text-slate-300">
                                {description}
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Step 1: Select Items */}
      <RegenerateDialog
        open={isSelectDialogOpen}
        onOpenChange={handleSelectDialogClose}
        experienceItems={experienceItems}
        projectItems={projectItems}
        skillsItem={skillsItem}
        selectedItems={selectedItems}
        onSelectionChange={onSelectionChange}
        onContinue={handleContinueToInstruction}
      />

      {/* Step 2: Enter Instructions */}
      <RegenerateInstructionDialog
        open={isInstructionDialogOpen}
        onOpenChange={handleInstructionDialogClose}
        selectedItems={selectedItems}
        instruction={instruction}
        onInstructionChange={onInstructionChange}
        error={error}
        onBack={handleBackToSelection}
        onGenerate={onGenerate}
        isGenerating={isGenerating}
      />

      {/* Step 3: Preview Diff */}
      <RegenerateDiffPreview
        open={isDiffPreviewOpen}
        onOpenChange={handleDiffPreviewClose}
        regeneratedItems={regeneratedItems}
        regenerateErrors={regenerateErrors}
        error={error}
        onAccept={onAccept}
        onReject={onReject}
        isApplying={isApplying}
      />
    </>
  );
};

export default RegenerateWizard;
