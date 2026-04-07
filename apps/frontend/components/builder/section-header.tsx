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
        "space-y-0 rounded-2xl border border-slate-200 bg-white p-8 shadow-sm transition-all duration-300",
        isHidden && "border-dashed bg-slate-50/50 opacity-50 grayscale"
      )}
    >
      {/* Section Header - Modern Design */}
      <div className="flex justify-between items-center border-b border-slate-100 pb-6 mb-8">
        {/* Section Name (editable) */}
        <div className="flex items-center gap-4">
          <div className={cn(
            "w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm transition-colors",
            isHidden ? "bg-slate-200 text-slate-400" : "bg-primary/10 text-primary"
          )}>
            <span className="font-serif text-xl font-black uppercase">{section.displayName.charAt(0)}</span>
          </div>
          
          {isEditing ? (
            <div className="flex items-center gap-2">
              <Input
                value={editedName}
                onChange={(e) => setEditedName(e.target.value)}
                onBlur={handleSaveEdit}
                onKeyDown={handleKeyDown}
                autoFocus
                className="h-10 px-4 rounded-xl border-primary font-serif text-xl font-black uppercase tracking-tight bg-white min-w-[200px]"
              />
              <Button size="icon" variant="ghost" onClick={handleSaveEdit} className="h-10 w-10 rounded-xl text-green-600 hover:bg-green-50">
                <Check className="h-5 w-5" />
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-3 group/title">
              <h3 className="font-serif text-2xl font-black uppercase tracking-tight text-slate-900">
                {section.displayName}
              </h3>
              <button
                onClick={handleStartEdit}
                className="opacity-0 group-hover/title:opacity-100 p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-primary transition-all"
              >
                <Pencil className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>

        {/* Section Controls - Clean Icon Row */}
        <div className="flex items-center gap-1 bg-slate-50 p-1.5 rounded-2xl border border-slate-100">
          <Button
            size="icon"
            variant="ghost"
            onClick={onMoveUp}
            disabled={isFirst || isPersonalInfo}
            className="h-9 w-9 rounded-xl text-slate-500 hover:text-primary hover:bg-white hover:shadow-sm disabled:opacity-30"
          >
            <ChevronUp className="h-5 w-5" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            onClick={onMoveDown}
            disabled={isLast || isPersonalInfo}
            className="h-9 w-9 rounded-xl text-slate-500 hover:text-primary hover:bg-white hover:shadow-sm disabled:opacity-30"
          >
            <ChevronDown className="h-5 w-5" />
          </Button>
          <div className="w-px h-5 bg-slate-200 mx-1" />
          <Button
            size="icon"
            variant="ghost"
            onClick={onToggleVisibility}
            className={cn(
              "h-9 w-9 rounded-xl transition-all",
              isHidden 
                ? "text-slate-400 hover:text-slate-600 hover:bg-white hover:shadow-sm" 
                : "text-primary hover:bg-white hover:shadow-sm"
            )}
          >
            {isHidden ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
          </Button>
          <Button
            size="icon"
            variant="ghost"
            onClick={handleDeleteClick}
            disabled={!canDelete}
            className="h-9 w-9 rounded-xl text-slate-400 hover:text-red-600 hover:bg-white hover:shadow-sm disabled:opacity-30"
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
