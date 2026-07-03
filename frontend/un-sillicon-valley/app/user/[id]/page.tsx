import { Header } from "@/components/layout/Header";
import { UserProfile } from "@/components/user/UserProfile";
 
export default async function ProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
 
  return (
    <div>
      <Header />
      <UserProfile userId={id} />
    </div>
  );
}