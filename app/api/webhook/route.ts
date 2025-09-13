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
    console.log("[v0] === INÍCIO DO WEBHOOK MERCADO PAGO ===")
    
    const body = await request.json()
    console.log("[v0] Dados do webhook recebido:", JSON.stringify(body, null, 2))

    if (body.type !== "payment") {
      console.log("[v0] Webhook ignorado - Tipo não é 'payment':", body.type)
      return createResponse({ success: true, message: "Webhook ignorado" })
    }

    const paymentId = body.data?.id
    if (!paymentId) {
      console.error("[v0] ERRO: ID do pagamento não encontrado no webhook")
      return createResponse({ error: "ID do pagamento não encontrado" }, 400)
    }

    console.log("[v0] Processando pagamento ID:", paymentId)

    // Buscar detalhes do pagamento na API do Mercado Pago
    const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN
    if (!accessToken) {
      console.error("[v0] ERRO: Token de acesso do Mercado Pago não configurado")
      return createResponse({ error: "Erro de configuração do sistema" }, 500)
    }

    console.log("[v0] Buscando detalhes do pagamento no Mercado Pago...")
    const paymentResponse = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
    })

    if (!paymentResponse.ok) {
      const errorData = await paymentResponse.json()
      console.error("[v0] ERRO ao buscar detalhes do pagamento:", errorData)
      return createResponse({ error: "Falha ao verificar pagamento" }, paymentResponse.status)
    }

    const paymentData = await paymentResponse.json()
    console.log("[v0] Dados do pagamento:", JSON.stringify(paymentData, null, 2))

    // Log do status do pagamento
    console.log(`[v0] Status do pagamento: ${paymentData.status}`)
    
    // Aqui você pode adicionar lógica baseada no status do pagamento
    switch (paymentData.status) {
      case 'approved':
        console.log("[v0] Pagamento aprovado!")
        console.log("[v0] Email do cliente:", paymentData.payer?.email)
        console.log("[v0] Referência externa:", paymentData.external_reference)
        console.log("[v0] Valor:", paymentData.transaction_amount)
        
        // TODO: Implementar lógica de sucesso aqui
        // - Enviar email de confirmação
        // - Liberar acesso ao produto
        // - Salvar no banco de dados
        // - Enviar WhatsApp, etc.
        
        break
        
      case 'pending':
        console.log("[v0] Pagamento pendente")
        break
        
      case 'rejected':
        console.log("[v0] Pagamento rejeitado")
        break
        
      default:
        console.log(`[v0] Status não tratado: ${paymentData.status}`)
    }

    console.log("[v0] === FIM DO WEBHOOK MERCADO PAGO ===")
    return createResponse({ success: true, status: paymentData.status })
    
  } catch (error) {
    console.error("[v0] ERRO no webhook:", error)
    return createResponse({ error: "Erro interno no processamento do webhook" }, 500)
  }
}
