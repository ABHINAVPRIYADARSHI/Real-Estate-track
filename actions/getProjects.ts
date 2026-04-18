"use server";

import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export type ProjectOption = {
  id: string;
  name: string;
  location: string;
  description: string | null;
  price: string | null;
  isActive: boolean;
};

/** Returns all active projects — used in visit logger dropdown (all roles). */
export async function getActiveProjectsAction(): Promise<ProjectOption[]> {
  const { userId } = await auth();
  if (!userId) throw new Error("Not authenticated");

  const user = await prisma.user.findUnique({
    where: { clerkUserId: userId },
    select: { status: true, role: true },
  });
  if (!user || user.status !== "Active" || !user.role) {
    throw new Error("Not authorized");
  }

  const projects = await prisma.project.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      location: true,
      description: true,
      price: true,
      isActive: true,
    },
  });

  return projects;
}

/** Returns ALL projects (active + inactive) — Admin management view. */
export async function getAllProjectsAction(): Promise<
  (ProjectOption & { _count: { visits: number } })[]
> {
  const { userId } = await auth();
  if (!userId) throw new Error("Not authenticated");

  const user = await prisma.user.findUnique({
    where: { clerkUserId: userId },
    select: { status: true, role: true },
  });
  if (!user || user.status !== "Active" || user.role !== "Admin") {
    throw new Error("Only Admins can view all projects");
  }

  const projects = await prisma.project.findMany({
    orderBy: [{ isActive: "desc" }, { name: "asc" }],
    select: {
      id: true,
      name: true,
      location: true,
      description: true,
      price: true,
      isActive: true,
      _count: { select: { visits: true } },
    },
  });

  return projects;
}
