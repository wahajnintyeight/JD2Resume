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
      onToggleVisibility();
    } else {
      setShowDeleteConfirm(true);
    }
  };

  const isPersonalInfo = section.id === 'personalInfo';
  const isHidden = !section.isVisible;

  return (
    <div
      className={cn(
        'relative mb-6 transition-all group/section',
        isHidden && 'opacity-40 grayscale'
      )}
    >
      <div className="mb-2 flex justify-end px-1 opacity-0 transition-opacity group-hover/section:opacity-100 focus-within:opacity-100">
        <div className="flex items-center border border-black bg-white">
          {isEditing ? (
            <div className="flex items-center gap-1 p-1">
              <Input
                value={editedName}
                onChange={(e) => setEditedName(e.target.value)}
                onBlur={handleSaveEdit}
                onKeyDown={handleKeyDown}
                autoFocus
                className="h-8 w-40 rounded-none border border-black bg-white px-2 font-sans text-sm text-black focus-visible:ring-1 focus-visible:ring-[#1D4ED8]"
              />
              <Button
                size="icon"
                variant="ghost"
                onClick={handleSaveEdit}
                className="h-8 w-8 rounded-none border border-black bg-white text-[#15803D] hover:bg-[#15803D] hover:text-white"
              >
                <Check className="h-4 w-4" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                onClick={handleCancelEdit}
                className="h-8 w-8 rounded-none border border-black bg-white text-[#DC2626] hover:bg-[#DC2626] hover:text-white"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <Button
              size="sm"
              variant="ghost"
              onClick={handleStartEdit}
              className="h-8 rounded-none border-r border-black bg-white px-3 font-mono text-[10px] font-bold uppercase tracking-wider text-black hover:bg-[#1D4ED8] hover:text-white"
            >
              <Pencil className="mr-1 h-3 w-3" />
              {t('common.edit')}
            </Button>
          )}

          <Button
            size="icon"
            variant="ghost"
            onClick={onMoveUp}
            disabled={isFirst || isPersonalInfo}
            className="h-8 w-8 rounded-none border-r border-black bg-white text-black hover:bg-[#1D4ED8] hover:text-white disabled:opacity-30 disabled:hover:bg-white disabled:hover:text-black"
          >
            <ChevronUp className="h-4 w-4" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            onClick={onMoveDown}
            disabled={isLast || isPersonalInfo}
            className="h-8 w-8 rounded-none border-r border-black bg-white text-black hover:bg-[#1D4ED8] hover:text-white disabled:opacity-30 disabled:hover:bg-white disabled:hover:text-black"
          >
            <ChevronDown className="h-4 w-4" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            onClick={onToggleVisibility}
            className={cn(
              'h-8 w-8 rounded-none border-r border-black bg-white transition-colors hover:text-white',
              isHidden ? 'text-[#4B5563] hover:bg-[#F97316]' : 'text-black hover:bg-[#F97316]'
            )}
          >
            {isHidden ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </Button>
          <Button
            size="icon"
            variant="ghost"
            onClick={handleDeleteClick}
            disabled={!canDelete}
            className="h-8 w-8 rounded-none border-0 bg-white text-[#DC2626] hover:bg-[#DC2626] hover:text-white disabled:opacity-30 disabled:hover:bg-white disabled:hover:text-[#DC2626]"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {children}

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
