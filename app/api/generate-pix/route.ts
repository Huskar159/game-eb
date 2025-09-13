
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
    console.log("[v0] Ambiente:", process.env.NODE_ENV)
    console.log("[v0] URL da requisição:", request.url)
    console.log("[v0] Cabeçalhos:", Object.fromEntries(request.headers.entries()))

    const body = await request.json()
    console.log("[v0] Corpo da requisição:", body)
    
    const { email } = body

    if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
      console.error("[v0] E-mail inválido:", email);
      return createResponse({ 
        error: "Por favor, insira um endereço de e-mail válido." 
      }, 400);
    }

    console.log("[v0] Gerando PIX via Mercado Pago para:", email)
    
    const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN
    
    // Logs de depuração (apenas em desenvolvimento)
    if (process.env.NODE_ENV === 'development') {
      console.log('[v0] Modo de desenvolvimento ativado');
      console.log('[v0] Variáveis de ambiente disponíveis:', Object.keys(process.env).filter(key => key.includes('MERCADOPAGO')));
    }

    // Verifica se o token está presente e tem o formato esperado
    const isTokenValid = accessToken && accessToken.startsWith('APP_USR-') && accessToken.length > 30;
    
    console.log("[v0] === VERIFICAÇÃO DE TOKEN ===");
    console.log("[v0] Token presente:", accessToken ? 'SIM' : 'NÃO');
    console.log("[v0] Formato do token:", isTokenValid ? 'VÁLIDO' : 'INVÁLIDO');
    console.log("[v0] Variáveis de ambiente disponíveis:", Object.keys(process.env).filter(k => k.includes('MERCADO') || k.includes('NEXT') || k.includes('VERCEL')));

    if (!accessToken || !isTokenValid) {
      const errorMsg = !accessToken 
        ? "Token de acesso do Mercado Pago não encontrado."
        : "Token de acesso do Mercado Pago está em um formato inválido.";
      
      console.error("[v0] ERRO:", errorMsg);
      console.error("[v0] Verifique se a variável MERCADOPAGO_ACCESS_TOKEN está definida corretamente na Vercel");
      
      return createResponse({ 
        error: "Erro de configuração do sistema. Por favor, entre em contato com o suporte.",
        code: "CONFIG_ERROR",
        details: {
          message: errorMsg,
          hasToken: !!accessToken,
          tokenStartsWithAppUsr: accessToken?.startsWith('APP_USR-'),
          tokenLength: accessToken?.length,
          requiredMinLength: 30
        }
      }, 500);
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
      try {
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
        
        if (!response.ok) {
          // Log detalhado apenas em desenvolvimento
          if (process.env.NODE_ENV === 'development') {
            console.log("[v0] Resposta de erro do Mercado Pago:", JSON.stringify(data, null, 2));
          }
          
          // Mapeia códigos de erro comuns para mensagens amigáveis
          let errorMessage = "Não foi possível processar seu pagamento no momento.";
          
          if (response.status === 400) {
            errorMessage = "Dados de pagamento inválidos. Por favor, verifique as informações e tente novamente.";
          } else if (response.status === 401) {
            errorMessage = "Erro de autenticação. Por favor, tente novamente mais tarde.";
          } else if (response.status === 429) {
            errorMessage = "Muitas tentativas em pouco tempo. Por favor, aguarde alguns instantes e tente novamente.";
          } else if (response.status >= 500) {
            errorMessage = "Serviço temporariamente indisponível. Por favor, tente novamente em alguns minutos.";
          }
          
          console.log(`[v0] Erro na resposta do Mercado Pago (${response.status}):`, data.message || 'Sem mensagem de erro');
          return createResponse({ 
            error: errorMessage,
            code: `MP_${response.status}`,
            details: process.env.NODE_ENV === 'development' ? data : undefined
          }, 200); // Mantém 200 para evitar erros no frontend
        }
        
        console.log("[v0] PIX gerado com sucesso!");
        
      } catch (error) {
        console.error("[v0] Erro na requisição para o Mercado Pago:", error);
        return createResponse({
          error: "Não foi possível conectar ao serviço de pagamentos. Verifique sua conexão e tente novamente.",
          code: "CONNECTION_ERROR"
        }, 200);
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
