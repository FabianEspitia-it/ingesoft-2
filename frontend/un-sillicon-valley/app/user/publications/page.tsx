import { AuthGuard } from "@/components/auth/AuthGuard";
import { MyPublications } from "@/components/entries/MyPublications";
import { Header } from "@/components/layout/Header";

export default function MyPublicationsPage() {
  return (
    <div>
      <Header />
      <AuthGuard redirectTo="/login?next=/user/publications">
        <main className="mx-auto max-w-6xl px-6 py-10">
          <MyPublications />
        </main>
      </AuthGuard>
    </div>
  );
}
