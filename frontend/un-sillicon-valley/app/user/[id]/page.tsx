import { Header } from "@/components/layout/Header";
import { UserProfile } from "@/components/user/UserProfile";

export default function ProfilePage({ params }: { params: { id: string } }) {
  return (
    <div>
      <Header />
      <UserProfile userId={params.id} />
    </div>
  );
}