import { Navbar } from "@/components/layout/Navbar";

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar showAuth={true} />
      <main className="flex-1">{children}</main>
      
      {/* Footer */}
      <footer className="border-t py-8 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="font-bold text-lg mb-4">AgendaSalão</h3>
              <p className="text-sm text-muted-foreground">
                A maior plataforma de agendamentos para salões e barbearias do Brasil
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Para Clientes</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="/saloes" className="hover:text-primary">Buscar Salões</a></li>
                <li><a href="/login" className="hover:text-primary">Meus Agendamentos</a></li>
                <li><a href="/sobre" className="hover:text-primary">Como Funciona</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Para Proprietários</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="/cadastro-salao" className="hover:text-primary">Cadastrar Salão</a></li>
                <li><a href="/login" className="hover:text-primary">Área do Proprietário</a></li>
                <li><a href="/sobre" className="hover:text-primary">Benefícios</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Suporte</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="/contato" className="hover:text-primary">Fale Conosco</a></li>
                <li><a href="/termos" className="hover:text-primary">Termos de Uso</a></li>
                <li><a href="/privacidade" className="hover:text-primary">Privacidade</a></li>
              </ul>
            </div>
          </div>
          
          <div className="mt-8 pt-8 border-t text-center text-sm text-muted-foreground">
            <p>&copy; 2025 AgendaSalão. Todos os direitos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
