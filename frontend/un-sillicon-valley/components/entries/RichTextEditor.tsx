"use client";

import Placeholder from "@tiptap/extension-placeholder";
import { EditorContent, useEditor, useEditorState } from "@tiptap/react";

import { markdownExtensions } from "@/components/entries/tiptapExtensions";

type RichTextEditorProps = {
  /** Initial Markdown content. Only read on mount (editor owns state after). */
  value: string;
  onChange: (markdown: string) => void;
  placeholder?: string;
};

type ToolbarItem = {
  label: string;
  title: string;
  isActive?: (s: EditorFlags) => boolean;
  run: (editor: NonNullable<ReturnType<typeof useEditor>>) => void;
};

type EditorFlags = {
  h1: boolean;
  h2: boolean;
  bold: boolean;
  italic: boolean;
  bulletList: boolean;
  orderedList: boolean;
  code: boolean;
  blockquote: boolean;
  link: boolean;
};

const TOOLBAR: ToolbarItem[] = [
  {
    label: "H1",
    title: "Encabezado 1",
    isActive: (s) => s.h1,
    run: (e) => e.chain().focus().toggleHeading({ level: 1 }).run(),
  },
  {
    label: "H2",
    title: "Encabezado 2",
    isActive: (s) => s.h2,
    run: (e) => e.chain().focus().toggleHeading({ level: 2 }).run(),
  },
  {
    label: "B",
    title: "Negrita",
    isActive: (s) => s.bold,
    run: (e) => e.chain().focus().toggleBold().run(),
  },
  {
    label: "I",
    title: "Cursiva",
    isActive: (s) => s.italic,
    run: (e) => e.chain().focus().toggleItalic().run(),
  },
  {
    label: "• Lista",
    title: "Lista con viñetas",
    isActive: (s) => s.bulletList,
    run: (e) => e.chain().focus().toggleBulletList().run(),
  },
  {
    label: "1. Numerada",
    title: "Lista numerada",
    isActive: (s) => s.orderedList,
    run: (e) => e.chain().focus().toggleOrderedList().run(),
  },
  {
    label: "🔗 Enlace",
    title: "Enlace",
    isActive: (s) => s.link,
    run: (e) => {
      const previous = e.getAttributes("link").href as string | undefined;
      const url = window.prompt("URL del enlace", previous ?? "https://");
      if (url === null) return;
      if (url === "") {
        e.chain().focus().extendMarkRange("link").unsetLink().run();
        return;
      }
      e.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
    },
  },
  {
    label: "🖼 Imagen",
    title: "Imagen en el cuerpo",
    run: (e) => {
      const url = window.prompt("URL de la imagen", "https://");
      if (url) e.chain().focus().setImage({ src: url }).run();
    },
  },
  {
    label: "</> Código",
    title: "Código",
    isActive: (s) => s.code,
    run: (e) => e.chain().focus().toggleCode().run(),
  },
  {
    label: "❝ Cita",
    title: "Cita",
    isActive: (s) => s.blockquote,
    run: (e) => e.chain().focus().toggleBlockquote().run(),
  },
];

export function RichTextEditor({ value, onChange, placeholder }: RichTextEditorProps) {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      ...markdownExtensions({ linkOpenOnClick: false }),
      Placeholder.configure({ placeholder: placeholder ?? "Empieza a escribir aquí…" }),
    ],
    content: value,
    editorProps: {
      attributes: { class: "tiptap tiptap-editor" },
    },
    onUpdate: ({ editor }) => {
      const storage = editor.storage as {
        markdown?: { getMarkdown: () => string };
      };
      onChange(storage.markdown?.getMarkdown() ?? "");
    },
  });

  const flags = useEditorState({
    editor,
    selector: ({ editor }): EditorFlags | null =>
      editor
        ? {
            h1: editor.isActive("heading", { level: 1 }),
            h2: editor.isActive("heading", { level: 2 }),
            bold: editor.isActive("bold"),
            italic: editor.isActive("italic"),
            bulletList: editor.isActive("bulletList"),
            orderedList: editor.isActive("orderedList"),
            code: editor.isActive("code"),
            blockquote: editor.isActive("blockquote"),
            link: editor.isActive("link"),
          }
        : null,
  });

  return (
    <div>
      <div className="my-3 flex flex-wrap items-center gap-1.5 border-y border-dashed border-border py-2">
        {TOOLBAR.map((item) => {
          const active = flags && item.isActive ? item.isActive(flags) : false;
          return (
            <button
              key={item.label}
              type="button"
              title={item.title}
              disabled={!editor}
              onClick={() => editor && item.run(editor)}
              className={`rounded-full border px-2 py-0.5 text-xs font-medium leading-5 transition-colors ${
                active
                  ? "border-primary bg-primary text-white"
                  : "border-border text-foreground hover:border-primary hover:text-primary"
              }`}
            >
              {item.label}
            </button>
          );
        })}
      </div>

      <EditorContent editor={editor} />
    </div>
  );
}
