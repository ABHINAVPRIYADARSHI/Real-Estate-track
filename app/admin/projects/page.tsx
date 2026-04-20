import { createServerSupabaseClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { getAllProjectsAction } from "@/actions/getProjects";
import ProjectsManager from "@/components/admin/ProjectsManager";

export const dynamic = "force-dynamic";

export default async function AdminProjectsPage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in");

  const currentUser = await prisma.user.findUnique({
    where: { authId: user.id },
    select: { role: true, status: true },
  });

  if (!currentUser || currentUser.status !== "Active" || currentUser.role !== "Admin") {
    redirect("/dashboard");
  }

  const projects = await getAllProjectsAction();

  return <ProjectsManager initialProjects={projects} />;
}
