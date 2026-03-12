import { redirect } from "next/navigation";
import { getCurrentUser, getProfessorProfile } from "@/lib/auth";
import { ProfessorDashboard } from "@/components/dashboard/professor-dashboard";
import { ScholarDashboard } from "@/components/dashboard/scholar-dashboard";
import { CoSupervisorDashboard } from "@/components/dashboard/co-supervisor-dashboard";

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  if (user.role === "professor") {
    return <ProfessorDashboard userId={user.id} />;
  }

  if (user.role === "scholar") {
    return <ScholarDashboard userId={user.id} />;
  }

  if (user.role === "co_supervisor") {
    return <CoSupervisorDashboard userId={user.id} />;
  }

  redirect("/login");
}
