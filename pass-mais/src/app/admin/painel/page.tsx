import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { authOptions } from "@/lib/auth";
import AdminStatsCards from "./AdminStatsCards";

export default async function AdminPainel() {
  const session = await getServerSession(authOptions);
  const cookieStore = await cookies();
  const cookieRole = cookieStore.get('role')?.value;
  const sessionRole = session?.user?.role;
  const normalized = (cookieRole || sessionRole || '').toString().trim().toLowerCase();
  const isAdmin = normalized === 'administrator' || normalized === 'admin';

  if (!isAdmin) redirect('/login');

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <p className="text-gray-600 text-sm">Visão geral das estatísticas da plataforma Pass+</p>
      </div>

      <AdminStatsCards />

      {/* Two columns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" />
    </div>
  );
}
