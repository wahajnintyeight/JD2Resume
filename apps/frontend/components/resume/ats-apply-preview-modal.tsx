'use client';

import { useState } from 'react';
import { AlertTriangle, CheckCircle, X, ChevronDown, ChevronRight, Target } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import Loader2 from 'lucide-react/dist/esm/icons/loader-2';
import type { ATSFieldDiff, ATSDiffSummary } from '@/lib/api/resume';

interface ATSApplyPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onReject: () => void;
  onConfirm: () => void;
  diffSummary?: ATSDiffSummary;
  detailedChanges?: ATSFieldDiff[];
  isLoading?: boolean;
  errorMessage?: string;
}

export function ATSApplyPreviewModal({
  isOpen,
  onClose,
  onReject,
  onConfirm,
  diffSummary,
  detailedChanges,
  isLoading = false,
  errorMessage,
}: ATSApplyPreviewModalProps) {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(['title', 'summary', 'skills', 'descriptions'])
  );

  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(section)) {
      newExpanded.delete(section);
    } else {
      newExpanded.add(section);
    }
    setExpandedSections(newExpanded);
  };

  // Loading state
  if (isLoading) {
    return (
      <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-hidden flex flex-col p-6 bg-[#F0F0E8] border-2 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
          <div className="flex flex-col items-center justify-center py-16">
            <div className="relative mb-6">
              <div className="w-16 h-16 border-4 border-blue-700 border-t-transparent rounded-full animate-spin" />
              <div className="absolute inset-0 flex items-center justify-center">
                <Target className="w-6 h-6 text-blue-700 animate-pulse" />
              </div>
            </div>
            <p className="font-mono text-lg font-bold uppercase text-blue-700 animate-pulse">
              Analyzing Changes...
            </p>
            <p className="font-mono text-xs text-gray-500 mt-2 text-center max-w-md">
              Applying ATS suggestions and calculating the diff
            </p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // Error state
  if (errorMessage) {
    return (
      <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-hidden flex flex-col p-6 bg-[#F0F0E8] border-2 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
          <DialogHeader className="border-b-2 border-black pb-4 bg-white -mx-6 -mt-6 px-6 pt-6">
            <DialogTitle className="font-serif text-2xl font-bold uppercase tracking-tight text-red-700">
              Error
            </DialogTitle>
          </DialogHeader>

          <div className="mt-6 border-2 border-red-600 bg-red-50 p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-1" />
              <p className="font-mono text-sm text-red-800">{errorMessage}</p>
            </div>
          </div>

          <div className="flex justify-end items-center gap-3 pt-4 border-t-2 border-black bg-white -mx-6 -mb-6 px-6 py-4">
            <Button variant="outline" onClick={onClose} className="font-mono uppercase">
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // No changes state
  if (!diffSummary || !detailedChanges || detailedChanges.length === 0) {
    return (
      <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-hidden flex flex-col p-6 bg-[#F0F0E8] border-2 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
          <DialogHeader className="border-b-2 border-black pb-4 bg-white -mx-6 -mt-6 px-6 pt-6">
            <DialogTitle className="font-serif text-2xl font-bold uppercase tracking-tight">
              No Changes Needed
            </DialogTitle>
          </DialogHeader>

          <div className="mt-6 border-2 border-green-700 bg-green-50 p-6 text-center">
            <CheckCircle className="w-12 h-12 text-green-700 mx-auto mb-4" />
            <p className="font-mono text-sm text-green-800">
              Your resume already meets all the ATS requirements!
              <br />
              No automatic changes are needed.
            </p>
          </div>

          <div className="flex justify-end items-center gap-3 pt-4 border-t-2 border-black bg-white -mx-6 -mb-6 px-6 py-4">
            <Button variant="outline" onClick={onClose} className="font-mono uppercase">
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // Group changes by type
  const titleChanges = detailedChanges.filter((c) => c.field_type === 'title');
  const summaryChanges = detailedChanges.filter((c) => c.field_type === 'summary');
  const skillChanges = detailedChanges.filter((c) => c.field_type === 'skill');
  const descChanges = detailedChanges.filter((c) => c.field_type === 'description');

  const ChangeSection = ({
    title,
    changes,
    sectionKey,
    icon: Icon,
  }: {
    title: string;
    changes: ATSFieldDiff[];
    sectionKey: string;
    icon: React.ComponentType<{ className?: string }>;
  }) => {
    if (changes.length === 0) return null;

    const isExpanded = expandedSections.has(sectionKey);

    return (
      <div className="border-2 border-black mb-4 bg-white">
        <button
          onClick={() => toggleSection(sectionKey)}
          className="w-full p-3 flex items-center justify-between hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-center gap-2">
            <Icon className="w-5 h-5 text-gray-700" />
            <span className="font-mono text-sm font-bold uppercase">{title}</span>
            <span className="font-mono text-xs text-gray-500">({changes.length} changes)</span>
          </div>
          {isExpanded ? (
            <ChevronDown className="w-5 h-5 text-gray-700" />
          ) : (
            <ChevronRight className="w-5 h-5 text-gray-700" />
          )}
        </button>

        {isExpanded && (
          <div className="border-t-2 border-black p-3 space-y-3">
            {changes.map((change, idx) => (
              <div key={idx} className="space-y-2">
                {change.context && (
                  <p className="font-mono text-xs text-gray-500">{change.context}</p>
                )}
                
                {change.change_type === 'added' && (
                  <div className="flex items-start gap-2">
                    <span className="font-mono text-xs text-green-700 font-bold">+</span>
                    <span className="font-mono text-sm text-green-800 bg-green-50 px-2 py-1 rounded">
                      {change.new_value}
                    </span>
                  </div>
                )}

                {change.change_type === 'removed' && (
                  <div className="flex items-start gap-2">
                    <span className="font-mono text-xs text-red-700 font-bold">-</span>
                    <span className="font-mono text-sm text-red-800 bg-red-50 px-2 py-1 rounded line-through">
                      {change.original_value}
                    </span>
                  </div>
                )}

                {change.change_type === 'modified' && (
                  <div className="space-y-1">
                    <div className="flex items-start gap-2">
                      <span className="font-mono text-xs text-red-700 font-bold">-</span>
                      <span className="font-mono text-sm text-red-800 bg-red-50 px-2 py-1 rounded line-through">
                        {change.original_value}
                      </span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="font-mono text-xs text-green-700 font-bold">+</span>
                      <span className="font-mono text-sm text-green-800 bg-green-50 px-2 py-1 rounded">
                        {change.new_value}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col p-0 bg-[#F0F0E8] border-2 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
        <DialogHeader className="border-b-2 border-black pb-4 bg-white px-6 pt-6">
          <DialogTitle className="font-serif text-2xl font-bold uppercase tracking-tight flex items-center gap-2">
            <Target className="w-6 h-6 text-blue-700" />
            Apply ATS Suggestions
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-6">
          {/* Summary Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            <div className="border-2 border-black bg-white p-3 text-center">
              <div className="text-2xl font-bold text-blue-700">{diffSummary.total_changes}</div>
              <div className="font-mono text-xs text-gray-600">Total Changes</div>
            </div>
            <div className="border-2 border-black bg-white p-3 text-center">
              <div className="text-2xl font-bold text-green-700">{diffSummary.skills_added}</div>
              <div className="font-mono text-xs text-gray-600">Skills Added</div>
            </div>
            <div className="border-2 border-black bg-white p-3 text-center">
              <div className="text-2xl font-bold text-yellow-700">{diffSummary.descriptions_modified}</div>
              <div className="font-mono text-xs text-gray-600">Descriptions Updated</div>
            </div>
            <div className="border-2 border-black bg-white p-3 text-center">
              <div className="text-2xl font-bold text-purple-700">
                {diffSummary.title_changed || diffSummary.summary_changed ? 'Yes' : 'No'}
              </div>
              <div className="font-mono text-xs text-gray-600">Title/Summary Changed</div>
            </div>
          </div>

          {/* Warning for high-risk changes */}
          {diffSummary.skills_added > 0 && (
            <div className="border-2 border-orange-600 bg-orange-50 p-4 mb-6 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-orange-600 shrink-0 mt-1" />
              <div>
                <h4 className="font-mono text-sm font-bold uppercase text-orange-900 mb-1">
                  Review Skills Before Applying
                </h4>
                <p className="font-mono text-xs text-orange-800">
                  {diffSummary.skills_added} skill(s) will be added to your resume. 
                  Please review to ensure they accurately reflect your experience.
                </p>
              </div>
            </div>
          )}

          {/* Detailed Changes */}
          <div className="space-y-1">
            <ChangeSection
              title="Job Title"
              changes={titleChanges}
              sectionKey="title"
              icon={CheckCircle}
            />
            <ChangeSection
              title="Summary / Headline"
              changes={summaryChanges}
              sectionKey="summary"
              icon={CheckCircle}
            />
            <ChangeSection
              title="Technical Skills"
              changes={skillChanges}
              sectionKey="skills"
              icon={CheckCircle}
            />
            <ChangeSection
              title="Experience Descriptions"
              changes={descChanges}
              sectionKey="descriptions"
              icon={CheckCircle}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center gap-3 pt-4 border-t-2 border-black bg-white px-6 py-4">
          <Button variant="outline" onClick={onReject} className="font-mono uppercase">
            Cancel
          </Button>
          <div className="flex gap-3">
            <Button variant="outline" onClick={onClose} className="font-mono uppercase">
              Close
            </Button>
            <Button
              onClick={onConfirm}
              className="font-mono uppercase bg-blue-700 hover:bg-blue-800 text-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all"
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              Apply Changes
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
