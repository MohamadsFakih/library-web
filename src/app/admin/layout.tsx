import { auth } from "@/lib/auth";
import AdminShell from "./AdminShell";

export default async function AdminLayout({
  children,
}: { children: React.ReactNode }) {
  const session = await auth();
  return <AdminShell session={session}>{children}</AdminShell>;
}
