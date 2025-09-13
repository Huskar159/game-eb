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

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  console.log("[v0] === INÍCIO DA VERIFICAÇÃO DE PAGAMENTO ===")
  
  try {
    const paymentId = params.id
    console.log("[v0] Verificando pagamento ID:", paymentId)

    if (!paymentId) {
      console.error("[v0] ERRO: ID do pagamento não fornecido")
      return createResponse({ error: "ID do pagamento não fornecido" }, 400)
    }

    const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN
    if (!accessToken) {
      console.error("[v0] ERRO: Token de acesso do Mercado Pago não configurado")
      return createResponse({ error: "Erro de configuração do sistema" }, 500)
    }

    console.log("[v0] Buscando detalhes do pagamento no Mercado Pago...")
    const response = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error("[v0] ERRO na resposta do Mercado Pago:", response.status, errorText)
      
      // Tenta extrair a mensagem de erro da resposta
      let errorMessage = `Erro ao verificar pagamento (${response.status})`
      try {
        const errorData = JSON.parse(errorText)
        if (errorData.message) {
          errorMessage = errorData.message
        }
      } catch (e) {}
      
      return createResponse({ 
        error: errorMessage,
        status: 'error',
        payment_id: paymentId
      }, response.status)
    }

    const payment = await response.json()
    console.log("[v0] Status do pagamento:", payment.status)
    console.log("[v0] Dados do pagamento:", JSON.stringify({
      id: payment.id,
      status: payment.status,
      status_detail: payment.status_detail,
      external_reference: payment.external_reference,
      date_approved: payment.date_approved,
      payer: payment.payer?.email,
      transaction_amount: payment.transaction_amount,
    }, null, 2))

    // Retorna apenas os dados necessários para o frontend
    const responseData = {
      id: payment.id,
      status: payment.status,
      status_detail: payment.status_detail,
      external_reference: payment.external_reference,
      date_approved: payment.date_approved,
      transaction_amount: payment.transaction_amount,
      payer: {
        email: payment.payer?.email,
      },
      // Inclui dados adicionais que podem ser úteis
      payment_method: {
        id: payment.payment_method_id,
        type: payment.payment_type_id,
      },
      // Inclui dados do PIX se disponíveis
      point_of_interaction: payment.point_of_interaction,
    }

    console.log("[v0] === FIM DA VERIFICAÇÃO DE PAGAMENTO ===")
    return createResponse(responseData)
    
  } catch (error) {
    console.error("[v0] ERRO ao verificar pagamento:", error)
    return createResponse({ 
      error: "Erro interno ao verificar pagamento",
      details: error instanceof Error ? error.message : String(error)
    }, 500)
  }
}
