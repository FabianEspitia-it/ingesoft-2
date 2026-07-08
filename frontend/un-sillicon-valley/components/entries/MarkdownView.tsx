"use client";

import { EditorContent, useEditor } from "@tiptap/react";

import { markdownExtensions } from "@/components/entries/tiptapExtensions";

type MarkdownViewProps = {
  content: string;
  className?: string;
};

/**
 * Read-only renderer for entry bodies. Uses TipTap in non-editable mode so the
 * published content goes through the same Markdown engine and styles as the
 * editor, rendering identically to what the author sees while writing.
 */
export function MarkdownView({ content, className }: MarkdownViewProps) {
  const editor = useEditor({
    editable: false,
    immediatelyRender: false,
    extensions: markdownExtensions({ linkOpenOnClick: true }),
    content,
    editorProps: {
      attributes: { class: "tiptap" },
    },
  });

  if (!editor) {
    return null;
  }

  return (
    <div className={className}>
      <EditorContent editor={editor} />
    </div>
  );
}
