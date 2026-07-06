import { DashboardShell } from "@/components/admin/Dashboard";
import { Header } from "@/components/layout/Header";
import { AuthGuard } from "@/components/auth/AuthGuard";


export default function AdminPage() {
  return (
    <div className="min-h-screen bg-background">
        <Header activePath="/admin"/>
        <main className="flex-1 px-6 py-10">
          <AuthGuard requireAdmin redirectTo="login?next=/admin" adminRedirectTo="/">
          <DashboardShell />
          </AuthGuard>  
        </main>
    </div>
  );
}