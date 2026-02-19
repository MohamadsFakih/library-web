import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import HomeShell from "../home/HomeShell";

export default async function MainLayout({
  children,
}: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  if (session.user.role === "ADMIN") redirect("/admin");
  return <HomeShell session={session}>{children}</HomeShell>;
}
