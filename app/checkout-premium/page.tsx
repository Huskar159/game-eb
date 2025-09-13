"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ArrowLeft, Mail, CreditCard, CheckCircle, Loader2, Clock, Download, MessageCircle, ShieldCheck } from "lucide-react"
import { useRouter } from "next/navigation"
import { trackInitiateCheckout } from "@/lib/facebook-pixel"

export default function CheckoutPremiumPage() {
  const [email, setEmail] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [pixData, setPixData] = useState<any>(null)
  const [error, setError] = useState("")
  const [paymentStatus, setPaymentStatus] = useState<"pending" | "approved" | "checking" | string>("pending")
  const [checkingPayment, setCheckingPayment] = useState(false)
  const [timeLeft, setTimeLeft] = useState(30 * 60) // 30 minutos em segundos
  const timerRef = useRef<NodeJS.Timeout>()
  const router = useRouter()

  // Rastrear início do checkout
  useEffect(() => {
    console.log('[Checkout Premium] Iniciando rastreamento do checkout premium');
    
    // Adiciona um pequeno atraso para garantir que o Facebook Pixel esteja carregado
    const timer = setTimeout(() => {
      console.log('[Checkout Premium] Chamando trackInitiateCheckout...');
      
      trackInitiateCheckout(
        24.90, // Valor do produto
        'BRL', // Moeda
        'kit_lider_transformada', // ID do produto
        'Kit Líder Transformada', // Nome do produto
        {
          // Parâmetros adicionais para melhor rastreamento
          source: 'checkout_premium_page',
          page_type: 'checkout',
          user_agent: typeof window !== 'undefined' ? window.navigator.userAgent : 'server'
        }
      );
      
      // Verifica se o fbq foi carregado corretamente
      if (typeof window !== 'undefined') {
        console.log('[Checkout Premium] Verificando fbq:', {
          fbq: typeof window.fbq,
          fbqLoaded: window.fbq?.loaded,
          fbqQueue: window.fbq?.queue
        });
      }
    }, 1000);
    
    return () => clearTimeout(timer);
  }, []);

  // Contador regressivo
  useEffect(() => {
    if (timeLeft <= 0) return
    
    timerRef.current = setInterval(() => {
      setTimeLeft(prevTime => {
        if (prevTime <= 1) {
          clearInterval(timerRef.current)
          return 0
        }
        return prevTime - 1
      })
    }, 1000)

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
  }, []) // Removido timeLeft das dependências

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  // Track Initiate Checkout when component mounts
  useEffect(() => {
    trackInitiateCheckout(24.90, 'BRL', 'kit_lider_transformada', 'Kit Líder Transformada')
  }, [])

  useEffect(() => {
    let interval: NodeJS.Timeout

    const checkPaymentStatus = async () => {
      if (!pixData?.id || paymentStatus !== "pending") return
      
      try {
        setCheckingPayment(true)
        console.log("[v0] Verificando status do pagamento:", pixData.id)

        const response = await fetch(`/api/check-payment/${pixData.id}`)
        
        if (!response.ok) {
          console.error("[v0] Erro na resposta da API:", response.status)
          return
        }
        
        const data = await response.json()
        console.log("[v0] Resposta da verificação de pagamento:", data)

        if (data.status === "approved") {
          console.log("[v0] Pagamento aprovado!")
          setPaymentStatus("approved")
          clearInterval(interval)
        } else if (data.status === "rejected") {
          console.log("[v0] Pagamento rejeitado")
          setError("Pagamento rejeitado. Por favor, tente novamente.")
          setPaymentStatus("pending")
          clearInterval(interval)
        }
        
      } catch (error) {
        console.error("[v0] Erro ao verificar pagamento:", error)
        setError("Erro ao verificar status do pagamento. Atualize a página e tente novamente.")
      } finally {
        setCheckingPayment(false)
      }
    }

    if (pixData?.id && paymentStatus === "pending") {
      checkPaymentStatus()
      interval = setInterval(checkPaymentStatus, 5000)
    }

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [pixData?.id, paymentStatus, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    try {
      console.log("[v0] Iniciando geração do PIX...")
      console.log("[v0] Email:", email)

      const response = await fetch("/api/generate-pix-premium", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      })

      console.log("[v0] Response status:", response.status)

      const data = await response.json()
      console.log("[v0] Response data:", data)

      if (!response.ok) {
        throw new Error(data.error || "Erro ao processar pagamento")
      }

      setPixData(data)
      setPaymentStatus("pending")
      console.log("[v0] PIX gerado com sucesso!")
    } catch (err) {
      console.log("[v0] Erro capturado:", err)
      setError(`Erro ao gerar PIX: ${err instanceof Error ? err.message : "Tente novamente."}`)
    } finally {
      setIsLoading(false)
    }
  }

  const copyPixCode = () => {
    if (pixData?.qr_code) {
      navigator.clipboard.writeText(pixData.qr_code)
      alert("Código PIX copiado!")
    }
  }

  if (paymentStatus === "approved") {
    // Redireciona para a página de pagamento aprovado premium
    router.push("/pagamento-aprovado-premium")
    return (
      <div className="min-h-screen gradient-feminine flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600 mx-auto mb-4"></div>
          <p className="text-gray-700">Redirecionando para a página de confirmação...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-xl border-2 border-purple-100">
        <CardHeader className="text-center space-y-4">
          <Button variant="ghost" onClick={() => router.push('/?skipDemo=true')} className="absolute top-4 left-4 p-2">
            <ArrowLeft className="w-4 h-4" />
          </Button>

          <div className="mx-auto mb-4 w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center">
            <ShieldCheck className="w-8 h-8 text-purple-600" />
          </div>
          
          <CardTitle className="text-2xl font-bold text-purple-900">Checkout Premium</CardTitle>
          <p className="text-sm text-muted-foreground">
            Preencha com seu melhor e-mail para gerar o PIX
          </p>

          {/* Seção 'O que você vai receber' antes de gerar o PIX */}
          <div className="mt-6 w-full">
            <h3 className="text-lg font-bold text-center mb-4">📦 O que você vai levar:</h3>
            <div className="space-y-3 text-sm">
              <div className="flex items-start gap-3 p-3 bg-purple-50 rounded-lg">
                <CheckCircle className="w-5 h-5 text-purple-600 mt-0.5 flex-shrink-0" />
                <div>
                  <strong>📚 Kit Completo de Estudos Bíblicos</strong>
                  <p className="text-muted-foreground">Estudos detalhados para aprofundar sua fé</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3 p-3 bg-purple-50 rounded-lg">
                <CheckCircle className="w-5 h-5 text-purple-600 mt-0.5 flex-shrink-0" />
                <div>
                  <strong>🎯 Guia de Liderança Cristã</strong>
                  <p className="text-muted-foreground">Técnicas para liderar com sabedoria</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3 p-3 bg-purple-50 rounded-lg">
                <CheckCircle className="w-5 h-5 text-purple-600 mt-0.5 flex-shrink-0" />
                <div>
                  <strong>🎁 Bônus Exclusivos</strong>
                  <p className="text-muted-foreground">Materiais adicionais para seu crescimento</p>
                </div>
              </div>
            </div>
          </div>

          <div className="text-center">
            <p className="text-3xl font-bold text-purple-600">R$ 24,90</p>
            <p className="text-sm text-muted-foreground">Pagamento via PIX</p>
            
            {timeLeft > 0 && (
              <div className="mt-4 bg-yellow-50 border-l-4 border-yellow-400 p-4">
                <div className="flex items-center justify-center">
                  <Clock className="h-5 w-5 text-yellow-700 mr-2" />
                  <p className="text-yellow-700 font-medium">
                    ATENÇÃO: Esta oferta especial expira em {formatTime(timeLeft)}
                  </p>
                </div>
              </div>
            )}
          </div>
        </CardHeader>

        <div className="px-6 pb-6">
          {/* Payment Section */}
          <div className="space-y-6 max-w-2xl mx-auto">
            <h3 className="text-lg font-semibold">Complete seu pedido</h3>
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative" role="alert">
                <strong className="font-bold">Erro: </strong>
                <span className="block sm:inline">{error}</span>
              </div>
            )}

            {!pixData ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  Seu melhor e-mail
                </Label>
                <div className="bg-white p-1 rounded-lg border border-black shadow-sm">
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="seu@email.com"
                    required
                    className="w-full border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                  />
                </div>
              </div>

              {error && <div className="text-red-600 text-sm text-center bg-red-50 p-2 rounded">{error}</div>}

              <div className="space-y-3">
                <Button
                  type="submit"
                  disabled={isLoading || !email}
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white py-3"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Gerando PIX...
                    </>
                  ) : (
                    <>
                      <CreditCard className="w-4 h-4 mr-2" />
                      Gerar PIX - R$ 24,90
                    </>
                  )}
                </Button>
                
                <a 
                  href="https://wa.me/556181662814?text=Olá,%20preciso%20de%20ajuda%20com%20o%20pagamento%20do%20Kit%20Líder%20Transformada" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full text-sm text-gray-600 hover:text-gray-800 transition-colors border border-gray-200 hover:border-gray-300 rounded-md py-2 px-4 bg-white shadow-sm"
                >
                  <MessageCircle className="w-4 h-4 text-purple-500" />
                  Precisa de ajuda? Fale pelo WhatsApp
                </a>
              </div>
            </form>
          ) : paymentStatus === "approved" ? (
            <div className="space-y-4 text-center">
              <div className="space-y-2">
                <CheckCircle className="w-16 h-16 text-green-500 mx-auto" />
                <h3 className="font-bold text-xl text-green-600">🎉 Pagamento Aprovado!</h3>
                <p className="text-sm text-muted-foreground">Seu Kit Líder Transformada foi liberado com sucesso!</p>
              </div>

              <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                <h4 className="font-semibold text-sm mb-2 text-green-800">✅ Acesso Liberado:</h4>
                <ul className="text-xs text-green-700 space-y-1">
                  <li>• Verifique seu e-mail: {email}</li>
                  <li>• Link de acesso enviado</li>
                  <li>• Downloads já disponíveis</li>
                  <li>• Suporte via WhatsApp ativo</li>
                </ul>
              </div>

              <Button onClick={() => router.push("/")} className="w-full bg-purple-600 hover:bg-purple-700 text-white">
                Voltar ao Início
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="text-center space-y-2">
                <div className="flex items-center justify-center gap-2">
                  <CheckCircle className="w-12 h-12 text-purple-500" />
                  {checkingPayment && <Loader2 className="w-4 h-4 animate-spin text-purple-500" />}
                </div>
                <h3 className="font-semibold text-lg">PIX Gerado com Sucesso!</h3>
                <p className="text-sm text-muted-foreground">Escaneie o QR Code ou copie o código PIX</p>

                <div className="flex items-center justify-center gap-2 text-xs text-purple-600 bg-purple-50 p-2 rounded">
                  <Clock className="w-3 h-3" />
                  {checkingPayment ? "Verificando pagamento..." : "Aguardando pagamento..."}
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg text-center space-y-3">
                {pixData.qr_code_base64 && (
                  <div className="bg-white p-3 rounded-lg border">
                    <p className="text-xs text-muted-foreground mb-2">QR Code PIX:</p>
                    <div className="w-48 h-48 mx-auto bg-white rounded-lg flex items-center justify-center">
                      <img
                        src={`data:image/png;base64,${pixData.qr_code_base64}`}
                        alt="QR Code PIX"
                        className="w-full h-full object-contain"
                      />
                    </div>
                  </div>
                )}

                <div>
                  <p className="text-xs text-muted-foreground mb-2">Código PIX:</p>
                  <p className="text-xs font-mono bg-white p-2 rounded border break-all">
                    {pixData.qr_code || "Gerando código PIX..."}
                  </p>
                </div>
              </div>

              <Button 
                variant="outline" 
                onClick={copyPixCode}
                className="w-full"
              >
                Copiar Código PIX
              </Button>

              <div className="mt-4 text-center text-sm text-muted-foreground">
                <p>O pagamento pode levar alguns minutos para ser confirmado.</p>
                <p>Você receberá um e-mail quando o pagamento for aprovado.</p>
              </div>
            </div>
          )}
          </div>
          
          {/* Seção de benefícios após o pagamento */}
          <div className="mt-12 space-y-4">
            <h3 className="text-2xl font-bold text-center text-purple-700 mb-6">📦 O que você vai levar:</h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="flex items-start gap-3 p-4 bg-purple-50 rounded-lg border border-purple-100">
                <CheckCircle className="w-5 h-5 text-purple-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-semibold">📚 Kit Completo de Estudos Bíblicos</h4>
                  <p className="text-sm text-muted-foreground">Estudos detalhados para aprofundar sua fé</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3 p-4 bg-purple-50 rounded-lg border border-purple-100">
                <CheckCircle className="w-5 h-5 text-purple-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-semibold">🎯 Guia de Liderança Cristã</h4>
                  <p className="text-sm text-muted-foreground">Técnicas para liderar com sabedoria</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3 p-4 bg-purple-50 rounded-lg border border-purple-100">
                <CheckCircle className="w-5 h-5 text-purple-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-semibold">💎 Bônus Exclusivos</h4>
                  <p className="text-sm text-muted-foreground">Materiais adicionais para seu crescimento</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3 p-4 bg-purple-50 rounded-lg border border-purple-100">
                <CheckCircle className="w-5 h-5 text-purple-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-semibold">🛡️ Suporte VIP</h4>
                  <p className="text-sm text-muted-foreground">Acesso direto ao nosso time de suporte</p>
                </div>
              </div>
            </div>
            
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-100 mt-6">
              <h4 className="font-semibold text-blue-800 flex items-center gap-2">
                <ShieldCheck className="w-5 h-5" />
                Compra 100% Segura
              </h4>
              <p className="text-sm text-blue-700 mt-1">Seu pagamento está protegido e seus dados são criptografados.</p>
            </div>
          </div>
        </div>
        
        <div className="px-6 pb-6 pt-0">
          <div className="w-full text-center text-sm text-muted-foreground border-t pt-6">
            <p>Pagamento processado com segurança pelo Mercado Pago</p>
            <p>Dúvidas? <a href="https://wa.me/556181662814" target="_blank" className="text-purple-600 hover:underline">Fale conosco pelo WhatsApp</a></p>
          </div>
        </div>
      </Card>
    </div>
  )
}
