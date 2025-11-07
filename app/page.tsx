import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export default async function RootPage() {
  const session = await getServerSession(authOptions);
  
  // Redirecionar baseado no papel do usuário
  if (session) {
    if (session.user.role === "ADMIN") {
      redirect("/dashboard");
    } else {
      redirect("/saloes");
    }
  }
  
  // Usuário não autenticado vê a landing page do (marketing)
  // Isso redireciona para app/(marketing)/page.tsx
  redirect("/");
}
