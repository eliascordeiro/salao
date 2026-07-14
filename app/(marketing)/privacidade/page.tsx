export default function PrivacidadePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background py-12 px-4">
      <div className="container mx-auto max-w-4xl">
        <div className="bg-card rounded-lg shadow-lg p-8 md:p-12">
          <h1 className="text-4xl font-bold mb-8 text-center">Política de Privacidade</h1>
          
          <div className="prose prose-slate dark:prose-invert max-w-none space-y-6">
            <p className="text-muted-foreground text-center mb-8">
              Última atualização: 18 de novembro de 2025
            </p>

            <section className="space-y-4">
              <h2 className="text-2xl font-bold">1. Introdução</h2>
              <p>
                A AgendaSalão ("nós", "nosso" ou "plataforma") respeita sua privacidade e está 
                comprometida em proteger seus dados pessoais. Esta Política de Privacidade explica 
                como coletamos, usamos, armazenamos e compartilhamos suas informações quando você 
                usa nossos serviços.
              </p>
              <p>
                Esta política está em conformidade com a Lei Geral de Proteção de Dados (LGPD - Lei nº 13.709/2018).
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-bold">2. Informações que Coletamos</h2>
              
              <h3 className="text-xl font-semibold">2.1 Informações Fornecidas por Você</h3>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Dados de Cadastro:</strong> Nome, email, telefone, senha</li>
                <li><strong>Dados de Perfil:</strong> Foto, preferências de serviços</li>
                <li><strong>Dados de Pagamento:</strong> Informações de pagamento (processadas via Mercado Pago para assinaturas)</li>
                <li><strong>Dados de Estabelecimento:</strong> Nome, endereço, CNPJ, horários (para proprietários)</li>
                <li><strong>Comunicações:</strong> Mensagens de suporte, avaliações, comentários</li>
              </ul>

              <h3 className="text-xl font-semibold">2.2 Informações Coletadas Automaticamente</h3>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Dados de Uso:</strong> Páginas visitadas, tempo de sessão, cliques</li>
                <li><strong>Dados do Dispositivo:</strong> Tipo de dispositivo, sistema operacional, navegador</li>
                <li><strong>Dados de Localização:</strong> Endereço IP, localização geográfica aproximada</li>
                <li><strong>Cookies:</strong> Identificadores únicos para melhorar sua experiência</li>
              </ul>

              <h3 className="text-xl font-semibold">2.3 Informações de Terceiros</h3>
              <p>
                Podemos receber informações de parceiros de autenticação (Google, Facebook) 
                quando você escolhe fazer login através desses serviços.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-bold">3. Como Usamos Suas Informações</h2>
              <p>Utilizamos seus dados para:</p>
              
              <h3 className="text-xl font-semibold">3.1 Prestação de Serviços</h3>
              <ul className="list-disc pl-6 space-y-2">
                <li>Criar e gerenciar sua conta</li>
                <li>Processar e confirmar agendamentos</li>
                <li>Facilitar pagamentos e transações</li>
                <li>Enviar notificações sobre agendamentos</li>
                <li>Fornecer suporte ao cliente</li>
              </ul>

              <h3 className="text-xl font-semibold">3.2 Melhorias e Personalização</h3>
              <ul className="list-disc pl-6 space-y-2">
                <li>Personalizar sua experiência na plataforma</li>
                <li>Recomendar serviços e estabelecimentos relevantes</li>
                <li>Analisar uso e melhorar funcionalidades</li>
                <li>Desenvolver novos recursos</li>
              </ul>

              <h3 className="text-xl font-semibold">3.3 Comunicação</h3>
              <ul className="list-disc pl-6 space-y-2">
                <li>Enviar confirmações e lembretes de agendamento</li>
                <li>Responder suas solicitações de suporte</li>
                <li>Enviar atualizações sobre a plataforma</li>
                <li>Marketing (apenas com seu consentimento)</li>
              </ul>

              <h3 className="text-xl font-semibold">3.4 Segurança e Conformidade</h3>
              <ul className="list-disc pl-6 space-y-2">
                <li>Prevenir fraudes e atividades ilegais</li>
                <li>Garantir segurança da plataforma</li>
                <li>Cumprir obrigações legais</li>
                <li>Resolver disputas</li>
              </ul>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-bold">4. Compartilhamento de Informações</h2>
              
              <h3 className="text-xl font-semibold">4.1 Com Estabelecimentos</h3>
              <p>
                Quando você faz um agendamento, compartilhamos seu nome, telefone e detalhes 
                do agendamento com o estabelecimento selecionado.
              </p>

              <h3 className="text-xl font-semibold">4.2 Com Prestadores de Serviços</h3>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Mercado Pago:</strong> Processamento de assinaturas e pagamentos</li>
                <li><strong>Provedores de Email:</strong> Envio de notificações</li>
                <li><strong>Hospedagem:</strong> Armazenamento de dados (Railway)</li>
                <li><strong>Analytics:</strong> Análise de uso da plataforma</li>
              </ul>

              <h3 className="text-xl font-semibold">4.3 Requisitos Legais</h3>
              <p>
                Podemos divulgar suas informações quando exigido por lei, ordem judicial, 
                ou para proteger direitos, propriedade ou segurança.
              </p>

              <h3 className="text-xl font-semibold">4.4 Nunca Vendemos Seus Dados</h3>
              <p className="font-semibold text-primary">
                Não vendemos, alugamos ou comercializamos suas informações pessoais para terceiros.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-bold">5. Seus Direitos (LGPD)</h2>
              <p>De acordo com a LGPD, você tem direito a:</p>
              
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Confirmação:</strong> Saber se processamos seus dados</li>
                <li><strong>Acesso:</strong> Obter cópia de seus dados pessoais</li>
                <li><strong>Correção:</strong> Solicitar correção de dados incompletos ou incorretos</li>
                <li><strong>Anonimização:</strong> Tornar seus dados anônimos</li>
                <li><strong>Bloqueio:</strong> Bloquear temporariamente o uso de seus dados</li>
                <li><strong>Eliminação:</strong> Solicitar exclusão de dados não mais necessários</li>
                <li><strong>Portabilidade:</strong> Receber seus dados em formato estruturado</li>
                <li><strong>Revogação:</strong> Retirar consentimento a qualquer momento</li>
                <li><strong>Oposição:</strong> Opor-se ao processamento de dados</li>
              </ul>

              <p className="mt-4">
                Para exercer esses direitos, entre em contato: <strong>privacidade@agendasalao.com.br</strong>
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-bold">6. Segurança de Dados</h2>
              <p>Implementamos medidas de segurança técnicas e organizacionais, incluindo:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Criptografia SSL/TLS para transmissão de dados</li>
                <li>Senhas criptografadas (hashing bcrypt)</li>
                <li>Acesso restrito a dados pessoais</li>
                <li>Monitoramento de segurança contínuo</li>
                <li>Backups regulares</li>
                <li>Proteção contra ataques cibernéticos</li>
              </ul>
              <p className="mt-4">
                Embora nos esforcemos para proteger seus dados, nenhum sistema é 100% seguro. 
                Use senhas fortes e não compartilhe suas credenciais.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-bold">7. Retenção de Dados</h2>
              <p>Mantemos seus dados pelo tempo necessário para:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Fornecer nossos serviços</li>
                <li>Cumprir obrigações legais (geralmente 5 anos para dados fiscais)</li>
                <li>Resolver disputas</li>
                <li>Prevenir fraudes</li>
              </ul>
              <p className="mt-4">
                Após esse período, anonimizamos ou excluímos seus dados, salvo quando a 
                retenção for exigida por lei.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-bold">8. Cookies e Tecnologias Similares</h2>
              
              <h3 className="text-xl font-semibold">8.1 O Que São Cookies</h3>
              <p>
                Cookies são pequenos arquivos de texto armazenados em seu dispositivo para 
                melhorar sua experiência.
              </p>

              <h3 className="text-xl font-semibold">8.2 Tipos de Cookies Utilizados</h3>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Essenciais:</strong> Necessários para funcionamento da plataforma</li>
                <li><strong>Funcionais:</strong> Lembram preferências e configurações</li>
                <li><strong>Analíticos:</strong> Coletam informações sobre uso da plataforma</li>
                <li><strong>Marketing:</strong> Personalizam anúncios (apenas com consentimento)</li>
              </ul>

              <h3 className="text-xl font-semibold">8.3 Gerenciar Cookies</h3>
              <p>
                Você pode controlar cookies através das configurações do seu navegador. 
                Desabilitar cookies pode afetar algumas funcionalidades da plataforma.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-bold">9. Privacidade de Menores</h2>
              <p>
                Nossos serviços são destinados a maiores de 18 anos. Não coletamos 
                intencionalmente dados de menores de idade. Se você acredita que coletamos 
                informações de um menor, entre em contato imediatamente.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-bold">10. Transferência Internacional</h2>
              <p>
                Seus dados são armazenados em servidores no Brasil. Alguns parceiros 
              (como Mercado Pago) podem processar dados internacionalmente, sempre com 
              garantias adequadas de proteção conforme LGPD.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-bold">11. Alterações nesta Política</h2>
              <p>
                Podemos atualizar esta Política de Privacidade periodicamente. Alterações 
                significativas serão notificadas por email ou aviso na plataforma. 
                A data da última atualização será sempre indicada no topo do documento.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-bold">12. Encarregado de Dados (DPO)</h2>
              <p>
                Nosso Encarregado de Proteção de Dados está disponível para questões sobre 
                privacidade:
              </p>
              <ul className="list-none space-y-2">
                <li>📧 Email: <strong>dpo@agendasalao.com.br</strong></li>
                <li>📧 Privacidade: <strong>privacidade@agendasalao.com.br</strong></li>
              </ul>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-bold">13. Autoridade Nacional</h2>
              <p>
                Você pode entrar em contato com a Autoridade Nacional de Proteção de Dados (ANPD):
              </p>
              <ul className="list-none space-y-2">
                <li>🌐 Website: <a href="https://www.gov.br/anpd" target="_blank" rel="noopener" className="text-primary hover:underline">www.gov.br/anpd</a></li>
                <li>📍 Endereço: SAS Quadra 06, Conjunto A, Bloco O, 4º andar - Brasília/DF</li>
              </ul>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-bold">14. Contato</h2>
              <p>
                Para dúvidas sobre esta Política de Privacidade ou exercer seus direitos:
              </p>
              <ul className="list-none space-y-2">
                <li>📧 Email: <strong>privacidade@agendasalao.com.br</strong></li>
                <li>📧 Suporte: <strong>suporte@agendasalao.com.br</strong></li>
                <li>💬 WhatsApp: <strong>(11) 9999-9999</strong></li>
                <li>🌐 Website: <strong>www.agendasalao.com.br</strong></li>
                <li>📍 Formulário: <a href="/contato" className="text-primary hover:underline">Página de Contato</a></li>
              </ul>
            </section>

            <section className="mt-12 pt-8 border-t">
              <div className="bg-primary/10 p-6 rounded-lg">
                <h3 className="text-xl font-bold mb-4 text-center">Compromisso com sua Privacidade</h3>
                <p className="text-center">
                  Na AgendaSalão, levamos sua privacidade a sério. Estamos comprometidos em 
                  proteger seus dados e ser transparentes sobre como os utilizamos. 
                  Sua confiança é fundamental para nós.
                </p>
              </div>
            </section>

            <section className="mt-8 text-center text-muted-foreground">
              <p>
                Esta Política de Privacidade está em conformidade com a LGPD (Lei nº 13.709/2018) 
                e é parte integrante dos nossos Termos de Uso.
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
