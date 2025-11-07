import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { SidebarNav } from "@/components/dashboard/SidebarNav";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader />
      <div className="flex">
        <SidebarNav />
        <main className="flex-1 p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
