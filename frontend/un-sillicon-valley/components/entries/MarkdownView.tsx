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

  // TipTap's Link extension refuses to open links when the editor is not
  // editable (its click handler bails on `!view.editable`), and ProseMirror
  // swallows the anchor's native navigation. Delegate the click ourselves so
  // links in published entries actually open. Anchors stay keyboard-accessible
  // natively (focusable + Enter), so this only augments mouse clicks.
  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const anchor = (e.target as HTMLElement).closest("a");
    if (anchor?.href) {
      e.preventDefault();
      window.open(anchor.href, "_blank", "noopener,noreferrer");
    }
  };

  return (
    // biome-ignore lint/a11y/useKeyWithClickEvents: delegated link opener; anchors remain keyboard-accessible on their own.
    <div className={className} onClick={handleClick}>
      <EditorContent editor={editor} />
    </div>
  );
}
