'use client';

import React, { useState } from 'react';
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
      className={`space-y-0 border p-6 bg-white/[0.02] rounded-lg ${
        isHidden ? 'border-dashed border-white/20 opacity-60' : 'border-white/10'
      }`}
    >
      {/* Section Header */}
      <div className="flex justify-between items-center border-b border-white/10 pb-2 mb-4">
        {/* Section Name (editable) */}
        <div className="flex items-center gap-2">
          {isEditing ? (
            <div className="flex items-center gap-1">
              <Input
                value={editedName}
                onChange={(e) => setEditedName(e.target.value)}
                onKeyDown={handleKeyDown}
                className="h-8 w-48 bg-white/[0.02] border-white/10 font-bold text-white"
                autoFocus
              />
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10"
                onClick={handleSaveEdit}
              >
                <Check className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-white/40 hover:text-white/60 hover:bg-white/[0.05]"
                onClick={handleCancelEdit}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          ) : (
            <>
              <h3 className="text-xl font-bold text-white">{section.displayName}</h3>
              {!isPersonalInfo && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 text-white/40 hover:text-white/60"
                  onClick={handleStartEdit}
                  title={t('builder.sectionHeader.renameSection')}
                >
                  <Pencil className="w-3 h-3" />
                </Button>
              )}
              {!section.isDefault && (
                <span className="text-[10px] font-bold uppercase tracking-widest text-white/40 bg-white/[0.02] px-1.5 py-0.5 border border-white/10 rounded">
                  {t('builder.sectionHeader.customTag')}
                </span>
              )}
              {isHidden && (
                <span className="text-[10px] font-bold uppercase tracking-widest text-amber-400 bg-amber-500/10 px-1.5 py-0.5 border border-amber-500/20 rounded">
                  {t('builder.sectionHeader.hiddenFromPdfTag')}
                </span>
              )}
            </>
          )}
        </div>

        {/* Section Controls */}
        <div className="flex items-center gap-1">
          {/* Visibility Toggle */}
          {!isPersonalInfo && (
            <Button
              variant="ghost"
              size="icon"
              className={`h-8 w-8 ${section.isVisible ? 'text-white/40 hover:text-white/60' : 'text-white/20'}`}
              onClick={onToggleVisibility}
              title={
                section.isVisible
                  ? t('builder.sectionHeader.hideSection')
                  : t('builder.sectionHeader.showSection')
              }
            >
              {section.isVisible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
            </Button>
          )}

          {/* Move Up */}
          {!isPersonalInfo && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-white/40 hover:text-white/60 disabled:opacity-30"
              onClick={onMoveUp}
              disabled={isFirst}
              title={t('builder.sectionHeader.moveUp')}
            >
              <ChevronUp className="w-4 h-4" />
            </Button>
          )}

          {/* Move Down */}
          {!isPersonalInfo && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-white/40 hover:text-white/60 disabled:opacity-30"
              onClick={onMoveDown}
              disabled={isLast}
              title={t('builder.sectionHeader.moveDown')}
            >
              <ChevronDown className="w-4 h-4" />
            </Button>
          )}

          {/* Delete / Hide */}
          {canDelete && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-red-400 hover:text-red-300 hover:bg-red-500/10"
              onClick={handleDeleteClick}
              title={
                section.isDefault
                  ? section.isVisible
                    ? t('builder.sectionHeader.hideSection')
                    : t('builder.sectionHeader.showSection')
                  : t('builder.sectionHeader.deleteSection')
              }
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          )}
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
