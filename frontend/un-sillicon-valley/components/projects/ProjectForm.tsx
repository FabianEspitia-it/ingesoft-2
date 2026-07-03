"use client";

import { memo, useState } from "react";
import { createPortal } from "react-dom";
import type { Project } from "@/lib/types/project";

export type ProjectFormData = {
  title: string;
  description: string;
  url: string;
};

type Props = {
  project?: Project | null;
  onSave: (data: ProjectFormData) => Promise<void>;
  onClose: () => void;
};

export const ProjectForm = memo(function ProjectForm({ project, onSave, onClose }: Props) {
  const [title, setTitle] = useState(project?.title ?? "");
  const [description, setDescription] = useState(project?.description ?? "");
  const [url, setUrl] = useState(project?.url ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    if (!title.trim()) return;
    setSaving(true);
    setError(null);
    try {
      await onSave({
        title: title.trim(),
        description: description.trim(),
        url: url.trim(),
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo guardar el proyecto.");
      setSaving(false);
    }
  }

  const modal = (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={(e) => e.target === e.currentTarget && !saving && onClose()}
    >
      <div className="w-full max-w-lg rounded-2xl border border-border bg-background p-6 shadow-xl">
        <h2 className="ds-headline mb-5 text-lg text-foreground">
          {project ? "Editar proyecto" : "Añadir proyecto"}
        </h2>

        {error && (
          <div role="alert" className="ds-alert ds-alert-error mb-4">
            {error}
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="ds-label">Nombre del proyecto *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="auth-input auth-input-compact"
              placeholder="Ej: Sistema de recomendación académica"
              autoFocus
              disabled={saving}
            />
          </div>
          <div>
            <label className="ds-label">Descripción</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="auth-input auth-input-compact min-h-[80px] resize-none"
              placeholder="Describe brevemente el proyecto..."
              disabled={saving}
            />
          </div>
          <div>
            <label className="ds-label">URL / Enlace</label>
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="auth-input auth-input-compact"
              placeholder="https://..."
              disabled={saving}
            />
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="ds-btn ds-btn-ghost ds-btn-pill px-4 py-2 text-sm"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={!title.trim() || saving}
            className="ds-btn ds-btn-primary ds-btn-pill px-4 py-2 text-sm"
          >
            {saving ? "Guardando..." : project ? "Guardar cambios" : "Añadir proyecto"}
          </button>
        </div>
      </div>
    </div>
  );

  if (typeof document === "undefined") return null;
  return createPortal(modal, document.body);
});