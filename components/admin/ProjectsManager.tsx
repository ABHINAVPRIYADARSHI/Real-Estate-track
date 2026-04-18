"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { addProjectAction, updateProjectAction } from "@/actions/addProject";
import type { ProjectOption } from "@/actions/getProjects";

type ProjectWithCount = ProjectOption & { _count: { visits: number } };

const EMPTY_FORM = {
  name: "",
  location: "",
  description: "",
  price: "",
};

export default function ProjectsManager({
  initialProjects,
}: {
  initialProjects: ProjectWithCount[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [projects, setProjects] = useState<ProjectWithCount[]>(initialProjects);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  function openAdd() {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setError(null);
    setSuccess(null);
    setShowForm(true);
  }

  function openEdit(p: ProjectWithCount) {
    setEditingId(p.id);
    setForm({
      name: p.name,
      location: p.location,
      description: p.description ?? "",
      price: p.price ?? "",
    });
    setError(null);
    setSuccess(null);
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    setEditingId(null);
    setForm(EMPTY_FORM);
    setError(null);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    startTransition(async () => {
      try {
        if (editingId) {
          await updateProjectAction({
            projectId: editingId,
            ...form,
          });
          setSuccess("Project updated.");
        } else {
          await addProjectAction(form);
          setSuccess("Project added.");
        }
        router.refresh();
        closeForm();
        // Re-fetch updated list
        const { getAllProjectsAction } = await import("@/actions/getProjects");
        const updated = await getAllProjectsAction();
        setProjects(updated);
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
          projectId: p.id,
          name: p.name,
          location: p.location,
          description: p.description ?? undefined,
          price: p.price ?? undefined,
          isActive: !p.isActive,
        });
        router.refresh();
        const { getAllProjectsAction } = await import("@/actions/getProjects");
        const updated = await getAllProjectsAction();
        setProjects(updated);
      } catch (err: any) {
        setError(err?.message ?? "Failed to update project");
      }
    });
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Projects</h1>
        <button
          type="button"
          onClick={openAdd}
          className="rounded-md bg-neutral-900 px-3 py-2 text-sm font-medium text-white hover:opacity-90 dark:bg-neutral-100 dark:text-neutral-900"
        >
          + Add Project
        </button>
      </div>

      {/* Global error */}
      {error && !showForm && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-200">
          {error}
        </div>
      )}

      {/* Add / Edit Form */}
      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="rounded-xl border border-neutral-200 p-4 dark:border-neutral-800 space-y-3"
        >
          <h2 className="text-base font-semibold">
            {editingId ? "Edit Project" : "New Project"}
          </h2>

          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-200">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-medium text-neutral-600 dark:text-neutral-400">
                Project Name <span className="text-red-500">*</span>
              </label>
              <input
                required
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="e.g. Lake View Apartments"
                className="w-full rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm outline-none focus:border-neutral-400 dark:border-neutral-800 dark:bg-neutral-950 dark:focus:border-neutral-600"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-neutral-600 dark:text-neutral-400">
                Location <span className="text-red-500">*</span>
              </label>
              <input
                required
                value={form.location}
                onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
                placeholder="e.g. Whitefield, Bangalore"
                className="w-full rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm outline-none focus:border-neutral-400 dark:border-neutral-800 dark:bg-neutral-950 dark:focus:border-neutral-600"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-neutral-600 dark:text-neutral-400">
                Price
              </label>
              <input
                value={form.price}
                onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
                placeholder="e.g. ₹45 Lakhs onwards"
                className="w-full rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm outline-none focus:border-neutral-400 dark:border-neutral-800 dark:bg-neutral-950 dark:focus:border-neutral-600"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="mb-1 block text-xs font-medium text-neutral-600 dark:text-neutral-400">
                Description
              </label>
              <textarea
                rows={3}
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                placeholder="Key features, amenities, highlights…"
                className="w-full rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm outline-none focus:border-neutral-400 dark:border-neutral-800 dark:bg-neutral-950 dark:focus:border-neutral-600"
              />
            </div>
          </div>

          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={closeForm}
              className="flex-1 rounded-md border border-neutral-200 py-2.5 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-50 dark:border-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-900"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="flex-1 rounded-md bg-neutral-900 py-2.5 text-sm font-medium text-white disabled:opacity-50 dark:bg-neutral-100 dark:text-neutral-900"
            >
              {isPending ? "Saving…" : editingId ? "Save Changes" : "Add Project"}
            </button>
          </div>
        </form>
      )}

      {/* Projects list */}
      {projects.length === 0 ? (
        <div className="rounded-xl border border-dashed border-neutral-200 p-8 text-center dark:border-neutral-800">
          <svg
            className="mx-auto mb-3 h-10 w-10 text-neutral-300 dark:text-neutral-600"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
            <polyline points="9 22 9 12 15 12 15 22" />
          </svg>
          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            No projects yet. Add your first project above.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {projects.map((p) => (
            <div
              key={p.id}
              className={
                "rounded-xl border p-4 transition-colors " +
                (p.isActive
                  ? "border-neutral-200 dark:border-neutral-800"
                  : "border-neutral-100 bg-neutral-50 opacity-60 dark:border-neutral-800/60 dark:bg-neutral-900/30")
              }
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="truncate text-sm font-semibold">{p.name}</span>
                    {!p.isActive && (
                      <span className="shrink-0 rounded-md bg-neutral-200 px-1.5 py-0.5 text-[10px] font-medium text-neutral-600 dark:bg-neutral-700 dark:text-neutral-300">
                        Inactive
                      </span>
                    )}
                  </div>
                  <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-neutral-500 dark:text-neutral-400">
                    <span className="flex items-center gap-1">
                      <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                        <circle cx="12" cy="10" r="3" />
                      </svg>
                      {p.location}
                    </span>
                    {p.price && (
                      <span className="flex items-center gap-1">
                        <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <line x1="12" y1="1" x2="12" y2="23" />
                          <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                        </svg>
                        {p.price}
                      </span>
                    )}
                    <span>{p._count.visits} visit{p._count.visits === 1 ? "" : "s"}</span>
                  </div>
                  {p.description && (
                    <p className="mt-1.5 text-xs text-neutral-500 dark:text-neutral-400 line-clamp-2">
                      {p.description}
                    </p>
                  )}
                </div>

                <div className="flex shrink-0 items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => openEdit(p)}
                    className="rounded-md border border-neutral-200 px-2.5 py-1.5 text-xs font-medium text-neutral-700 transition-colors hover:bg-neutral-50 dark:border-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-900"
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
                        ? "border-neutral-200 text-neutral-600 hover:bg-neutral-50 dark:border-neutral-800 dark:text-neutral-400 dark:hover:bg-neutral-900"
                        : "border-green-200 text-green-700 hover:bg-green-50 dark:border-green-900/50 dark:text-green-400 dark:hover:bg-green-950/30")
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
