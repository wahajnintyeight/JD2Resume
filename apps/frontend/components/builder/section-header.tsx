'use client';

import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { ChevronUp, ChevronDown, Trash2, Eye, EyeOff, Pencil, Check, X } from 'lucide-react';
import type { SectionMeta } from '@/components/dashboard/resume-component';
import { useTranslations } from '@/lib/i18n';

interface SectionHeaderProps {
  section: SectionMeta;
  onRename: (newName: string) => void;
  onDelete: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onToggleVisibility: () => void;
  isFirst: boolean;
  isLast: boolean;
  canDelete: boolean;
  children?: React.ReactNode;
}

/**
 * SectionHeader Component
 *
 * Provides controls for section management:
 * - Editable display name
 * - Move up/down buttons for reordering
 * - Delete button with confirmation
 * - Visibility toggle
 */
export const SectionHeader: React.FC<SectionHeaderProps> = ({
  section,
  onRename,
  onDelete,
  onMoveUp,
  onMoveDown,
  onToggleVisibility,
  isFirst,
  isLast,
  canDelete,
  children,
}) => {
  const { t } = useTranslations();
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState(section.displayName);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleStartEdit = () => {
    setEditedName(section.displayName);
    setIsEditing(true);
  };

  const handleSaveEdit = () => {
    if (editedName.trim()) {
      onRename(editedName.trim());
    }
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setEditedName(section.displayName);
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSaveEdit();
    } else if (e.key === 'Escape') {
      handleCancelEdit();
    }
  };

  const handleDeleteClick = () => {
    if (section.isDefault) {
      // For default sections, just toggle visibility
      onToggleVisibility();
    } else {
      // For custom sections, show confirmation
      setShowDeleteConfirm(true);
    }
  };

  const isPersonalInfo = section.id === 'personalInfo';
  const isHidden = !section.isVisible;

  return (
    <div
      className={cn(
        'relative transition-all duration-300 mb-8 group/section',
        isHidden && 'opacity-40 grayscale'
      )}
    >
      <div className="flex justify-end mb-3 px-2 opacity-20 group-hover/section:opacity-100 focus-within:opacity-100 transition-opacity">
        <div className="flex items-center gap-1 bg-white/[0.03] p-1.5 flex-wrap rounded-[1.2rem] border border-white/10 backdrop-blur-sm">
          {isEditing ? (
            <div className="flex items-center gap-2 mr-2 ml-1">
              <Input
                value={editedName}
                onChange={(e) => setEditedName(e.target.value)}
                onBlur={handleSaveEdit}
                onKeyDown={handleKeyDown}
                autoFocus
                className="h-9 px-3 rounded-xl border border-cyan-300/30 font-sans text-sm tracking-wide bg-slate-900/50 text-white w-[180px] focus-visible:ring-1 focus-visible:ring-cyan-300/50"
              />
              <Button
                size="icon"
                variant="ghost"
                onClick={handleSaveEdit}
                className="h-9 w-9 rounded-xl text-emerald-400 hover:bg-emerald-400/10 hover:text-emerald-300"
              >
                <Check className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <Button
              size="sm"
              variant="ghost"
              onClick={handleStartEdit}
              className="h-9 px-3 rounded-xl text-slate-400 hover:text-cyan-300 hover:bg-white/5 font-sans text-[11px] tracking-[0.2em] uppercase font-bold"
            >
              <Pencil className="h-3.5 w-3.5 mr-2" />
              {t('common.edit')}
            </Button>
          )}

          <div className="w-px h-5 bg-white/10 mx-1 hidden sm:block" />

          <Button
            size="icon"
            variant="ghost"
            onClick={onMoveUp}
            disabled={isFirst || isPersonalInfo}
            className="h-9 w-9 rounded-xl text-slate-400 hover:text-cyan-300 hover:bg-white/5 disabled:opacity-30 disabled:hover:bg-transparent"
          >
            <ChevronUp className="h-5 w-5" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            onClick={onMoveDown}
            disabled={isLast || isPersonalInfo}
            className="h-9 w-9 rounded-xl text-slate-400 hover:text-cyan-300 hover:bg-white/5 disabled:opacity-30 disabled:hover:bg-transparent"
          >
            <ChevronDown className="h-5 w-5" />
          </Button>
          <div className="w-px h-5 bg-white/10 mx-1 hidden sm:block" />
          <Button
            size="icon"
            variant="ghost"
            onClick={onToggleVisibility}
            className={cn(
              'h-9 w-9 rounded-xl transition-all',
              isHidden
                ? 'text-slate-500 hover:text-slate-300 hover:bg-white/5'
                : 'text-cyan-300 hover:bg-white/5'
            )}
          >
            {isHidden ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
          </Button>
          <Button
            size="icon"
            variant="ghost"
            onClick={handleDeleteClick}
            disabled={!canDelete}
            className="h-9 w-9 rounded-xl text-slate-500 hover:text-rose-400 hover:bg-rose-400/10 disabled:opacity-30 disabled:hover:bg-transparent"
          >
            <Trash2 className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Section Content */}
      {children}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={showDeleteConfirm}
        onOpenChange={setShowDeleteConfirm}
        title={t('builder.sectionHeader.deleteTitle')}
        description={t('builder.sectionHeader.deleteDescription', { name: section.displayName })}
        confirmLabel={t('common.delete')}
        cancelLabel={t('common.cancel')}
        variant="danger"
        onConfirm={onDelete}
      />
    </div>
  );
};
