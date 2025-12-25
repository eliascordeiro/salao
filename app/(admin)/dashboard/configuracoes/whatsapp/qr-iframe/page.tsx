"use client";

/**
 * Página com iframe do Evolution Manager
 * Mostra QR Code diretamente da interface do Evolution API
 */
export default function WhatsAppQRIframePage() {
  const evolutionManagerUrl = "https://evolution-api-production-6c1c.up.railway.app/manager";
  
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-3xl font-bold">Evolution API Manager</h1>
        <p className="text-muted-foreground mt-1">
          Acesse o manager diretamente para ver/escanear o QR Code
        </p>
      </div>

      <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
        <p className="text-sm">
          <strong>📌 API Key:</strong> <code className="bg-black/20 px-2 py-1 rounded">B6D711FCDE4D4FD5936544120E713976</code>
        </p>
        <p className="text-sm mt-2">
          <strong>📱 Instância:</strong> <code className="bg-black/20 px-2 py-1 rounded">salon-booking</code>
        </p>
      </div>

      {/* iframe fullscreen */}
      <div className="w-full h-[calc(100vh-200px)] border border-border rounded-lg overflow-hidden">
        <iframe
          src={evolutionManagerUrl}
          className="w-full h-full"
          title="Evolution API Manager"
        />
      </div>
    </div>
  );
}
