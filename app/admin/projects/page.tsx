import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { getAllProjectsAction } from "@/actions/getProjects";
import ProjectsManager from "@/components/admin/ProjectsManager";

export const dynamic = "force-dynamic";

export default async function AdminProjectsPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const currentUser = await prisma.user.findUnique({
    where: { clerkUserId: userId },
    select: { role: true, status: true },
  });

  if (!currentUser || currentUser.status !== "Active" || currentUser.role !== "Admin") {
    redirect("/dashboard");
  }

  const projects = await getAllProjectsAction();

  return <ProjectsManager initialProjects={projects} />;
}
