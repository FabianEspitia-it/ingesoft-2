import { Header } from "@/components/layout/Header";
import { EditProfileForm } from "@/components/user/EditProfileForm";
import { AuthGuard } from "@/components/auth/AuthGuard";

export default function EditProfilePage() {
  return (
      <div>
        <Header />
        <main className="mx-auto max-w-2xl px-6 py-10">
          <AuthGuard redirectTo="/login?next=/user/edit">
          <div className="ds-card p-8">
            <EditProfileForm />
          </div>
          </AuthGuard>
        </main>
      </div>
  );
}