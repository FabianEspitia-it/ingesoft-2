import { Header } from "@/components/layout/Header";
import { EditProfileForm } from "@/components/user/EditProfileForm";
import { AuthGuard } from "@/components/auth/AuthGuard";

export default function EditProfilePage() {
  return (
    <AuthGuard redirectTo="/login?next=/user/edit">
      <div>
        <Header />
        <main className="mx-auto max-w-2xl px-6 py-10">
          <EditProfileForm />
        </main>
      </div>
    </AuthGuard>
  );
}