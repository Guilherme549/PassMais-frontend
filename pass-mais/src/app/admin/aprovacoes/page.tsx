import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { authOptions } from '@/lib/auth';
import ApprovalsContent from './ui/ApprovalsContent';

export default async function AdminAprovacoes() {
  const session = await getServerSession(authOptions);
  const cookieStore = await cookies();
  const cookieRole = cookieStore.get('role')?.value;
  const role = (cookieRole || session?.user?.role || '').toString().trim().toLowerCase();
  const isAdmin = role === 'administrator' || role === 'admin';
  if (!isAdmin) redirect('/login');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Aprovações de Cadastros</h1>
      </div>

      {/* Resumo */}
      <ApprovalsContent />
    </div>
  );
}
