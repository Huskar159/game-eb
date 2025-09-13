"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ArrowLeft, Mail, CreditCard, CheckCircle, Loader2, Clock, Download, MessageCircle } from "lucide-react"
import { useRouter } from "next/navigation"
import { useFacebookPixel } from "@/hooks/useFacebookPixel"

export default function CheckoutPage() {
  const [email, setEmail] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [pixData, setPixData] = useState<any>(null)
  const [error, setError] = useState("")
  const [paymentStatus, setPaymentStatus] = useState<"pending" | "approved" | "checking" | string>("pending")
  const [checkingPayment, setCheckingPayment] = useState(false)
  const [timeLeft, setTimeLeft] = useState(30 * 60) // 30 minutos em segundos
  const timerRef = useRef<NodeJS.Timeout>()
  const router = useRouter()

  // Inicializa o hook do Facebook Pixel
  console.log('[Checkout] Inicializando hook useFacebookPixel');
  const { trackEvent, isReady } = useFacebookPixel();
  
  // Log quando o hook estiver pronto
  useEffect(() => {
    console.log('[Checkout] Verificando status do Facebook Pixel...');
    console.log('[Checkout] isReady:', isReady);
    console.log('[Checkout] window.fbq:', typeof window !== 'undefined' ? window.fbq : 'window não disponível');
    
    if (isReady) {
      console.log('[Checkout] Facebook Pixel está pronto para uso');
      console.log('[Checkout] Função trackEvent disponível:', typeof trackEvent === 'function');
      
      // Verifica se o fbq está disponível globalmente
      if (typeof window !== 'undefined') {
        console.log('[Checkout] window.fbq:', window.fbq);
        console.log('[Checkout] window.fbq.loaded:', window.fbq?.loaded);
        console.log('[Checkout] window.fbq.queue:', window.fbq?.queue);
        
        // Tenta disparar o evento diretamente
        try {
          console.log('[Checkout] Tentando disparar evento diretamente...');
          window.fbq('track', 'PageView');
          console.log('[Checkout] PageView disparado com sucesso!');
        } catch (e) {
          console.error('[Checkout] Erro ao disparar PageView:', e);
        }
      }
    } else {
      console.log('[Checkout] Facebook Pixel ainda não está pronto');
    }
  }, [isReady, trackEvent]);

  // Rastrear início do checkout - versão simplificada
  useEffect(() => {
    console.log('[Checkout] Efeito de rastreamento do checkout iniciado');
    
    const handleCheckout = async () => {
      console.log('[Checkout] Iniciando rastreamento do InitiateCheckout');
      
      // Verifica se o objeto fbq está disponível
      if (typeof window === 'undefined') {
        console.error('[Checkout] window não está disponível (executando no servidor)');
        return;
      }
      
      // Verifica se o fbq está disponível
      if (!window.fbq) {
        console.warn('[Checkout] fbq não está disponível no objeto window, tentando novamente em 1s...');
        setTimeout(handleCheckout, 1000);
        return;
      }
      
      // Verifica se o fbq está pronto
      if (!window.fbq.loaded) {
        console.log('[Checkout] fbq ainda não está carregado, aguardando...');
        setTimeout(handleCheckout, 1000); // Tenta novamente em 1 segundo
        return;
      }
      
      console.log('[Checkout] fbq está pronto, disparando eventos...');
      
      // Parâmetros do evento
      const eventParams = {
        value: 15.00,
        currency: 'BRL',
        content_type: 'product',
        content_ids: ['kit_essencial'],
        content_name: 'Kit Essencial',
        content_category: 'Estudos Bíblicos',
        num_items: 1,
        contents: [{
          id: 'kit_essencial',
          quantity: 1,
          item_price: 15.00
        }],
        eventID: `checkout_${Date.now()}`,
        eventTime: Math.floor(Date.now() / 1000),
        eventSourceUrl: window.location.href,
        actionSource: 'website'
      };
      
      // Usa o hook para rastrear o evento
      console.log('[Checkout] Usando hook useFacebookPixel para rastrear o evento');
      const success = await trackEvent('InitiateCheckout', eventParams);
      console.log('[Checkout] Resultado do rastreamento:', success ? 'sucesso' : 'falha');
      
      // Se falhar, tenta novamente após um atraso
      if (!success) {
        console.log('[Checkout] Tentando novamente em 3 segundos...');
        setTimeout(handleCheckout, 3000);
      }
    };
    
    // Inicia o rastreamento
    handleCheckout();
    
    // Limpa qualquer timeout pendente quando o componente for desmontado
    return () => {
      console.log('[Checkout] Limpando timeouts de rastreamento');
    };
  }, [trackEvent]); // Adiciona trackEvent como dependência

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
  }, [])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  useEffect(() => {
    let interval: NodeJS.Timeout

    const checkPaymentStatus = async () => {
      if (!pixData?.id) return
      
      try {
        console.log("[v0] Verificando status do pagamento:", pixData.id, "Status atual:", paymentStatus)
        setCheckingPayment(true)

        const response = await fetch(`/api/check-payment/${pixData.id}?t=${Date.now()}`) // Adiciona timestamp para evitar cache
        
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
        } else if (data.status === "pending") {
          console.log(`[v0] Pagamento pendente: ${data.status_detail}`)
          // Mantém o status como pending e continua verificando
        } else {
          console.log(`[v0] Status inesperado recebido: ${data.status}`)
        }
        
      } catch (error) {
        console.error("[v0] Erro ao verificar pagamento:", error)
        setError("Erro ao verificar status do pagamento. Atualize a página e tente novamente.")
      } finally {
        setCheckingPayment(false)
      }
    }

    if (pixData?.id && paymentStatus === "pending") {
      // Verifica imediatamente e depois a cada 5 segundos
      checkPaymentStatus()
      interval = setInterval(checkPaymentStatus, 5000)
      
      // Limpa o intervalo quando o componente for desmontado
      return () => {
        if (interval) clearInterval(interval)
      }
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

      const response = await fetch("/api/generate-pix", {
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
      setPaymentStatus("pending") // Definir status inicial como pendente
      console.log("[v0] PIX gerado com sucesso!")
    } catch (err) {
      console.log("[v0] Erro capturado:", err)
      setError(`Erro ao gerar PIX: ${err instanceof Error ? err.message : "Tente novamente."}`)
    } finally {
      setIsLoading(false)
    }
  }

  const copyPixCode = () => {
    const pixCode = pixData?.point_of_interaction?.transaction_data?.qr_code;
    if (pixCode) {
      navigator.clipboard.writeText(pixCode)
        .then(() => {
          alert("Código PIX copiado para a área de transferência!");
        })
        .catch(err => {
          console.error("Erro ao copiar o código PIX:", err);
          alert("Não foi possível copiar o código. Por favor, copie manualmente.");
        });
    } else {
      console.error("Código PIX não disponível para cópia");
      alert("Código PIX não disponível. Por favor, tente novamente.");
    }
  }

  // Redireciona para a página de pagamento aprovado quando o status for aprovado
  useEffect(() => {
    if (paymentStatus === "approved") {
      // Adiciona um pequeno atraso para garantir que o estado seja atualizado antes do redirecionamento
      const timer = setTimeout(() => {
        router.push("/pagamento-aprovado");
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [paymentStatus, router]);

  return (
    <div className="min-h-screen gradient-feminine floral-pattern flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-xl border-2 border-primary/20">
        <CardHeader className="text-center space-y-4">
          <Button variant="ghost" onClick={() => router.push('/?skipDemo=true')} className="absolute top-4 left-4 p-2">
            <ArrowLeft className="w-4 h-4" />
          </Button>

          <div className="mx-auto mb-4 w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
            <CreditCard className="w-8 h-8 text-green-600" />
          </div>

          <CardTitle className="text-2xl font-bold text-balance">Kit Básico</CardTitle>

          <div className="text-center">
            <p className="text-3xl font-bold text-purple-600">R$ 15,00</p>
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

        <CardContent className="space-y-6">
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
                  className="w-full bg-green-500 hover:bg-green-600 text-white py-3"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Gerando PIX...
                    </>
                  ) : (
                    <>
                      <CreditCard className="w-4 h-4 mr-2" />
                      Gerar PIX - R$ 15,00
                    </>
                  )}
                </Button>
                
                <a 
                  href="https://wa.me/556181662814?text=Olá,%20preciso%20de%20ajuda%20com%20o%20pagamento%20do%20Kit%20Básico" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full text-sm text-gray-600 hover:text-gray-800 transition-colors border border-gray-200 hover:border-gray-300 rounded-md py-2 px-4 bg-white shadow-sm"
                >
                  <MessageCircle className="w-4 h-4 text-green-500" />
                  Precisa de ajuda? Fale pelo WhatsApp
                </a>
              </div>
              
              <div className="mt-6 space-y-6 max-w-2xl mx-auto">
                <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-6 rounded-lg border border-purple-100 shadow-sm">
                  <h3 className="text-lg font-semibold text-purple-900 mb-4 flex items-center">
                    <MessageCircle className="w-5 h-5 mr-2 text-purple-600" />
                    O que você vai receber
                  </h3>
                  <ul className="space-y-3">
                    <li className="flex items-start">
                      <div className="flex-shrink-0 h-6 w-6 rounded-full bg-green-100 flex items-center justify-center mr-3 mt-0.5">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-800">Acesso ao site completo</p>
                        <p className="text-sm text-gray-500">90 estudos bíblicos completos e organizados para estudo diário</p>
                      </div>
                    </li>
                    <li className="flex items-start pt-3">
                      <div className="flex-shrink-0 h-6 w-6 rounded-full bg-green-100 flex items-center justify-center mr-3 mt-0.5">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-800">Versões em PDF</p>
                        <p className="text-sm text-gray-500">Todos os 90 estudos disponíveis em PDF para baixar e imprimir</p>
                      </div>
                    </li>
                    <li className="flex items-start pt-3">
                      <div className="flex-shrink-0 h-6 w-6 rounded-full bg-green-100 flex items-center justify-center mr-3 mt-0.5">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-800">Acesso vitalício</p>
                        <p className="text-sm text-gray-500">Acesso ilimitado a todas as atualizações futuras</p>
                      </div>
                    </li>
                    <li className="flex items-start pt-3">
                      <div className="flex-shrink-0 h-6 w-6 rounded-full bg-green-100 flex items-center justify-center mr-3 mt-0.5">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-800">Suporte exclusivo</p>
                        <p className="text-sm text-gray-500">Atendimento personalizado para tirar suas dúvidas</p>
                      </div>
                    </li>
                  </ul>
                </div>
              </div>
            </form>
          ) : paymentStatus === "approved" ? (
            <div className="space-y-4 text-center">
              <div className="space-y-2">
                <CheckCircle className="w-16 h-16 text-green-500 mx-auto" />
                <h3 className="font-bold text-xl text-green-600">🎉 Pagamento Aprovado!</h3>
                <p className="text-sm text-muted-foreground">Seu Kit Essencial foi liberado com sucesso!</p>
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

              <Button onClick={() => router.push("/")} className="w-full bg-green-500 hover:bg-green-600 text-white">
                Voltar ao Início
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="text-center space-y-2">
                <div className="flex items-center justify-center gap-2">
                  <CheckCircle className="w-12 h-12 text-green-500" />
                  {checkingPayment && <Loader2 className="w-4 h-4 animate-spin text-blue-500" />}
                </div>
                <h3 className="font-semibold text-lg">PIX Gerado com Sucesso!</h3>
                <p className="text-sm text-muted-foreground">Escaneie o QR Code ou copie o código PIX</p>

                <div className="flex items-center justify-center gap-2 text-xs text-blue-600 bg-blue-50 p-2 rounded">
                  <Clock className="w-3 h-3" />
                  {checkingPayment ? "Verificando pagamento..." : "Aguardando pagamento..."}
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg text-center space-y-3">
                {pixData.point_of_interaction?.transaction_data?.qr_code_base64 ? (
                  <div className="bg-white p-3 rounded-lg border">
                    <p className="text-xs text-muted-foreground mb-2">QR Code PIX:</p>
                    <div className="w-48 h-48 mx-auto bg-white rounded-lg flex items-center justify-center">
                      <img
                        src={`data:image/png;base64,${pixData.point_of_interaction.transaction_data.qr_code_base64}`}
                        alt="QR Code PIX"
                        className="w-full h-full object-contain"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
                    <p className="text-yellow-700">QR Code não disponível. Por favor, copie o código PIX abaixo.</p>
                  </div>
                )}

                <div>
                  <p className="text-xs text-muted-foreground mb-2">Código PIX:</p>
                  <p className="text-xs font-mono bg-white p-2 rounded border break-all">
                    {pixData.point_of_interaction?.transaction_data?.qr_code || "Código PIX não disponível"}
                  </p>
                </div>
              </div>

              <Button onClick={copyPixCode} variant="outline" className="w-full bg-transparent">
                Copiar Código PIX
              </Button>

              <div className="text-center text-xs text-muted-foreground">
                <p className="font-semibold text-green-600">✨ Detecção automática ativada!</p>
                <p>Assim que você pagar, o acesso será liberado automaticamente</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
