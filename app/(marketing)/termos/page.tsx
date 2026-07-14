export default function TermosPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background py-12 px-4">
      <div className="container mx-auto max-w-4xl">
        <div className="bg-card rounded-lg shadow-lg p-8 md:p-12">
          <h1 className="text-4xl font-bold mb-8 text-center">Termos de Uso</h1>
          
          <div className="prose prose-slate dark:prose-invert max-w-none space-y-6">
            <p className="text-muted-foreground text-center mb-8">
              Última atualização: 18 de novembro de 2025
            </p>

            <section className="space-y-4">
              <h2 className="text-2xl font-bold">1. Aceitação dos Termos</h2>
              <p>
                Ao acessar e usar a plataforma AgendaSalão, você concorda em cumprir e estar vinculado 
                aos seguintes termos e condições de uso. Se você não concorda com estes termos, 
                por favor, não use nossos serviços.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-bold">2. Descrição do Serviço</h2>
              <p>
                O AgendaSalão é uma plataforma online que conecta clientes a salões de beleza e 
                barbearias, facilitando o agendamento de serviços. Oferecemos:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Sistema de busca e descoberta de estabelecimentos</li>
                <li>Agendamento online de serviços</li>
                <li>Gestão de agendamentos para proprietários</li>
                <li>Sistema de pagamentos integrado</li>
                <li>Ferramentas administrativas para salões</li>
              </ul>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-bold">3. Cadastro e Conta de Usuário</h2>
              <h3 className="text-xl font-semibold">3.1 Criação de Conta</h3>
              <p>
                Para utilizar determinados recursos da plataforma, você deve criar uma conta fornecendo 
                informações precisas, completas e atualizadas.
              </p>
              
              <h3 className="text-xl font-semibold">3.2 Responsabilidades do Usuário</h3>
              <ul className="list-disc pl-6 space-y-2">
                <li>Manter a confidencialidade de sua senha</li>
                <li>Notificar-nos imediatamente sobre qualquer uso não autorizado de sua conta</li>
                <li>Ser responsável por todas as atividades realizadas em sua conta</li>
                <li>Fornecer informações verdadeiras e não enganosas</li>
              </ul>

              <h3 className="text-xl font-semibold">3.3 Contas de Proprietários</h3>
              <p>
                Proprietários de salões que se cadastram na plataforma concordam em:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Fornecer informações comerciais precisas e atualizadas</li>
                <li>Manter horários de funcionamento corretos</li>
                <li>Honrar agendamentos confirmados através da plataforma</li>
                <li>Respeitar políticas de cancelamento e reembolso</li>
              </ul>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-bold">4. Uso Aceitável</h2>
              <p>Você concorda em NÃO:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Usar a plataforma para fins ilegais ou não autorizados</li>
                <li>Publicar conteúdo ofensivo, difamatório ou discriminatório</li>
                <li>Tentar obter acesso não autorizado a sistemas ou dados</li>
                <li>Interferir ou interromper a integridade ou desempenho da plataforma</li>
                <li>Criar múltiplas contas falsas</li>
                <li>Usar bots ou automação não autorizada</li>
                <li>Coletar informações de outros usuários sem consentimento</li>
              </ul>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-bold">5. Agendamentos e Cancelamentos</h2>
              <h3 className="text-xl font-semibold">5.1 Confirmação de Agendamento</h3>
              <p>
                Os agendamentos realizados através da plataforma estão sujeitos à confirmação 
                do estabelecimento. Você receberá notificação por email sobre o status do seu agendamento.
              </p>

              <h3 className="text-xl font-semibold">5.2 Política de Cancelamento</h3>
              <p>
                Você pode cancelar agendamentos através da plataforma. Recomendamos avisar com 
                antecedência de pelo menos 24 horas. Cancelamentos de última hora podem estar 
                sujeitos a taxas conforme política do estabelecimento.
              </p>

              <h3 className="text-xl font-semibold">5.3 Não Comparecimento</h3>
              <p>
                Não comparecer a um agendamento sem aviso prévio ("no-show") pode resultar em:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Cobrança de taxa de cancelamento</li>
                <li>Restrições em futuros agendamentos</li>
                <li>Suspensão da conta em casos reincidentes</li>
              </ul>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-bold">6. Pagamentos</h2>
              <h3 className="text-xl font-semibold">6.1 Processamento de Pagamentos</h3>
              <p>
                Pagamentos presenciais são registrados no sistema para controle financeiro. Assinaturas da plataforma
                são processadas de forma segura via Mercado Pago.
                Aceitamos PIX e cartão de crédito.
              </p>

              <h3 className="text-xl font-semibold">6.2 Preços</h3>
              <p>
                Os preços dos serviços são definidos pelos estabelecimentos e exibidos na plataforma. 
                Nos reservamos o direito de corrigir erros de preço antes da confirmação do pagamento.
              </p>

              <h3 className="text-xl font-semibold">6.3 Reembolsos</h3>
              <p>
                Reembolsos são processados conforme a política do estabelecimento e estão sujeitos a:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Cancelamento com antecedência adequada</li>
                <li>Problemas técnicos da plataforma</li>
                <li>Não prestação do serviço pelo estabelecimento</li>
              </ul>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-bold">7. Propriedade Intelectual</h2>
              <p>
                Todo o conteúdo presente na plataforma, incluindo mas não limitado a textos, 
                gráficos, logos, ícones, imagens, clipes de áudio e software, é propriedade do 
                AgendaSalão ou de seus fornecedores de conteúdo e protegido por leis de direitos autorais.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-bold">8. Limitação de Responsabilidade</h2>
              <p>
                O AgendaSalão atua como intermediário entre clientes e estabelecimentos. 
                Não nos responsabilizamos por:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Qualidade dos serviços prestados pelos estabelecimentos</li>
                <li>Disputas entre clientes e estabelecimentos</li>
                <li>Danos indiretos, incidentais ou consequentes</li>
                <li>Perda de dados ou lucros</li>
                <li>Interrupções no serviço</li>
              </ul>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-bold">9. Modificações dos Termos</h2>
              <p>
                Reservamos o direito de modificar estes termos a qualquer momento. 
                Alterações significativas serão notificadas por email ou através da plataforma. 
                O uso continuado após as alterações constitui aceitação dos novos termos.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-bold">10. Rescisão</h2>
              <p>
                Podemos suspender ou encerrar sua conta e acesso à plataforma a qualquer momento, 
                sem aviso prévio, por violação destes termos ou por qualquer outra razão que 
                consideremos apropriada.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-bold">11. Lei Aplicável</h2>
              <p>
                Estes termos são regidos pelas leis brasileiras. Qualquer disputa será resolvida 
                nos tribunais competentes do Brasil.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-bold">12. Contato</h2>
              <p>
                Para questões sobre estes Termos de Uso, entre em contato:
              </p>
              <ul className="list-none space-y-2">
                <li>📧 Email: suporte@agendasalao.com.br</li>
                <li>💬 WhatsApp: (11) 9999-9999</li>
                <li>🌐 Website: www.agendasalao.com.br</li>
              </ul>
            </section>

            <section className="mt-12 pt-8 border-t">
              <p className="text-center text-muted-foreground">
                Ao usar o AgendaSalão, você reconhece que leu, entendeu e concorda em estar 
                vinculado a estes Termos de Uso.
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
