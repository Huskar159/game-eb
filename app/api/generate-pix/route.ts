
import { type NextRequest, NextResponse } from "next/server"

// Função auxiliar para criar resposta com CORS
const createResponse = (data: any, status: number = 200) => {
  return NextResponse.json(data, {
    status,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
};

// Handler para requisições OPTIONS (CORS preflight)
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}

export async function POST(request: NextRequest) {
  try {
    console.log("[v0] === INÍCIO DA API ROUTE MERCADO PAGO ===")

    const { email } = await request.json()

    console.log("[v0] Gerando PIX via Mercado Pago para:", email)
    
    // Log de depuração para verificar as variáveis de ambiente
    console.log('[v0] Variáveis de ambiente disponíveis:', Object.keys(process.env).filter(key => key.includes('MERCADOPAGO') || key.includes('NEXTAUTH')))
    console.log('[v0] MERCADOPAGO_ACCESS_TOKEN:', process.env.MERCADOPAGO_ACCESS_TOKEN ? '***TOKEN PRESENTE***' : 'TOKEN NÃO ENCONTRADO')

    const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN

    if (!accessToken) {
      console.error("[v0] ERRO: Token de acesso do Mercado Pago não configurado")
      return createResponse({ error: "Erro de configuração do sistema" }, 500);
    }

    console.log("[v0] Access Token encontrado, length:", accessToken.length)

    const idempotencyKey = `kit-essencial-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`
    console.log("[v0] Idempotency Key gerada:", idempotencyKey)

    const notificationUrl = 'https://webhook.site/your-webhook-url' // URL temporária para testes
    console.log('[v0] URL de notificação:', notificationUrl)

    const requestBody = {
      transaction_amount: 15.0, // Valor em reais
      description: "Kit Essencial - Estudos Bíblicos Femininos",
      payment_method_id: "pix",
      payer: {
        email: email,
        first_name: "Cliente",
        last_name: "Kit Essencial",
      },
      notification_url: notificationUrl,
      external_reference: `kit-essencial-${Date.now()}`,
      metadata: {
        kit_type: "essencial",
        customer_email: email,
      },
    }

    console.log("[v0] Request body para Mercado Pago:", JSON.stringify(requestBody, null, 2))
    console.log("[v0] Enviando requisição para Mercado Pago...")

    let response;
    let data;
    
    try {
      console.log("[v0] Enviando requisição para a API do Mercado Pago...");
      response = await fetch("https://api.mercadopago.com/v1/payments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${accessToken}`,
          "X-Idempotency-Key": idempotencyKey,
        },
        body: JSON.stringify(requestBody),
      });
      
      console.log("[v0] Status da resposta do Mercado Pago:", response.status);
      data = await response.json();
      console.log("[v0] Resposta do Mercado Pago:", JSON.stringify(data, null, 2));
      
      if (!response.ok) {
        const errorMessage = data.message || "Erro ao processar pagamento";
        console.log("[v0] Erro na resposta do Mercado Pago:", errorMessage);
        return createResponse({ error: errorMessage }, response.status);
      }
    } catch (error) {
      console.error("[v0] Erro ao fazer requisição para o Mercado Pago:", error);
      const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";
      return createResponse({ error: `Falha na comunicação com o Mercado Pago: ${errorMessage}` }, 500);
    }

    console.log("[v0] PIX gerado com sucesso via Mercado Pago!")
    console.log("[v0] === FIM DA API ROUTE MERCADO PAGO ===")

    return createResponse({
      id: data.id,
      status: data.status,
      qr_code: data.point_of_interaction?.transaction_data?.qr_code,
      qr_code_base64: data.point_of_interaction?.transaction_data?.qr_code_base64,
      ticket_url: data.point_of_interaction?.transaction_data?.ticket_url,
      external_reference: data.external_reference,
      transaction_amount: data.transaction_amount,
    }, 200);
  } catch (error) {
    console.error("[v0] Erro no servidor:", error)
    return createResponse({ error: "Erro interno do servidor" }, 500)
  }
}
