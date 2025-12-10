"use client";

import Link from "next/link";

const pdfHref = "/termos-politica-passmais.pdf";

export default function TermosPage() {
  return (
    <main className="min-h-screen bg-gray-50 px-4 py-10">
      <div className="mx-auto flex max-w-5xl flex-col gap-8">
        <header className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-[#5179EF]">
              Pass+
            </p>
            <h1 className="text-3xl font-bold text-gray-900">Termos de Uso e Política de Privacidade</h1>
            <p className="text-gray-600">
              Leia atentamente os Termos e Condições de Uso e a Política de Privacidade do Sistema Pass+.
            </p>
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

        <article className="space-y-10 rounded-2xl bg-white p-6 shadow-sm md:p-8">
          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-gray-900">🧾 Termos e Condições de Uso — Sistema Pass+</h2>
            <ol className="list-decimal space-y-4 pl-5 text-gray-800">
              <li>
                <strong>Aceitação dos Termos</strong>
                <p className="mt-2 text-gray-700">
                  Ao acessar e utilizar o sistema Pass+, o usuário concorda integralmente com os presentes Termos e Condições de Uso, bem como com a Política de Privacidade associada. Caso não concorde com algum dos termos aqui previstos, o usuário deverá interromper imediatamente o uso da plataforma.
                </p>
              </li>
              <li>
                <strong>Definições</strong>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-gray-700">
                  <li>Usuário: pessoa física que utiliza o sistema, podendo ser classificada como Paciente, Médico, Secretário(a) ou Administrador.</li>
                  <li>Sistema Pass+: plataforma digital de agendamento e gestão de consultas médicas, de propriedade da equipe desenvolvedora vinculada ao Centro Universitário de Anápolis – UniEVANGÉLICA.</li>
                  <li>Dados Pessoais: informações relacionadas a uma pessoa natural identificada ou identificável.</li>
                  <li>LGPD: Lei nº 13.709/2018, que dispõe sobre o tratamento de dados pessoais no Brasil.</li>
                </ul>
              </li>
              <li>
                <strong>Objetivo do Sistema</strong>
                <p className="mt-2 text-gray-700">
                  O Pass+ tem por finalidade facilitar o agendamento, o gerenciamento e o acompanhamento de consultas médicas, promovendo a interação direta entre pacientes e profissionais de saúde, com segurança, agilidade e transparência.
                </p>
              </li>
              <li>
                <strong>Acesso e Cadastro</strong>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-gray-700">
                  <li>O acesso ao sistema requer cadastro prévio do usuário, mediante fornecimento de informações pessoais e profissionais.</li>
                  <li>O usuário se compromete a fornecer dados verdadeiros, completos e atualizados, responsabilizando-se civil e penalmente por eventuais falsidades.</li>
                  <li>Médicos e secretários passam por processo de aprovação administrativa, conforme descrito nos requisitos do sistema.</li>
                </ul>
              </li>
              <li>
                <strong>Uso do Sistema</strong>
                <p className="mt-2 text-gray-700">O usuário compromete-se a utilizar o Pass+ de forma ética, segura e em conformidade com a legislação vigente, sendo expressamente vedado:</p>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-gray-700">
                  <li>o uso da plataforma para fins ilícitos;</li>
                  <li>o compartilhamento de credenciais com terceiros;</li>
                  <li>o acesso não autorizado a contas ou informações de outros usuários;</li>
                  <li>qualquer tentativa de violar ou burlar os mecanismos de segurança do sistema.</li>
                </ul>
              </li>
              <li>
                <strong>Responsabilidades</strong>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-gray-700">
                  <li><span className="font-semibold">Do Usuário:</span> manter sigilo de login e senha; atualizar suas informações; respeitar os fluxos operacionais do sistema.</li>
                  <li><span className="font-semibold">Do Sistema Pass+:</span> garantir disponibilidade, segurança e integridade dos dados, conforme descrito nos requisitos técnicos e não funcionais.</li>
                </ul>
              </li>
              <li>
                <strong>Propriedade Intelectual</strong>
                <p className="mt-2 text-gray-700">
                  Todo o conteúdo, código-fonte, layout, logotipos, ícones e demais elementos do Pass+ são de propriedade intelectual dos autores do projeto e não podem ser reproduzidos, copiados ou modificados sem autorização expressa.
                </p>
              </li>
              <li>
                <strong>Modificações dos Termos</strong>
                <p className="mt-2 text-gray-700">
                  O Pass+ poderá atualizar ou alterar estes Termos a qualquer momento. As modificações entrarão em vigor imediatamente após sua publicação na plataforma, sendo responsabilidade do usuário verificar periodicamente as atualizações.
                </p>
              </li>
              <li>
                <strong>Limitação de Responsabilidade</strong>
                <p className="mt-2 text-gray-700">
                  O Pass+ não se responsabiliza por falhas decorrentes de indisponibilidade de rede ou dispositivos do usuário; informações incorretas fornecidas por usuários; uso indevido da plataforma.
                </p>
              </li>
              <li>
                <strong>Foro</strong>
                <p className="mt-2 text-gray-700">
                  Fica eleito o foro da comarca de Anápolis/GO para dirimir quaisquer controvérsias decorrentes da utilização do sistema, com renúncia a qualquer outro, por mais privilegiado que seja.
                </p>
              </li>
            </ol>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-gray-900">🔒 Política de Privacidade — Sistema Pass+</h2>
            <ol className="list-decimal space-y-4 pl-5 text-gray-800">
              <li>
                <strong>Introdução</strong>
                <p className="mt-2 text-gray-700">
                  Esta Política de Privacidade descreve como o Pass+ coleta, utiliza, armazena e protege os dados pessoais de seus usuários, em conformidade com a Lei Geral de Proteção de Dados Pessoais (LGPD).
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
                  <li>autenticação e gerenciamento de perfis de usuários;</li>
                  <li>agendamento, cancelamento e histórico de consultas;</li>
                  <li>comunicação entre pacientes e profissionais de saúde;</li>
                  <li>emissão de notificações, recibos e relatórios administrativos;</li>
                  <li>aprimoramento da experiência do usuário e segurança da aplicação.</li>
                </ul>
              </li>
              <li>
                <strong>Base Legal</strong>
                <p className="mt-2 text-gray-700">
                  O tratamento de dados é realizado com base no consentimento do titular; no cumprimento de obrigação legal ou regulatória; e na execução de contrato.
                </p>
              </li>
              <li>
                <strong>Compartilhamento de Dados</strong>
                <p className="mt-2 text-gray-700">
                  Os dados poderão ser compartilhados apenas com médicos vinculados às consultas do paciente; administradores do sistema; e serviços de infraestrutura, observando as medidas de segurança adequadas.
                </p>
              </li>
              <li>
                <strong>Armazenamento e Segurança</strong>
                <p className="mt-2 text-gray-700">
                  Os dados são armazenados de forma segura em banco de dados PostgreSQL hospedado em ambiente AWS, com controle de acesso, autenticação via JWT e criptografia em trânsito (HTTPS). Logs de auditoria são mantidos para controle administrativo.
                </p>
              </li>
              <li>
                <strong>Direitos do Usuário</strong>
                <p className="mt-2 text-gray-700">
                  O titular dos dados pode solicitar confirmação da existência de tratamento; acessar, corrigir ou atualizar seus dados; solicitar exclusão; ou revogar consentimento pelo canal de contato oficial.
                </p>
              </li>
              <li>
                <strong>Retenção de Dados</strong>
                <p className="mt-2 text-gray-700">
                  Os dados pessoais serão mantidos apenas pelo período necessário ao cumprimento das finalidades informadas, ou conforme exigido por lei ou auditoria administrativa.
                </p>
              </li>
              <li>
                <strong>Cookies e Tecnologias de Rastreamento</strong>
                <p className="mt-2 text-gray-700">
                  O Pass+ utiliza cookies estritamente necessários para autenticação e manutenção da sessão do usuário. Nenhum dado é utilizado para fins de publicidade.
                </p>
              </li>
              <li>
                <strong>Alterações da Política</strong>
                <p className="mt-2 text-gray-700">
                  Esta Política poderá ser alterada a qualquer momento, mediante atualização no sistema. Recomenda-se a leitura periódica deste documento.
                </p>
              </li>
              <li>
                <strong>Contato</strong>
                <p className="mt-2 text-gray-700">
                  Em caso de dúvidas ou solicitações relacionadas a dados pessoais, entre em contato pelo e-mail <a className="text-[#5179EF]" href="mailto:passplus.suporte@gmail.com">passplus.suporte@gmail.com</a>.
                </p>
              </li>
            </ol>
          </section>
        </article>

        <div className="rounded-2xl border border-gray-200 bg-white p-4 text-sm text-gray-600 shadow-sm">
          Precisa apenas da Política de Privacidade?{" "}
          <Link href="/politica-privacidade" className="font-semibold text-[#5179EF] hover:text-[#3356b3]">
            Acesse aqui.
          </Link>
        </div>
      </div>
    </main>
  );
}
