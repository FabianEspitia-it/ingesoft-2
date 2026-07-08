"use client";

import Placeholder from "@tiptap/extension-placeholder";
import { EditorContent, useEditor, useEditorState } from "@tiptap/react";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

import { markdownExtensions } from "@/components/entries/tiptapExtensions";
import { entryImageUrl, uploadCoverImage } from "@/lib/api";

const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png"];
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

type RichTextEditorProps = {
  /** Initial Markdown content. Only read on mount (editor owns state after). */
  value: string;
  onChange: (markdown: string) => void;
  placeholder?: string;
};

type EditorInstance = NonNullable<ReturnType<typeof useEditor>>;

type ToolbarItem = {
  label: string;
  title: string;
  isActive?: (s: EditorFlags) => boolean;
  /** Simple command run against the editor. */
  run?: (editor: EditorInstance) => void;
  /** Opens an inline dialog instead of running a command directly. */
  dialog?: "image";
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
    label: "🖼 Imagen",
    title: "Imagen en el cuerpo",
    dialog: "image",
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

function DialogShell({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  const modal = (
    // biome-ignore lint/a11y/useKeyWithClickEvents: backdrop is a decorative overlay; dialog controls remain keyboard-accessible.
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="w-full max-w-md rounded-2xl border border-border bg-background p-6 shadow-xl">
        <h2 className="ds-headline mb-4 text-lg text-foreground">{title}</h2>
        {children}
      </div>
    </div>
  );

  if (typeof document === "undefined") return null;
  return createPortal(modal, document.body);
}

function ImageDialog({
  onSubmit,
  onClose,
}: {
  onSubmit: (url: string, alt: string) => void;
  onClose: () => void;
}) {
  const [alt, setAlt] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  async function handleFile(file: File) {
    setError(null);
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      setError("La imagen debe ser JPG o PNG.");
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      setError("La imagen no debe superar 5MB.");
      return;
    }

    setUploading(true);
    try {
      const { path } = await uploadCoverImage(file);
      onSubmit(entryImageUrl(path), alt.trim());
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "No se pudo subir la imagen.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <DialogShell title="Insertar imagen" onClose={uploading ? () => {} : onClose}>
      <label className="mb-1 block text-sm font-medium text-foreground" htmlFor="image-alt">
        Texto alternativo <span className="font-normal text-muted">(opcional)</span>
      </label>
      <input
        id="image-alt"
        type="text"
        value={alt}
        onChange={(e) => setAlt(e.target.value)}
        placeholder="Descripción de la imagen"
        disabled={uploading}
        className="mb-4 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary"
      />

      {/* biome-ignore lint/a11y/useKeyWithClickEvents: activated via the labelled button below; drop zone is a visual affordance. */}
      <div
        onClick={() => !uploading && fileInputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          if (!uploading) setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          const file = e.dataTransfer.files?.[0];
          if (file && !uploading) handleFile(file);
        }}
        className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-8 text-center transition-colors ${
          dragging ? "border-primary bg-primary/5" : "border-border hover:border-primary"
        } ${uploading ? "pointer-events-none opacity-60" : ""}`}
      >
        <p className="text-sm font-medium text-foreground">
          {uploading ? "Subiendo imagen…" : "Arrastra una imagen o haz clic para elegir"}
        </p>
        <p className="mt-1 text-xs text-muted">JPG o PNG, máximo 5MB</p>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            e.target.value = "";
            if (file) handleFile(file);
          }}
        />
      </div>

      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

      <div className="mt-6 flex items-center justify-end gap-3">
        <button
          type="button"
          onClick={onClose}
          disabled={uploading}
          className="ds-btn ds-btn-ghost ds-btn-pill px-4 py-2 text-sm"
        >
          Cancelar
        </button>
      </div>
    </DialogShell>
  );
}

export function RichTextEditor({ value, onChange, placeholder }: RichTextEditorProps) {
  const [dialog, setDialog] = useState<"image" | null>(null);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      ...markdownExtensions(),
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
          }
        : null,
  });

  const closeDialog = () => {
    setDialog(null);
    editor?.chain().focus().run();
  };

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
              onClick={() => {
                if (!editor) return;
                if (item.dialog) setDialog(item.dialog);
                else item.run?.(editor);
              }}
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

      {dialog === "image" && editor && (
        <ImageDialog
          onSubmit={(url, alt) => {
            editor
              .chain()
              .focus()
              .setImage(alt ? { src: url, alt } : { src: url })
              .run();
            setDialog(null);
          }}
          onClose={closeDialog}
        />
      )}
    </div>
  );
}
