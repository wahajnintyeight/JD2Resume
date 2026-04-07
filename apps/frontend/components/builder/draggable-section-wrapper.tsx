'use client';

import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DraggableSectionWrapperProps {
  id: string;
  children: React.ReactNode;
  disabled?: boolean;
}

/**
 * DraggableSectionWrapper Component
 *
 * Wraps resume sections to make them draggable using @dnd-kit.
 * Provides:
 * - Drag handle (grip icon) for initiating drag operations
 * - Visual feedback during drag (opacity, cursor)
 * - Keyboard accessibility for drag operations
 * - Swiss International Style aesthetic (square corners, high contrast)
 */
export const DraggableSectionWrapper: React.FC<DraggableSectionWrapperProps> = ({
  id,
  children,
  disabled = false,
}) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id,
    disabled,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className={cn('relative group', isDragging && 'z-50')}>
      {/* Drag Handle - Modern Floating Design */}
      {!disabled && (
        <div
          {...attributes}
          {...listeners}
          className="absolute -left-12 top-8 h-10 w-10 flex items-center justify-center cursor-grab active:cursor-grabbing z-20 bg-white border border-slate-200 rounded-xl shadow-sm opacity-0 group-hover:opacity-100 transition-all hover:border-primary/30 hover:shadow-md"
          title="Drag to reorder"
        >
          <GripVertical className="w-5 h-5 text-slate-400 group-hover:text-primary transition-colors" />
        </div>
      )}

      {/* Section Content */}
      <div className="w-full">{children}</div>
    </div>
  );
};
