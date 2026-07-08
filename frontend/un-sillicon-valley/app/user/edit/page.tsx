import { AuthGuard } from "@/components/auth/AuthGuard";
import { Header } from "@/components/layout/Header";
import { AccountSidebar } from "@/components/user/AccountSidebar";
import { EditProfileForm } from "@/components/user/EditProfileForm";

export default function EditProfilePage() {
  return (
    <div>
      <Header />
      <AuthGuard redirectTo="/login?next=/user/edit">
        <div className="mx-auto flex max-w-6xl flex-col gap-8 px-6 py-10 lg:flex-row lg:gap-10">
          <AccountSidebar active="edit" />
          <main className="min-w-0 flex-1">
            <EditProfileForm />
          </main>
        </div>
      </AuthGuard>
    </div>
  );
}
