
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
  // ID único para rastreamento do log
  const requestId = `req_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
  
  // Função auxiliar para logs formatados
  const log = (message: string, data?: any) => {
    const timestamp = new Date().toISOString();
    const logData = data ? `\n  Dados: ${JSON.stringify(data, null, 2)}` : '';
    console.log(`[${timestamp}] [${requestId}] ${message}${logData}`);
  };
  
  // Função para erros
  const logError = (message: string, error?: any) => {
    const timestamp = new Date().toISOString();
    const errorData = error ? `\n  Erro: ${error instanceof Error ? error.message : JSON.stringify(error)}` : '';
    console.error(`[${timestamp}] [${requestId}] ERRO: ${message}${errorData}`);
    if (error?.stack) {
      console.error(`[${timestamp}] [${requestId}] Stack Trace: ${error.stack}`);
    }
  };

  try {
    log("=== INÍCIO DA API ROUTE MERCADO PAGO ===");
    log(`URL da requisição: ${request.url}`);
    log(`Método: ${request.method}`);
    log(`Cabeçalhos:`, Object.fromEntries(request.headers.entries()));
    log(`Ambiente: ${process.env.NODE_ENV}`);
    log(`Vercel Env: ${process.env.VERCEL_ENV || 'N/A'}`);

    // Verifica o método HTTP
    if (request.method !== 'POST') {
      logError('Método não permitido', { method: request.method });
      return createResponse({ 
        error: `Método ${request.method} não permitido`,
        code: 'METHOD_NOT_ALLOWED'
      }, 405);
    }

    // Verifica o Content-Type
    const contentType = request.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      logError('Content-Type inválido', { contentType });
      return createResponse({ 
        error: 'Content-Type deve ser application/json',
        code: 'INVALID_CONTENT_TYPE'
      }, 400);
    }

    // Lê e valida o corpo da requisição
    let body;
    try {
      body = await request.json();
      log('Corpo da requisição recebido:', body);
    } catch (error) {
      logError('Erro ao fazer parse do JSON', error);
      return createResponse({
        error: 'Formato de requisição inválido. O corpo deve ser um JSON válido.',
        code: 'INVALID_JSON'
      }, 400);
    }
    
    const { email } = body;

    // Validação do email
    if (!email) {
      logError('Email não fornecido');
      return createResponse({ 
        error: "O campo 'email' é obrigatório.",
        code: 'MISSING_EMAIL'
      }, 400);
    }

    if (!/^\S+@\S+\.\S+$/.test(email)) {
      logError('Formato de email inválido', { email });
      return createResponse({ 
        error: "Por favor, insira um endereço de e-mail válido.",
        code: 'INVALID_EMAIL_FORMAT'
      }, 400);
    }

    log(`Iniciando geração de PIX para: ${email}`);
    
    // Obtém o token de acesso
    const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;
    
    // Log de depuração de variáveis de ambiente (não loga o token completo)
    log('Variáveis de ambiente disponíveis:', {
      NODE_ENV: process.env.NODE_ENV,
      VERCEL: process.env.VERCEL,
      VERCEL_ENV: process.env.VERCEL_ENV,
      VERCEL_URL: process.env.VERCEL_URL,
      MERCADOPAGO_ACCESS_TOKEN: accessToken ? '***' + accessToken.slice(-4) : 'NÃO DEFINIDO',
      HAS_MERCADOPAGO_TOKEN: !!accessToken,
      TOKEN_LENGTH: accessToken?.length,
      TOKEN_STARTS_WITH_APP_USR: accessToken?.startsWith('APP_USR-')
    });

    // Verifica se o token está presente e tem o formato esperado
    const isTokenValid = accessToken && accessToken.startsWith('APP_USR-') && accessToken.length > 30;
    
    if (!accessToken || !isTokenValid) {
      const errorDetails = {
        hasToken: !!accessToken,
        tokenStartsWithAppUsr: accessToken?.startsWith('APP_USR-'),
        tokenLength: accessToken?.length,
        requiredMinLength: 30,
        nodeEnv: process.env.NODE_ENV,
        vercelEnv: process.env.VERCEL_ENV,
        vercelUrl: process.env.VERCEL_URL
      };
      
      logError('Token do Mercado Pago inválido ou não encontrado', errorDetails);
      
      return createResponse({ 
        error: "Erro de configuração do sistema. Por favor, entre em contato com o suporte.",
        code: "CONFIG_ERROR",
        details: process.env.NODE_ENV === 'development' ? errorDetails : undefined
      }, 500);
    }

    // Gera uma chave de idempotência única
    const idempotencyKey = `kit-essencial-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
    log(`Idempotency Key gerada: ${idempotencyKey}`);

    // URL base padrão para desenvolvimento local
    let baseUrl = 'http://localhost:3000';
    
    // Se estiver em produção (Vercel), usar a URL do ambiente
    const vercelUrl = process.env.VERCEL_URL;
    const nextAuthUrl = process.env.NEXTAUTH_URL;
    
    if (process.env.NODE_ENV === 'production' && vercelUrl) {
      baseUrl = `https://${vercelUrl}`;
    } else if (nextAuthUrl) {
      baseUrl = nextAuthUrl;
    }
    
    // Garantir que a URL não termine com barra
    baseUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
    
    // Log para depuração
    log('Configuração de ambiente:', {
      nodeEnv: process.env.NODE_ENV,
      vercelUrl: vercelUrl ? 'definido' : 'não definido',
      nextAuthUrl: nextAuthUrl ? 'definido' : 'não definido'
    });

    try {
      // Prepara o corpo da requisição para o Mercado Pago
      const requestBody = {
        transaction_amount: 15.0, // Valor em reais
        description: "Kit Essencial - Estudos Bíblicos Femininos",
        payment_method_id: "pix",
        payer: {
          email: email,
          first_name: "Cliente",
          last_name: "Kit Essencial",
        },
        // Removido temporariamente para testes
        // notification_url: notificationUrl,
        external_reference: `kit-essencial-${Date.now()}`,
        metadata: {
          kit_type: "essencial",
          customer_email: email,
          source: "checkout-essencial",
          request_id: requestId
        },
        additional_info: {
          items: [
            {
              id: "kit-essencial",
              title: "Kit Essencial - Estudos Bíblicos Femininos",
              description: "Acesso ao Kit Essencial de Estudos Bíblicos Femininos",
              quantity: 1,
              unit_price: 15.0
            }
          ]
        }
      };

      log('Enviando requisição para a API do Mercado Pago...', {
        url: 'https://api.mercadopago.com/v1/payments',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ***' + accessToken.slice(-4),
          'X-Idempotency-Key': idempotencyKey
        },
        body: {
          ...requestBody,
          // Não logamos o email completo por questões de privacidade
          payer: { ...requestBody.payer, email: '***' + email.split('@')[0].slice(-3) + '@' + email.split('@')[1] }
        }
      });

      // Faz a chamada para a API do Mercado Pago
      const startTime = Date.now();
      const response = await fetch("https://api.mercadopago.com/v1/payments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${accessToken}`,
          "X-Idempotency-Key": idempotencyKey,
        },
        body: JSON.stringify(requestBody),
      });
      
      const responseTime = Date.now() - startTime;
      log(`Resposta recebida do Mercado Pago em ${responseTime}ms`, {
        status: response.status,
        statusText: response.statusText
      });
      
      // Tenta fazer o parse da resposta como JSON
      let responseData;
      try {
        responseData = await response.json();
        log('Resposta do Mercado Pago (detalhes):', {
          status: responseData.status,
          status_detail: responseData.status_detail,
          payment_id: responseData.id,
          date_created: responseData.date_created
        });
      } catch (parseError: unknown) {
        // Extrai a mensagem de erro de forma segura
        let errorMessage: string;
        let errorStack: string | undefined;
        
        if (parseError instanceof Error) {
          errorMessage = parseError.message;
          errorStack = parseError.stack;
        } else if (typeof parseError === 'string') {
          errorMessage = parseError;
        } else {
          errorMessage = 'Erro desconhecido ao fazer parse da resposta';
        }
        
        logError('Erro ao fazer parse da resposta JSON', { message: errorMessage, stack: errorStack });
        
        // Prepara os detalhes do erro para desenvolvimento
        const errorDetails = process.env.NODE_ENV === 'development' 
          ? {
              status: response.status,
              statusText: response.statusText,
              error: errorMessage,
              stack: errorStack
            }
          : undefined;
        
        return createResponse({
          error: "Erro inesperado ao processar a resposta do serviço de pagamentos.",
          code: "INVALID_RESPONSE",
          details: errorDetails
        }, 500);
      }
      
      // Tratamento de erros da API do Mercado Pago
      if (!response.ok) {
        const errorDetails = {
          status: response.status,
          statusText: response.statusText,
          error_code: responseData?.error,
          error_message: responseData?.message,
          request_id: requestId,
          mercadopago_error: responseData
        };
        
        logError('Erro na resposta da API do Mercado Pago', errorDetails);
        
        // Mapeia códigos de erro comuns para mensagens amigáveis
        let userMessage = "Não foi possível processar seu pagamento no momento.";
        let errorCode = `MP_${response.status}`;
        
        if (response.status === 400) {
          userMessage = "Dados de pagamento inválidos. Por favor, verifique as informações e tente novamente.";
          
          // Detalhes adicionais para erros de validação
          if (responseData.cause && Array.isArray(responseData.cause)) {
            const validationErrors = responseData.cause.map((err: any) => ({
              code: err.code,
              description: err.description,
              data: err.data?.params || null
            }));
            
            log('Erros de validação do Mercado Pago:', validationErrors);
            
            // Exemplo de tratamento para erros específicos
            if (validationErrors.some((err: any) => err.code === 2061)) {
              userMessage = "O valor do pagamento está fora dos limites permitidos.";
            } else if (validationErrors.some((err: any) => err.code === 2026)) {
              userMessage = "O email informado já está em uso. Por favor, utilize outro email.";
            }
          }
        } else if (response.status === 401) {
          userMessage = "Erro de autenticação com o serviço de pagamentos. Por favor, tente novamente mais tarde.";
          errorCode = "AUTHENTICATION_ERROR";
        } else if (response.status === 403) {
          userMessage = "Acesso não autorizado ao serviço de pagamentos.";
          errorCode = "AUTHORIZATION_ERROR";
        } else if (response.status === 404) {
          userMessage = "Recurso não encontrado no serviço de pagamentos.";
          errorCode = "NOT_FOUND";
        } else if (response.status === 422) {
          userMessage = "Não foi possível processar a solicitação. Verifique os dados e tente novamente.";
          errorCode = "UNPROCESSABLE_ENTITY";
        } else if (response.status === 429) {
          userMessage = "Muitas requisições em pouco tempo. Por favor, aguarde alguns instantes e tente novamente.";
          errorCode = "RATE_LIMIT_EXCEEDED";
        } else if (response.status >= 500) {
          userMessage = "Serviço de pagamento temporariamente indisponível. Por favor, tente novamente em alguns minutos.";
          errorCode = "SERVICE_UNAVAILABLE";
        }
        
        return createResponse({
          error: userMessage,
          code: errorCode,
          details: process.env.NODE_ENV === 'development' ? errorDetails : undefined
        }, 200); // Mantém 200 para evitar erros no frontend
      }
      
      // Se chegou aqui, o pagamento foi criado com sucesso
      log('PIX gerado com sucesso!', {
        payment_id: responseData.id,
        status: responseData.status,
        status_detail: responseData.status_detail,
        point_of_interaction: responseData.point_of_interaction ? {
          type: responseData.point_of_interaction.type,
          transaction_data: {
            qr_code: '***' + (responseData.point_of_interaction.transaction_data?.qr_code || '').slice(-8),
            qr_code_base64: responseData.point_of_interaction.transaction_data?.qr_code_base64 ? '***' : 'não disponível',
            ticket_url: responseData.point_of_interaction.transaction_data?.ticket_url || 'não disponível'
          }
        } : 'não disponível'
      });
      
      // Retorna apenas os dados necessários para o frontend
      const responsePayload = {
        id: responseData.id,
        status: responseData.status,
        status_detail: responseData.status_detail,
        external_reference: responseData.external_reference,
        date_created: responseData.date_created,
        transaction_amount: responseData.transaction_amount,
        
        // Dados do PIX
        point_of_interaction: responseData.point_of_interaction ? {
          type: responseData.point_of_interaction.type,
          transaction_data: {
            qr_code: responseData.point_of_interaction.transaction_data?.qr_code,
            qr_code_base64: responseData.point_of_interaction.transaction_data?.qr_code_base64,
            ticket_url: responseData.point_of_interaction.transaction_data?.ticket_url,
            transaction_id: responseData.point_of_interaction.transaction_data?.transaction_id,
            bank_transfer_id: responseData.point_of_interaction.transaction_data?.bank_transfer_id,
            financial_institution: responseData.point_of_interaction.transaction_data?.financial_institution,
            bank_info: responseData.point_of_interaction.transaction_data?.bank_info,
            payment_method_reference_id: responseData.point_of_interaction.transaction_data?.payment_method_reference_id
          }
        } : null,
        
        // Dados adicionais úteis
        payer: {
          email: responseData.payer?.email,
          first_name: responseData.payer?.first_name,
          last_name: responseData.payer?.last_name
        },
        
        // Metadados para rastreamento
        metadata: {
          request_id: requestId,
          kit_type: "essencial"
        }
      };
      
      log('Retornando resposta de sucesso para o frontend');
      return createResponse(responsePayload, 200);
      
    } catch (error) {
      // Captura erros inesperados durante o processamento
      logError('Erro inesperado ao processar a requisição', error);
      
      return createResponse({
        error: "Ocorreu um erro inesperado ao processar seu pagamento. Por favor, tente novamente mais tarde.",
        code: "INTERNAL_SERVER_ERROR",
        details: process.env.NODE_ENV === 'development' ? {
          message: error instanceof Error ? error.message : 'Erro desconhecido',
          stack: error instanceof Error ? error.stack : undefined,
          request_id: requestId
        } : { request_id: requestId }
      }, 500);
    }

    log("=== FIM DA API ROUTE MERCADO PAGO ===");
  } catch (error) {
    logError("Erro inesperado no servidor:", error);
    return createResponse({ error: "Erro interno do servidor" }, 500)
  }
}
