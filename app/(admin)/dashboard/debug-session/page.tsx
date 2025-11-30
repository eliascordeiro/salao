"use client"

import { useSession, signOut } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

/**
 * Página de debug de sessão
 * DELETE após verificar
 */
export default function SessionDebugPage() {
  const { data: session, status } = useSession()

  return (
    <div className="container mx-auto p-8">
      <Card className="p-6">
        <h1 className="text-2xl font-bold mb-4">🔍 Debug de Sessão</h1>
        
        <div className="space-y-4">
          <div>
            <strong>Status:</strong> {status}
          </div>

          <div>
            <strong>Session Data:</strong>
            <pre className="bg-gray-100 p-4 rounded mt-2 overflow-auto">
              {JSON.stringify(session, null, 2)}
            </pre>
          </div>

          <div className="flex gap-4">
            <Button 
              onClick={() => window.location.reload()}
              variant="outline"
            >
              🔄 Recarregar
            </Button>
            
            <Button 
              onClick={() => signOut({ callbackUrl: '/login' })}
              variant="destructive"
            >
              🚪 Logout e Login Novamente
            </Button>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 p-4 rounded">
            <p className="text-sm text-yellow-800">
              <strong>⚠️ Ação necessária:</strong> Se roleType ou permissions estiverem vazios, faça LOGOUT e LOGIN novamente para atualizar a sessão JWT.
            </p>
          </div>
        </div>
      </Card>
    </div>
  )
}
