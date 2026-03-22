import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { Chatbot } from "@/components/layout/chatbot";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-background">
      <Sidebar role={user.role} />
      <div className="md:pl-64">
        <Header user={user} />
        <main className="p-6">{children}</main>
      </div>
      <Chatbot />
    </div>
  );
}
