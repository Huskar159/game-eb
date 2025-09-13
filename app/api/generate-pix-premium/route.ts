import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const { email } = await request.json()
    
    if (!email) {
      return NextResponse.json(
        { error: "Email é obrigatório" },
        { status: 400 }
      )
    }

    const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN
    // Configuração da URL base
    const baseUrl = process.env.NODE_ENV === 'production' 
      ? 'https://seu-dominio.com'  // Substitua pelo seu domínio real em produção
      : 'https://seu-dominio.ngrok.io'  // Use ngrok para desenvolvimento
      
    console.log('URL base configurada:', baseUrl)
    
    console.log("Environment Variables:", {
      hasAccessToken: !!accessToken,
      baseUrl: baseUrl
    })
    
    if (!accessToken) {
      console.error("MERCADOPAGO_ACCESS_TOKEN não configurado")
      return NextResponse.json(
        { error: "Erro de configuração do gateway de pagamento: Token de acesso não configurado" },
        { status: 500 }
      )
    }

    const paymentData = {
      transaction_amount: 24.90,
      description: "Kit Líder Transformada",
      payer: {
        email: email,
        first_name: "Cliente",
        last_name: "PV-EB"
      },
      notification_url: `${baseUrl}/api/webhook`,
      payment_method_id: 'pix',
      external_reference: `kit_lider_${Date.now()}`,
      statement_descriptor: "PVEB KITLIDER",
      installments: 1,
      binary_mode: true,
      additional_info: {
        items: [
          {
            id: "kit_lider_transformada",
            title: "Kit Líder Transformada",
            description: "Kit completo para líderes de células e grupos de oração",
            quantity: 1,
            unit_price: 24.90,
            category_id: "services"
          }
        ]
      }
    }

    console.log("Sending payment request to Mercado Pago:", JSON.stringify(paymentData, null, 2))

    const paymentResponse = await fetch("https://api.mercadopago.com/v1/payments", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${accessToken}`,
        "X-Idempotency-Key": `kit_lider_${Date.now()}`
      },
      body: JSON.stringify(paymentData)
    })

    const paymentResponseData = await paymentResponse.json()

    if (!paymentResponse.ok) {
      console.error("Erro ao gerar PIX:", paymentResponseData)
      return NextResponse.json(
        { error: paymentResponseData.message || "Erro ao processar pagamento" },
        { status: paymentResponse.status }
      )
    }

    return NextResponse.json({
      id: paymentResponseData.id,
      qr_code: paymentResponseData.point_of_interaction?.transaction_data?.qr_code,
      qr_code_base64: paymentResponseData.point_of_interaction?.transaction_data?.qr_code_base64,
      status: paymentResponseData.status,
    })

  } catch (error) {
    console.error("Erro no servidor:", error)
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    )
  }
}
