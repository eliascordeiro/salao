import { MercadoPagoConfig, Payment, Preference } from 'mercadopago';

if (!process.env.MERCADOPAGO_ACCESS_TOKEN) {
  throw new Error('MERCADOPAGO_ACCESS_TOKEN não configurado no .env');
}

// Configuração do cliente Mercado Pago
export const mercadopago = new MercadoPagoConfig({
  accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN,
  options: {
    timeout: 5000,
  }
});

// Clients
export const paymentClient = new Payment(mercadopago);
export const preferenceClient = new Preference(mercadopago);

// Helper: Criar preferência de pagamento (PIX ou Cartão)
export async function createSubscriptionPreference({
  planName,
  planPrice,
  salonId,
  salonName,
  paymentMethod, // 'pix' ou 'credit_card'
}: {
  planName: string;
  planPrice: number;
  salonId: string;
  salonName: string;
  paymentMethod: 'pix' | 'credit_card';
}) {
  const preference = await preferenceClient.create({
    body: {
      items: [
        {
          id: salonId,
          title: `Assinatura ${planName} - ${salonName}`,
          description: `Plano ${planName} (mensal)`,
          quantity: 1,
          unit_price: planPrice,
          currency_id: 'BRL',
          category_id: 'services', // Categoria obrigatória
        },
      ],
      payer: {
        name: 'Test User',
        surname: 'Test',
        email: 'test_user_123456@testuser.com', // Email de teste do MP
        phone: {
          area_code: '11',
          number: '987654321',
        },
        identification: {
          type: 'CPF',
          number: '19119119100', // CPF válido de teste
        },
        address: {
          zip_code: '01310100',
          street_name: 'Rua Teste',
          street_number: 123,
        },
      },
      external_reference: salonId, // Referência externa
      statement_descriptor: planName.substring(0, 13), // Limita a 13 caracteres
      back_urls: {
        success: `${process.env.NEXTAUTH_URL}/dashboard/assinatura/sucesso`,
        failure: `${process.env.NEXTAUTH_URL}/dashboard/assinatura/erro`,
        pending: `${process.env.NEXTAUTH_URL}/dashboard/assinatura/pendente`,
      },
      notification_url: `${process.env.NEXTAUTH_URL}/api/subscriptions/webhook`,
      metadata: {
        salon_id: salonId,
        payment_method: paymentMethod,
      },
    },
  });

  return preference;
}

// Helper: Buscar informações de um pagamento
export async function getPaymentInfo(paymentId: string) {
  return await paymentClient.get({ id: paymentId });
}

// Status do Mercado Pago → Status do nosso sistema
export function mapMPStatusToOurs(mpStatus: string): string {
  const statusMap: Record<string, string> = {
    'approved': 'ACTIVE',
    'pending': 'PENDING',
    'in_process': 'PENDING',
    'rejected': 'EXPIRED',
    'cancelled': 'CANCELED',
    'refunded': 'CANCELED',
  };
  return statusMap[mpStatus] || 'PENDING';
}
