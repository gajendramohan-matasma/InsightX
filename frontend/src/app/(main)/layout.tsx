import { auth } from "@/lib/auth";
import { MainLayoutClient } from "./layout-client";

export default async function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  return (
    <MainLayoutClient
      userRole={session?.user?.role}
      userName={session?.user?.name}
      userEmail={session?.user?.email}
      userImage={session?.user?.image}
    >
      {children}
    </MainLayoutClient>
  );
}
