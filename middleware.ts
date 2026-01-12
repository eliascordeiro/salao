import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(request: NextRequest) {
  const hostname = request.headers.get("host") || "";
  const pathname = request.nextUrl.pathname;
  
  // Get token for auth checks (com tratamento de erro)
  let token = null;
  try {
    token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    });
  } catch (error) {
    console.error("Error getting token in middleware:", error);
    // Se falhar ao obter token, continuar como não autenticado
  }
  
  // ====================
  // DASHBOARD DOMAIN (Admin Portal)
  // dashboard.agendasalao.com
  // ====================
  if (hostname.includes("dashboard.")) {
    // Proteger rotas do dashboard
    if (pathname.startsWith("/dashboard")) {
      // Verificar se está autenticado
      if (!token) {
        const loginUrl = new URL("/login", request.url);
        loginUrl.searchParams.set("callbackUrl", pathname);
        return NextResponse.redirect(loginUrl);
      }
      
      // Permitir acesso APENAS para ADMIN (super admin da plataforma)
      // OWNER, STAFF, CUSTOM não têm acesso por padrão
      const hasAccess = token.role === "ADMIN"
      
      if (!hasAccess) {
        return NextResponse.redirect(new URL("/saloes", request.url));
      }
    }
    
    // Redirecionar root para dashboard
    if (pathname === "/") {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
    
    // Bloquear acesso de todos não-ADMIN ao dashboard
    if (token?.role !== "ADMIN" && pathname.startsWith("/dashboard")) {
      return NextResponse.redirect(new URL("/meus-agendamentos", request.url));
    }
  }
  
  // ====================
  // CLIENT APP DOMAIN
  // app.agendasalao.com
  // ====================
  if (hostname.includes("app.")) {
    // Bloquear acesso ao dashboard
    if (pathname.startsWith("/dashboard")) {
      return NextResponse.redirect(new URL("/saloes", request.url));
    }
    
    // Redirecionar root para salões
    if (pathname === "/") {
      return NextResponse.redirect(new URL("/saloes", request.url));
    }
    
    // Proteger rotas de cliente autenticado
    if (pathname.startsWith("/meus-agendamentos") || pathname.startsWith("/perfil")) {
      if (!token) {
        const loginUrl = new URL("/login", request.url);
        loginUrl.searchParams.set("callbackUrl", pathname);
        return NextResponse.redirect(loginUrl);
      }
    }
  }
  
  // ====================
  // MARKETING DOMAIN (www/root)
  // www.agendasalao.com ou agendasalao.com
  // OU Railway/Vercel domains sem prefixo
  // ====================
  if (hostname.includes("www.") || hostname === "agendasalao.com" || hostname.includes("localhost") || hostname.includes("railway.app") || hostname.includes("vercel.app")) {
    // Rotas públicas permitidas
    const publicRoutes = [
      "/",
      "/sobre",
      "/contato",
      "/login",
      "/register",
      "/cadastro-salao",
      "/termos",
      "/privacidade",
      "/planos",
      "/checkout",
      "/ajuda",
      "/favoritos",
      "/perfil",
      "/platform-admin", // Protegido por verificação de PLATFORM_ADMIN mais abaixo
    ];
    
    const isPublicRoute = publicRoutes.some((route) => pathname === route || pathname.startsWith(route));
    
    // Se não for rota pública, redirecionar baseado no usuário
    if (!isPublicRoute) {
      // PLATFORM_ADMIN vai para platform-admin
      if (token && token.role === "PLATFORM_ADMIN") {
        return NextResponse.redirect(new URL("/platform-admin", request.url));
      }
      // Apenas ADMIN tem acesso ao dashboard
      if (token && token.role === "ADMIN") {
        return NextResponse.redirect(new URL("/dashboard", request.url));
      }
      // Todos os outros usuários (CLIENT, OWNER, STAFF, CUSTOM) vão para salões
      if (token) {
        return NextResponse.redirect(new URL("/saloes", request.url));
      }
      // Usuário não autenticado tentando acessar rota protegida
      return NextResponse.redirect(new URL("/", request.url));
    }
  }
  
  // ====================
  // PROTEÇÃO DE ROTAS ESPECÍFICAS (todos os domínios)
  // ====================
  
  // Platform Admin (super admin da plataforma)
  if (pathname.startsWith("/platform-admin")) {
    if (!token) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }
    
    // Permitir acesso APENAS para PLATFORM_ADMIN
    const hasAccess = token.role === "PLATFORM_ADMIN"
    
    if (!hasAccess) {
      // Se for ADMIN de salão, redirecionar para dashboard
      if (token.role === "ADMIN") {
        return NextResponse.redirect(new URL("/dashboard", request.url));
      }
      // Outros usuários vão para salões
      return NextResponse.redirect(new URL("/saloes", request.url));
    }
  }
  
  // Staff Dashboard (portal do profissional)
  if (pathname.startsWith("/staff")) {
    if (!token) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }
    
    // Permitir acesso APENAS para STAFF
    const hasAccess = token.role === "STAFF" || (token as any).roleType === "STAFF"
    
    if (!hasAccess) {
      // Se não for STAFF, redirecionar para rota apropriada
      if (token.role === "ADMIN") {
        return NextResponse.redirect(new URL("/dashboard", request.url));
      }
      return NextResponse.redirect(new URL("/saloes", request.url));
    }
  }
  
  // Dashboard sempre protegido (apenas ADMIN)
  if (pathname.startsWith("/dashboard")) {
    if (!token) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }
    
    // Permitir acesso APENAS para ADMIN (super admin da plataforma)
    const hasAccess = token.role === "ADMIN"
    
    if (!hasAccess) {
      // Se for STAFF, redirecionar para dashboard de profissional
      if (token.role === "STAFF" || (token as any).roleType === "STAFF") {
        return NextResponse.redirect(new URL("/staff/dashboard", request.url));
      }
      return NextResponse.redirect(new URL("/saloes", request.url));
    }
  }
  
  // APIs protegidas
  if (pathname.startsWith("/api/bookings") || pathname.startsWith("/api/staff")) {
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
