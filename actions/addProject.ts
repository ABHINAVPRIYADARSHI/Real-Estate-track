"use server";

import { getAuthenticatedUser } from "@/lib/auth";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const AddProjectSchema = z.object({
  name: z.string().min(1, "Project name is required").max(200),
  location: z.string().min(1, "Location is required").max(300),
  description: z.string().max(1000).optional(),
  price: z.string().max(50).optional(),
});

const UpdateProjectSchema = AddProjectSchema.extend({
  projectId: z.string().min(1),
  isActive: z.boolean().optional(),
});

async function requireAdmin() {
  const currentUser = await getAuthenticatedUser();
  if (currentUser.status !== "Active" || currentUser.role !== "Admin") {
    throw new Error("Only Admins can manage projects");
  }
}

export async function addProjectAction(input: {
  name: string;
  location: string;
  description?: string;
  price?: string;
}) {
  await requireAdmin();

  const parsed = AddProjectSchema.safeParse(input);
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Invalid input");
  }

  const project = await prisma.project.create({
    data: {
      name: parsed.data.name.trim(),
      location: parsed.data.location.trim(),
      description: parsed.data.description?.trim() || null,
      price: parsed.data.price?.trim() || null,
    },
  });

  return { ok: true, projectId: project.id };
}

export async function updateProjectAction(input: {
  projectId: string;
  name: string;
  location: string;
  description?: string;
  price?: string;
  isActive?: boolean;
}) {
  await requireAdmin();

  const parsed = UpdateProjectSchema.safeParse(input);
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Invalid input");
  }

  const project = await prisma.project.findUnique({
    where: { id: parsed.data.projectId },
  });
  if (!project) throw new Error("Project not found");

  await prisma.project.update({
    where: { id: parsed.data.projectId },
    data: {
      name: parsed.data.name.trim(),
      location: parsed.data.location.trim(),
      description: parsed.data.description?.trim() || null,
      price: parsed.data.price?.trim() || null,
      ...(parsed.data.isActive !== undefined
        ? { isActive: parsed.data.isActive }
        : {}),
    },
  });

  return { ok: true };
}
