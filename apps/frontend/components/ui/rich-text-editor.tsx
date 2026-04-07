'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Underline from '@tiptap/extension-underline';
import Placeholder from '@tiptap/extension-placeholder';
import { LinkDialog } from './link-dialog';
import { cn } from '@/lib/utils';

interface RichTextEditorProps {
  /** HTML content string */
  value: string;
  /** Called when content changes with new HTML string */
  onChange: (html: string) => void;
  /** Placeholder text shown when editor is empty */
  placeholder?: string;
  /** Additional CSS classes for the container */
  className?: string;
  /** Minimum height of the editor */
  minHeight?: string;
}

/**
 * Rich Text Editor Component
 *
 * Modern WYSIWYG editor with inline formatting.
 * Supports bold, italic, underline, and links.
 *
 * Uses Tiptap (ProseMirror) under the hood for reliable editing.
 */
export const RichTextEditor: React.FC<RichTextEditorProps> = ({
  value,
  onChange,
  placeholder = 'Write your achievement...',
  className,
  minHeight = '80px',
}) => {
  const [showLinkDialog, setShowLinkDialog] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  // Track if we're doing an internal update to prevent loops (useRef to avoid re-renders)
  const isInternalUpdateRef = useRef(false);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        // Disable features we don't need for bullet points
        heading: false,
        bulletList: false,
        orderedList: false,
        blockquote: false,
        codeBlock: false,
        horizontalRule: false,
        hardBreak: false,
      }),
      Underline,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-blue-700 underline decoration-blue-300 underline-offset-2 font-medium transition-colors hover:text-blue-800',
        },
      }),
      Placeholder.configure({
        placeholder,
        emptyEditorClass: 'is-editor-empty',
      }),
    ],
    content: value || '',
    onUpdate: ({ editor }) => {
      isInternalUpdateRef.current = true;
      const html = editor.getHTML();
      // Convert <p> tags to plain content since we're in bullet mode
      const cleanHtml = html.replace(/<p>/g, '').replace(/<\/p>/g, '').trim();
      onChange(cleanHtml);
      // Reset flag after a tick to ensure it stays true through the render cycle
      setTimeout(() => {
        isInternalUpdateRef.current = false;
      }, 0);
    },
    editorProps: {
      attributes: {
        class: cn(
          'outline-none prose prose-sm max-w-none transition-all duration-300',
          'prose-p:leading-relaxed prose-p:text-slate-700',
          'prose-strong:text-slate-900 prose-strong:font-semibold',
          'prose-em:italic prose-a:text-blue-700 prose-a:underline'
        ),
        style: `min-height: ${minHeight}`,
      },
      handleKeyDown: (view, event) => {
        // Allow Enter key to work (stopPropagation per coding standards)
        if (event.key === 'Enter') {
          event.stopPropagation();
        }
        return false;
      },
    },
    // Immediately render without waiting for idle
    immediatelyRender: false,
  });

  // Handle mounting for SSR
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Sync external value changes (e.g., from parent reset)
  useEffect(() => {
    if (editor && !isInternalUpdateRef.current) {
      const currentContent = editor.getHTML().replace(/<p>/g, '').replace(/<\/p>/g, '').trim();

      if (value !== currentContent) {
        editor.commands.setContent(value || '');
      }
    }
  }, [value, editor]);

  // Handle link keyboard shortcut (Ctrl+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k' && editor?.isFocused) {
        e.preventDefault();
        setShowLinkDialog(true);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [editor]);

  const handleLinkDialogClose = useCallback(() => {
    setShowLinkDialog(false);
    editor?.chain().focus().run();
  }, [editor]);

  // Show loading state during SSR
  if (!isMounted || !editor) {
    return null;
  }

  return (
    <div className={cn('group relative w-full', className)}>
      {/* Main Editor Surface */}
      <div
        className={cn(
          'relative w-full rounded-lg border border-slate-200 bg-white px-3 py-2 shadow-sm transition-all duration-300',
          'hover:border-slate-300 focus-within:border-blue-700 focus-within:ring-1 focus-within:ring-blue-700',
          '[&_.is-editor-empty:before]:content-[attr(data-placeholder)] [&_.is-editor-empty:before]:text-slate-400 [&_.is-editor-empty:before]:float-left [&_.is-editor-empty:before]:pointer-events-none [&_.is-editor-empty:before]:h-0',
          '[&_.ProseMirror]:outline-none [&_.ProseMirror_p]:m-0'
        )}
      >
        <EditorContent editor={editor} />
      </div>

      {showLinkDialog && <LinkDialog editor={editor} onClose={handleLinkDialogClose} />}

      {/* Selection helper hint */}
      <div className="mt-1.5 flex items-center gap-1.5 px-1 opacity-0 transition-opacity duration-300 group-focus-within:opacity-100">
        <div className="h-1 w-1 rounded-full bg-blue-400" />
        <span className="text-[10px] font-medium uppercase tracking-widest text-slate-400">
          Use Ctrl+B (bold), Ctrl+I (italic), Ctrl+U (underline), Ctrl+K (link)
        </span>
      </div>
    </div>
  );
};

export default RichTextEditor;
