'use client';

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  Check,
  RefreshCw,
  ChevronDown,
  ChevronRight,
  Briefcase,
  FolderKanban,
  Lightbulb,
  Sparkles,
} from 'lucide-react';
import { useTranslations } from '@/lib/i18n';
import type { RegenerateItemError, RegeneratedItem } from '@/lib/api/enrichment';

interface RegenerateDiffPreviewProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  regeneratedItems: RegeneratedItem[];
  regenerateErrors?: RegenerateItemError[];
  error: string | null;
  onAccept: () => void;
  onReject: () => void;
  isApplying: boolean;
}

/**
 * RegenerateDiffPreview Component
 *
 * Third step of the regenerate wizard.
 * Shows side-by-side comparison of original vs regenerated content.
 * Swiss International Style design.
 */
export const RegenerateDiffPreview: React.FC<RegenerateDiffPreviewProps> = ({
  open,
  onOpenChange,
  regeneratedItems,
  regenerateErrors = [],
  error,
  onAccept,
  onReject,
  isApplying,
}) => {
  const { t } = useTranslations();
  const [expandedItems, setExpandedItems] = React.useState<Set<string>>(
    new Set(regeneratedItems.map((item) => item.item_id))
  );

  React.useEffect(() => {
    // Expand all items when regeneratedItems changes
    setExpandedItems(new Set(regeneratedItems.map((item) => item.item_id)));
  }, [regeneratedItems]);

  const toggleItem = (itemId: string) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(itemId)) {
      newExpanded.delete(itemId);
    } else {
      newExpanded.add(itemId);
    }
    setExpandedItems(newExpanded);
  };

  type ItemLabelSource = Pick<RegeneratedItem, 'item_id' | 'item_type' | 'title' | 'subtitle'>;

  const getItemLabel = (item: ItemLabelSource) => {
    if (item.item_type === 'skills') {
      return t('builder.regenerate.selectDialog.skills');
    }

    const title = item.title?.trim();
    const subtitle = item.subtitle?.trim();

    if (title && subtitle) {
      return `${title} | ${subtitle}`;
    }

    return title || item.item_id;
  };

  const getItemIcon = (itemType: string) => {
    switch (itemType) {
      case 'experience':
        return <Briefcase className="w-4 h-4" />;
      case 'project':
        return <FolderKanban className="w-4 h-4" />;
      case 'skills':
        return <Lightbulb className="w-4 h-4" />;
      default:
        return null;
    }
  };

  const resolveErrorMessage = (value: string) => {
    if (value === 'No changes to apply') {
      return t('builder.regenerate.errors.noChangesToApply');
    }

    if (/network|fetch/i.test(value) || value.includes('Failed to fetch')) {
      return t('builder.regenerate.errors.networkError');
    }

    if (/resume content changed|uniquely matched|please regenerate/i.test(value)) {
      return t('builder.regenerate.errors.resumeChanged');
    }

    return t('builder.regenerate.errors.applyFailed');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="overflow-hidden border-2 border-cyan-400/30 bg-transparent p-0 shadow-[0_32px_120px_rgba(2,6,23,0.72)] backdrop-blur-0 sm:max-w-[900px] max-h-[90vh]">
        <div className="relative flex flex-col max-h-[90vh]">
          {/* Background layers */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(34,211,238,0.16),_transparent_28%),radial-gradient(circle_at_top_right,_rgba(244,114,182,0.16),_transparent_24%),linear-gradient(180deg,_rgba(2,6,23,0.96),_rgba(15,23,42,0.95))]" />
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-300/50 to-transparent" />
          
          <div className="relative flex flex-col max-h-[90vh]">
            <DialogHeader className="border-b-2 border-cyan-400/30 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 px-6 pb-5 pt-6 shrink-0">
              <div className="inline-flex items-center gap-2 mb-4 px-4 py-2 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border border-cyan-400/40 backdrop-blur-md w-fit">
                <Sparkles className="w-4 h-4 text-cyan-400 animate-pulse" />
                <span className="text-xs font-bold tracking-[0.3em] text-cyan-300 font-mono">
                  STEP 3
                </span>
              </div>
              <DialogTitle className="text-3xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 [font-family:'Orbitron',system-ui,sans-serif]">
                {t('builder.regenerate.diffPreview.title')}
              </DialogTitle>
              <DialogDescription className="text-sm text-cyan-100/70 font-mono mt-2">
                {t('builder.regenerate.diffPreview.subtitle')}
              </DialogDescription>
            </DialogHeader>

            {/* Stats Card */}
            <div className="px-6 pt-5 bg-[#0a0a0f] shrink-0">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-950/30 border border-emerald-500/40 backdrop-blur-sm">
                <Check className="w-4 h-4 text-emerald-400" />
                <span className="font-mono text-sm text-emerald-200 font-bold tracking-wider">
                  {t('builder.regenerate.diffPreview.changesCount').replace(
                    '{count}',
                    String(regeneratedItems.length)
                  )}
                </span>
              </div>
            </div>

            {error && (
              <div className="px-6 pt-4 bg-[#0a0a0f] shrink-0">
                <div className="border-2 border-rose-500/60 bg-rose-950/30 backdrop-blur-sm p-4 relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-r from-rose-500/10 to-red-500/10 animate-pulse" />
                  <p className="font-mono text-sm text-rose-200 relative z-10">{resolveErrorMessage(error)}</p>
                </div>
              </div>
            )}

            {regenerateErrors.length > 0 && (
              <div className="px-6 pt-4 bg-[#0a0a0f] shrink-0">
                <div className="border-2 border-amber-500/60 bg-amber-950/30 backdrop-blur-sm p-4">
                  <p className="font-mono text-sm text-amber-200 font-bold">
                    {t('builder.regenerate.diffPreview.partialFailures', {
                      count: regenerateErrors.length,
                    })}
                  </p>
                  <ul className="mt-3 space-y-1">
                    {regenerateErrors.map((failed) => (
                      <li key={failed.item_id} className="font-mono text-xs text-amber-300/80">
                        <span className="text-amber-400">&gt;</span> {getItemLabel(failed)}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {/* Diff Content */}
            <div className="p-6 space-y-4 overflow-y-auto bg-[#0a0a0f] flex-1">
              {regeneratedItems.map((item) => (
                <div key={item.item_id} className="border-2 border-cyan-400/30 bg-slate-950/50 backdrop-blur-sm overflow-hidden">
                  {/* Item Header */}
                  <button
                    type="button"
                    onClick={() => toggleItem(item.item_id)}
                    aria-expanded={expandedItems.has(item.item_id)}
                    aria-label={
                      expandedItems.has(item.item_id)
                        ? t('builder.regenerate.diffPreview.collapseItem', { item: getItemLabel(item) })
                        : t('builder.regenerate.diffPreview.expandItem', { item: getItemLabel(item) })
                    }
                    className="w-full p-4 flex items-center justify-between bg-slate-900/50 hover:bg-slate-900/70 transition-colors border-b border-cyan-400/20"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 border border-cyan-400/40 bg-cyan-500/10 flex items-center justify-center text-cyan-400">
                        {getItemIcon(item.item_type)}
                      </div>
                      <span className="font-mono text-sm tracking-wider font-semibold text-cyan-100 truncate">
                        {getItemLabel(item)}
                      </span>
                    </div>
                    <div className="w-8 h-8 border border-cyan-400/40 bg-slate-950/50 flex items-center justify-center text-cyan-300">
                      {expandedItems.has(item.item_id) ? (
                        <ChevronDown className="w-4 h-4" />
                      ) : (
                        <ChevronRight className="w-4 h-4" />
                      )}
                    </div>
                  </button>

                  {/* Item Diff Content */}
                  {expandedItems.has(item.item_id) && (
                    <div>
                      {/* Change Summary */}
                      {item.diff_summary && (
                        <div className="p-4 border-b border-cyan-400/20 bg-blue-950/20">
                          <p className="font-mono text-sm text-blue-300">{item.diff_summary}</p>
                        </div>
                      )}

                      {/* Original Content */}
                      <div className="p-5 border-b border-cyan-400/20">
                        <div className="font-mono text-xs uppercase tracking-[0.25em] text-rose-400 mb-3 flex items-center gap-2 font-bold">
                          <span className="w-3 h-3 bg-rose-500 border border-rose-400" />
                          {t('builder.regenerate.diffPreview.originalLabel')}
                        </div>
                        <div className="border border-rose-500/40 bg-rose-950/20 p-4 space-y-2">
                          {item.original_content.length > 0 ? (
                            item.original_content.map((content, idx) => (
                              <p key={idx} className="text-sm text-rose-200 line-through font-mono">
                                <span className="text-rose-400 mr-2">−</span>
                                {content}
                              </p>
                            ))
                          ) : (
                            <p className="text-sm text-cyan-400/40 italic font-mono">
                              {t('builder.regenerate.diffPreview.noContent')}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* New Content */}
                      <div className="p-5">
                        <div className="font-mono text-xs uppercase tracking-[0.25em] text-emerald-400 mb-3 flex items-center gap-2 font-bold">
                          <span className="w-3 h-3 bg-emerald-500 border border-emerald-400" />
                          {t('builder.regenerate.diffPreview.newLabel')}
                        </div>
                        <div className="border border-emerald-500/40 bg-emerald-950/20 p-4 space-y-2">
                          {item.new_content.length > 0 ? (
                            item.new_content.map((content, idx) => (
                              <p key={idx} className="text-sm text-emerald-200 font-mono">
                                <span className="text-emerald-400 mr-2">+</span>
                                {content}
                              </p>
                            ))
                          ) : (
                            <p className="text-sm text-cyan-400/40 italic font-mono">
                              {t('builder.regenerate.diffPreview.noContent')}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            <DialogFooter className="border-t-2 border-cyan-400/30 bg-slate-950/80 backdrop-blur-sm px-6 py-4 flex-row justify-between gap-3 shrink-0">
              <Button
                variant="outline"
                onClick={onReject}
                disabled={isApplying}
                className="h-12 bg-slate-950/50 hover:bg-slate-900/70 text-cyan-300 hover:text-cyan-200 font-bold tracking-[0.15em] text-sm border border-cyan-400/40 hover:border-cyan-400 backdrop-blur-sm transition-all font-mono"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                {t('builder.regenerate.diffPreview.rejectButton').toUpperCase()}
              </Button>
              <Button
                onClick={onAccept}
                disabled={isApplying}
                className="h-12 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-400 hover:to-green-500 text-white font-bold tracking-[0.15em] text-sm border border-emerald-400/40 hover:border-emerald-400 transition-all disabled:opacity-50 font-mono relative overflow-hidden group"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-400/0 via-white/20 to-emerald-400/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
                {isApplying ? (
                  <span className="flex items-center gap-2 relative z-10">
                    <Check className="w-4 h-4 animate-spin" />
                    {t('builder.regenerate.diffPreview.applying').toUpperCase()}
                  </span>
                ) : (
                  <span className="flex items-center gap-2 relative z-10">
                    <Check className="w-4 h-4" />
                    {t('builder.regenerate.diffPreview.acceptButton').toUpperCase()}
                  </span>
                )}
              </Button>
            </DialogFooter>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default RegenerateDiffPreview;
