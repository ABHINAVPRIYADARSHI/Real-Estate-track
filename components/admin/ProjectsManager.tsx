"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { addProjectAction, updateProjectAction } from "@/actions/addProject";
import type { ProjectOption } from "@/actions/getProjects";
import Spinner from "@/components/ui/Spinner";

type ProjectWithCount = ProjectOption & { _count: { visits: number } };

const EMPTY_FORM = { name: "", location: "", description: "", price: "" };

export default function ProjectsManager({ initialProjects }: { initialProjects: ProjectWithCount[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [projects, setProjects] = useState<ProjectWithCount[]>(initialProjects);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  function openAdd() {
    setEditingId(null); setForm(EMPTY_FORM); setError(null); setSuccess(null); setShowForm(true);
  }
  function openEdit(p: ProjectWithCount) {
    setEditingId(p.id);
    setForm({ name: p.name, location: p.location, description: p.description ?? "", price: p.price ?? "" });
    setError(null); setSuccess(null); setShowForm(true);
  }
  function closeForm() {
    setShowForm(false); setEditingId(null); setForm(EMPTY_FORM); setError(null);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null); setSuccess(null);
    startTransition(async () => {
      try {
        if (editingId) {
          await updateProjectAction({ projectId: editingId, ...form });
          setSuccess("Project updated.");
          router.refresh();
          closeForm();
          const { getAllProjectsAction } = await import("@/actions/getProjects");
          setProjects(await getAllProjectsAction());
        } else {
          await addProjectAction(form);
          router.push("/admin/projects");
        }
      } catch (err: any) {
        setError(err?.message ?? "Something went wrong");
      }
    });
  }

  async function toggleActive(p: ProjectWithCount) {
    setError(null);
    startTransition(async () => {
      try {
        await updateProjectAction({
          projectId: p.id, name: p.name, location: p.location,
          description: p.description ?? undefined, price: p.price ?? undefined,
          isActive: !p.isActive,
        });
        router.refresh();
        const { getAllProjectsAction } = await import("@/actions/getProjects");
        setProjects(await getAllProjectsAction());
      } catch (err: any) {
        setError(err?.message ?? "Failed to update project");
      }
    });
  }

  const labelClass = "mb-1 block text-xs font-medium text-brand-neutral";

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-brand-tertiary dark:text-white">Projects</h1>
        <button type="button" onClick={openAdd} className="btn-primary py-2">
          + Add Project
        </button>
      </div>

      {error && !showForm && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-200">
          {error}
        </div>
      )}

      {/* Add / Edit Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="card p-4 space-y-3">
          <h2 className="text-base font-semibold text-brand-tertiary dark:text-white">
            {editingId ? "Edit Project" : "New Project"}
          </h2>

          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-200">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className={labelClass}>Project Name <span className="text-red-500">*</span></label>
              <input
                required
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="e.g. Lake View Apartments"
                className="input"
              />
            </div>
            <div>
              <label className={labelClass}>Location <span className="text-red-500">*</span></label>
              <input
                required
                value={form.location}
                onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
                placeholder="e.g. Whitefield, Bangalore"
                className="input"
              />
            </div>
            <div>
              <label className={labelClass}>Price</label>
              <input
                value={form.price}
                onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
                placeholder="e.g. ₹45 Lakhs onwards"
                className="input"
              />
            </div>
            <div className="sm:col-span-2">
              <label className={labelClass}>Description</label>
              <textarea
                rows={3}
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                placeholder="Key features, amenities, highlights…"
                className="input resize-none"
              />
            </div>
          </div>

            <div className="flex gap-2 pt-1">
              <button type="button" onClick={closeForm} className="btn-outline flex-1">
                Cancel
              </button>
              <button type="submit" disabled={isPending} className="btn-primary flex flex-1 items-center justify-center gap-2 py-2.5">
                {isPending && <Spinner size="sm" />}
                {isPending ? "Saving…" : editingId ? "Save Changes" : "Add Project"}
              </button>
            </div>
        </form>
      )}

      {/* Projects list */}
      {projects.length === 0 ? (
        <div className="rounded-xl border border-dashed border-brand-primary/30 p-8 text-center">
          <svg
            className="mx-auto mb-3 h-10 w-10 text-brand-primary/30"
            viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"
            strokeLinecap="round" strokeLinejoin="round"
          >
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
            <polyline points="9 22 9 12 15 12 15 22" />
          </svg>
          <p className="text-sm text-brand-neutral">No projects yet. Add your first project above.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {projects.map((p) => (
            <div
              key={p.id}
              className={
                "rounded-xl border p-4 transition-colors " +
                (p.isActive
                  ? "border-brand-primary/25 bg-white dark:bg-brand-tertiary dark:border-brand-primary/20"
                  : "border-brand-primary/10 bg-brand-surface/50 opacity-60 dark:bg-brand-tertiary/50")
              }
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="truncate text-sm font-semibold text-brand-tertiary dark:text-white">
                      {p.name}
                    </span>
                    {!p.isActive && (
                      <span className="shrink-0 rounded-md bg-brand-neutral/15 px-1.5 py-0.5 text-[10px] font-medium text-brand-neutral">
                        Inactive
                      </span>
                    )}
                  </div>
                  <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-brand-neutral">
                    <span className="flex items-center gap-1">
                      <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" />
                      </svg>
                      {p.location}
                    </span>
                    {p.price && (
                      <span className="flex items-center gap-1">
                        <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                        </svg>
                        {p.price}
                      </span>
                    )}
                    <span className="rounded-full bg-brand-primary/15 px-1.5 py-0.5 text-[10px] font-medium text-brand-secondary dark:text-brand-primary">
                      {p._count.visits} visit{p._count.visits === 1 ? "" : "s"}
                    </span>
                  </div>
                  {p.description && (
                    <p className="mt-1.5 text-xs text-brand-neutral line-clamp-2">{p.description}</p>
                  )}
                </div>

                <div className="flex shrink-0 items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => openEdit(p)}
                    className="btn-outline text-xs py-1.5 px-2.5"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => toggleActive(p)}
                    disabled={isPending}
                    className={
                      "rounded-md border px-2.5 py-1.5 text-xs font-medium transition-colors disabled:opacity-50 " +
                      (p.isActive
                        ? "border-brand-neutral/30 text-brand-neutral hover:bg-brand-neutral/10"
                        : "border-green-300 text-green-700 hover:bg-green-50 dark:border-green-700/50 dark:text-green-400 dark:hover:bg-green-950/30")
                    }
                  >
                    {p.isActive ? "Deactivate" : "Activate"}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
