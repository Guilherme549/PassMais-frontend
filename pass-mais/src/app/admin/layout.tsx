import Link from "next/link";
import { cookies } from "next/headers";
import { MdDashboard, MdAssignment, MdRateReview, MdQueue, MdDescription, MdGroup } from "react-icons/md";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const roleCookie = cookies().get("role")?.value ?? "";
  const isAdmin = /^(administrator|admin)$/i.test(roleCookie);

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className="hidden md:flex md:flex-col w-64 bg-white border-r border-gray-200">
        <div className="h-16 flex items-center px-6 border-b border-gray-200">
          <span className="text-xl font-semibold">Pass+ Admin</span>
        </div>
        <nav className="flex-1 p-4 space-y-1 text-[15px]">
          <NavItem href="/admin/painel" icon={<MdDashboard size={18} />}>Dashboard</NavItem>
          <NavItem href="/admin/aprovacoes" icon={<MdAssignment size={18} />}>Aprovações de Cadastros</NavItem>
          <NavItem href="/admin/moderacao" icon={<MdRateReview size={18} />}>Moderação de Avaliações</NavItem>
          <NavItem href="/admin/filas" icon={<MdQueue size={18} />}>Filas de Atendimento</NavItem>
          <NavItem href="/admin/logs" icon={<MdDescription size={18} />}>Logs de Auditoria</NavItem>
          <NavItem href="/admin/administradores" icon={<MdGroup size={18} />}>Gerenciar Administradores</NavItem>
        </nav>
        <div className="px-4 py-3 text-xs text-gray-400">
          {isAdmin ? "Administrador" : "Acesso restrito"}
        </div>
      </aside>

      {/* Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Topbar */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 md:px-8">
          <div className="font-medium text-gray-700">Dashboard</div>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-semibold">AD</div>
            <span className="text-sm text-gray-700">Admin</span>
          </div>
        </header>

        <main className="p-4 md:p-8">{children}</main>
      </div>
    </div>
  );
}

function NavItem({ href, icon, children }: { href: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 px-3 py-2 rounded-md text-gray-700 hover:bg-gray-100 hover:text-gray-900 transition"
    >
      <span className="text-gray-500">{icon}</span>
      <span>{children}</span>
    </Link>
  );
}

