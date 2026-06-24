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
      {!disabled && (
        <div
          {...attributes}
          {...listeners}
          className="absolute -left-10 top-3 z-20 hidden h-8 w-8 cursor-grab items-center justify-center border border-black bg-white text-black opacity-0 transition-opacity hover:bg-[#F0F0E8] active:cursor-grabbing group-hover:opacity-100 lg:flex"
          title="Drag to reorder"
        >
          <GripVertical className="h-4 w-4" />
        </div>
      )}

      <div className="w-full">{children}</div>
    </div>
  );
};
