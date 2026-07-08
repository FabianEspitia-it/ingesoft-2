"use client";

import {
  Icon,
  RiAddLine,
  RiArrowRightLine,
  RiDeleteBinLine,
  RiEditLine,
  RiImage2Line,
} from "@/components/icons";
import { createProject, deleteProject, getMyProjects, updateProject } from "@/lib/api";
import type { Project } from "@/lib/types/project";
import { memo, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { ProjectForm, type ProjectFormData } from "./ProjectForm";

type Props = {
  userId: number;
};

const ProjectCard = memo(function ProjectCard({
  project,
  deleting,
  onEdit,
  onDelete,
}: {
  project: Project;
  deleting: boolean;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="flex items-start gap-4 rounded-xl border border-border bg-background/30 p-4 transition hover:border-border/80">
      <div
        aria-hidden
        className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg border border-border bg-background/50 text-subtle"
      >
        <Icon icon={RiImage2Line} size={20} />
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-foreground">{project.title}</p>
        {project.description && (
          <p className="mt-0.5 line-clamp-2 text-xs text-muted">{project.description}</p>
        )}
        {project.url && (
          <a
            href={project.url}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-1 inline-flex items-center gap-1 truncate text-xs text-primary hover:underline"
          >
            <Icon icon={RiArrowRightLine} size={13} className="-rotate-45" />
            {project.url}
          </a>
        )}
      </div>

      <div className="flex shrink-0 gap-1">
        <button
          type="button"
          onClick={onEdit}
          disabled={deleting}
          className="rounded-lg p-1.5 text-muted transition hover:bg-background hover:text-foreground disabled:opacity-50"
          aria-label="Editar proyecto"
        >
          <Icon icon={RiEditLine} size={16} />
        </button>
        <button
          type="button"
          onClick={onDelete}
          disabled={deleting}
          className="rounded-lg p-1.5 text-muted transition hover:bg-background hover:text-[var(--error)] disabled:opacity-50"
          aria-label="Eliminar proyecto"
        >
          <Icon icon={RiDeleteBinLine} size={16} />
        </button>
      </div>
    </div>
  );
});

function DeleteConfirmDialog({
  project,
  deleting,
  onConfirm,
  onCancel,
}: {
  project: Project;
  deleting: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const modal = (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={(e) => e.target === e.currentTarget && !deleting && onCancel()}
    >
      <div className="w-full max-w-sm rounded-2xl border border-border bg-background p-6 shadow-xl">
        <h2 className="ds-headline mb-2 text-lg text-foreground">¿Eliminar proyecto?</h2>
        <p className="text-sm text-muted">
          Vas a eliminar <span className="font-medium text-foreground">"{project.title}"</span>.
          Esta acción no se puede deshacer.
        </p>
        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={deleting}
            className="ds-btn ds-btn-ghost ds-btn-pill px-4 py-2 text-sm"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={deleting}
            className="ds-btn ds-btn-pill bg-[var(--error)] px-4 py-2 text-sm text-white hover:opacity-90"
          >
            {deleting ? "Eliminando..." : "Eliminar"}
          </button>
        </div>
      </div>
    </div>
  );

  if (typeof document === "undefined") return null;
  return createPortal(modal, document.body);
}

export function ProjectList({ userId }: Props) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [projectPendingDelete, setProjectPendingDelete] = useState<Project | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const response = await getMyProjects(userId);
        if (!cancelled) setProjects(response.items);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "No se pudieron cargar tus proyectos.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [userId]);

  // El mensaje de éxito se oculta solo después de unos segundos
  useEffect(() => {
    if (!success) return;
    const timeout = setTimeout(() => setSuccess(null), 3000);
    return () => clearTimeout(timeout);
  }, [success]);

  async function handleAdd(data: ProjectFormData) {
    const created = await createProject(data);
    setProjects((prev) => [...prev, created]);
    setSuccess("Proyecto añadido correctamente.");
  }

  async function handleEdit(data: ProjectFormData) {
    if (!editingProject) return;
    const updated = await updateProject(editingProject.id, data);
    setProjects((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
    setEditingProject(null);
  }

  async function handleConfirmDelete() {
    if (!projectPendingDelete) return;
    const id = projectPendingDelete.id;
    setDeletingId(id);
    setError(null);
    try {
      await deleteProject(id);
      setProjects((prev) => prev.filter((p) => p.id !== id));
      setProjectPendingDelete(null);
      setSuccess("Proyecto eliminado correctamente.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo eliminar el proyecto.");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <>
      {modalOpen && (
        <ProjectForm
          project={editingProject}
          onSave={editingProject ? handleEdit : handleAdd}
          onClose={() => {
            setModalOpen(false);
            setEditingProject(null);
          }}
        />
      )}

      {projectPendingDelete && (
        <DeleteConfirmDialog
          project={projectPendingDelete}
          deleting={deletingId === projectPendingDelete.id}
          onConfirm={handleConfirmDelete}
          onCancel={() => setProjectPendingDelete(null)}
        />
      )}

      <section className="ds-card p-6">
        <div className="mb-5 flex items-center justify-between border-b border-dashed border-border pb-3">
          <h2 className="text-sm font-semibold text-foreground">Portafolio de ideas / proyectos</h2>
          <button
            type="button"
            onClick={() => {
              setEditingProject(null);
              setModalOpen(true);
            }}
            className="ds-btn ds-btn-ghost ds-btn-pill flex items-center gap-1.5 px-3 py-1.5 text-sm"
          >
            <Icon icon={RiAddLine} size={16} />
            Añadir proyecto
          </button>
        </div>

        {error && (
          <div role="alert" className="ds-alert ds-alert-error mb-4">
            {error}
          </div>
        )}

        {success && (
          <div role="status" className="ds-alert ds-alert-success mb-4">
            {success}
          </div>
        )}

        {loading ? (
          <p className="py-10 text-center text-sm text-muted">Cargando proyectos...</p>
        ) : projects.length === 0 ? (
          <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-border py-10 text-center">
            <p className="text-sm font-medium text-muted">Aún no tienes proyectos.</p>
            <p className="text-xs text-subtle">
              Añade tus ideas y proyectos para que otros los conozcan.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {projects.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                deleting={deletingId === project.id}
                onEdit={() => {
                  setEditingProject(project);
                  setModalOpen(true);
                }}
                onDelete={() => setProjectPendingDelete(project)}
              />
            ))}
          </div>
        )}
      </section>
    </>
  );
}
