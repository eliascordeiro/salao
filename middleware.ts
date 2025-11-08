import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(request: NextRequest) {
  const hostname = request.headers.get("host") || "";
  const pathname = request.nextUrl.pathname;
  
  // Get token for auth checks
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });
  
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
      
      // Verificar se é ADMIN
      if (token.role !== "ADMIN") {
        return NextResponse.redirect(new URL("/saloes", request.url));
      }
    }
    
    // Redirecionar root para dashboard
    if (pathname === "/") {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
    
    // Bloquear acesso de clientes
    if (token?.role === "CLIENT" && pathname.startsWith("/dashboard")) {
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
  // ====================
  if (hostname.includes("www.") || hostname === "agendasalao.com" || hostname.includes("localhost")) {
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
    ];
    
    const isPublicRoute = publicRoutes.some((route) => pathname === route || pathname.startsWith(route));
    
    // Se não for rota pública, redirecionar baseado no usuário
    if (!isPublicRoute) {
      if (token?.role === "ADMIN") {
        return NextResponse.redirect(new URL("/dashboard", request.url));
      }
      if (token?.role === "CLIENT") {
        return NextResponse.redirect(new URL("/saloes", request.url));
      }
      // Usuário não autenticado tentando acessar rota protegida
      return NextResponse.redirect(new URL("/", request.url));
    }
  }
  
  // ====================
  // PROTEÇÃO DE ROTAS ESPECÍFICAS (todos os domínios)
  // ====================
  
  // Dashboard sempre protegido
  if (pathname.startsWith("/dashboard")) {
    if (!token) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }
    
    if (token.role !== "ADMIN") {
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
