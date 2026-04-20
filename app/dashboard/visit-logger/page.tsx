import { createServerSupabaseClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import VisitLoggerForm from "@/components/visit-logger/VisitLoggerForm";
import { redirect } from "next/navigation";
import { getActiveProjectsAction } from "@/actions/getProjects";

export const dynamic = "force-dynamic";

export default async function VisitLoggerPage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in");

  const currentUser = await prisma.user.findUnique({
    where: { authId: user.id },
    select: { id: true, role: true, status: true },
  });

  if (!currentUser || currentUser.status !== "Active" || !currentUser.role) {
    redirect("/blocked/pending");
  }

  const [salesmen, projects] = await Promise.all([
    currentUser.role === "Salesman"
      ? []
      : prisma.user.findMany({
          where: { role: "Salesman", status: "Active" },
          select: { id: true, displayName: true, status: true },
          orderBy: { displayName: "asc" },
        }),
    getActiveProjectsAction(),
  ]);

  return (
    <div className="space-y-4">
      <VisitLoggerForm
        role={currentUser.role}
        salesmen={salesmen}
        projects={projects}
      />
    </div>
  );
}
