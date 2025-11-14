/**
 * Calcula a distância entre duas coordenadas usando a fórmula de Haversine
 * @param lat1 Latitude do ponto 1
 * @param lon1 Longitude do ponto 1
 * @param lat2 Latitude do ponto 2
 * @param lon2 Longitude do ponto 2
 * @returns Distância em quilômetros
 */
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Raio da Terra em km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  
  return distance;
}

/**
 * Converte graus para radianos
 */
function toRad(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * Formata a distância para exibição
 * @param distance Distância em quilômetros
 * @returns String formatada (ex: "2.5 km" ou "850 m")
 */
export function formatDistance(distance: number): string {
  if (distance < 1) {
    return `${Math.round(distance * 1000)} m`;
  }
  return `${distance.toFixed(1)} km`;
}

/**
 * Obtém coordenadas aproximadas de uma cidade brasileira
 * Esta é uma função simplificada. Em produção, seria melhor usar uma API de geocoding
 */
export async function geocodeAddress(address: string): Promise<{ lat: number; lng: number } | null> {
  try {
    // Usando a API de Geocoding do Google Maps
    // Em produção, você precisaria de uma chave de API configurada
    // Por enquanto, vamos retornar null e as coordenadas virão do banco
    return null;
  } catch (error) {
    console.error("Erro ao geocodificar endereço:", error);
    return null;
  }
}
