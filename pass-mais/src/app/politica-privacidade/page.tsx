"use client";

import Link from "next/link";

const pdfHref = "/termos-politica-passmais.pdf";

export default function PoliticaPrivacidadePage() {
  return (
    <main className="min-h-screen bg-gray-50 px-4 py-10">
      <div className="mx-auto flex max-w-5xl flex-col gap-8">
        <header className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-[#5179EF]">Pass+</p>
            <h1 className="text-3xl font-bold text-gray-900">Política de Privacidade</h1>
            <p className="text-gray-600">Entenda como tratamos, protegemos e usamos os seus dados no Pass+.</p>
          </div>
          <Link
            href={pdfHref}
            target="_blank"
            rel="noopener noreferrer"
            download
            className="inline-flex items-center justify-center rounded-xl bg-[#5179EF] px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#3f64d6]"
          >
            Baixar PDF
          </Link>
        </header>

        <article className="space-y-6 rounded-2xl bg-white p-6 shadow-sm md:p-8">
          <p className="text-sm text-gray-600">
            Esta página é um resumo da Política de Privacidade. Para o texto completo com Termos e Condições de Uso,
            consulte a página de{" "}
            <Link href="/termos" className="font-semibold text-[#5179EF] hover:text-[#3356b3]">
              Termos e Uso
            </Link>{" "}
            ou baixe o PDF oficial.
          </p>

          <ol className="list-decimal space-y-4 pl-5 text-gray-800">
            <li>
              <strong>Introdução</strong>
              <p className="mt-2 text-gray-700">
                Esta Política de Privacidade descreve como o Pass+ coleta, utiliza, armazena e protege os dados pessoais de
                seus usuários, em conformidade com a LGPD.
              </p>
            </li>
            <li>
              <strong>Dados Coletados</strong>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-gray-700">
                <li>Dados de identificação: nome, e-mail, CPF, CRM (para médicos), telefone e endereço.</li>
                <li>Dados de acesso: logs, tokens de autenticação, endereço IP e histórico de login.</li>
                <li>Dados de uso: informações sobre consultas agendadas, horários disponíveis e avaliações.</li>
                <li>Dados financeiros: informações de pagamento vinculadas às consultas (quando aplicável).</li>
              </ul>
            </li>
            <li>
              <strong>Finalidade do Tratamento</strong>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-gray-700">
                <li>Autenticação e gerenciamento de perfis de usuários.</li>
                <li>Agendamento, cancelamento e histórico de consultas.</li>
                <li>Comunicação entre pacientes e profissionais de saúde.</li>
                <li>Emissão de notificações, recibos e relatórios administrativos.</li>
                <li>Aprimoramento da experiência do usuário e segurança da aplicação.</li>
              </ul>
            </li>
            <li>
              <strong>Base Legal</strong>
              <p className="mt-2 text-gray-700">
                Tratamento com base em consentimento, obrigação legal/regulatória e execução de contrato.
              </p>
            </li>
            <li>
              <strong>Compartilhamento de Dados</strong>
              <p className="mt-2 text-gray-700">
                Compartilhamento restrito a médicos vinculados, administradores do sistema e provedores de infraestrutura,
                respeitando medidas de segurança.
              </p>
            </li>
            <li>
              <strong>Armazenamento e Segurança</strong>
              <p className="mt-2 text-gray-700">
                Dados armazenados em ambiente seguro (AWS) com controle de acesso, autenticação via JWT, criptografia em
                trânsito (HTTPS) e logs de auditoria.
              </p>
            </li>
            <li>
              <strong>Direitos do Usuário</strong>
              <p className="mt-2 text-gray-700">
                O titular pode solicitar confirmação, acesso, correção, exclusão ou revogação de consentimento pelos canais
                oficiais do Pass+.
              </p>
            </li>
            <li>
              <strong>Retenção de Dados</strong>
              <p className="mt-2 text-gray-700">
                Dados pessoais mantidos apenas pelo período necessário às finalidades ou conforme exigência legal/auditoria.
              </p>
            </li>
            <li>
              <strong>Cookies e Tecnologias de Rastreamento</strong>
              <p className="mt-2 text-gray-700">
                Uso apenas de cookies estritamente necessários para autenticação e manutenção de sessão; sem finalidade
                publicitária.
              </p>
            </li>
            <li>
              <strong>Alterações e Contato</strong>
              <p className="mt-2 text-gray-700">
                A política pode ser alterada a qualquer momento. Dúvidas:{" "}
                <a className="text-[#5179EF]" href="mailto:passplus.suporte@gmail.com">
                  passplus.suporte@gmail.com
                </a>.
              </p>
            </li>
          </ol>
        </article>

        <div className="rounded-2xl border border-gray-200 bg-white p-4 text-sm text-gray-600 shadow-sm">
          Precisa dos Termos completos?{" "}
          <Link href="/termos" className="font-semibold text-[#5179EF] hover:text-[#3356b3]">
            Acesse aqui.
          </Link>
        </div>
      </div>
    </main>
  );
}
