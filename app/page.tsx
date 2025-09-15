"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Clock, CheckCircle, Star, Users, Gift, Heart, Sparkles, ArrowRight } from "lucide-react"
import { useRouter } from "next/navigation"

export default function BibleStudyDemo() {
  const [timeLeft, setTimeLeft] = useState(60)
  const [isActive, setIsActive] = useState(false)
  const [isBlocked, setIsBlocked] = useState(false)
  const [skipDemo, setSkipDemo] = useState(false)
  const router = useRouter()

  useEffect(() => {
    // Verifica o parâmetro skipDemo na URL
    const searchParams = new URLSearchParams(window.location.search)
    if (searchParams.get('skipDemo') === 'true') {
      setSkipDemo(true)
      setIsBlocked(true)
      // Redireciona para /pos-teste apenas se skipDemo for true
      router.push('/pos-teste')
    }
  }, [router])

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null

    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((timeLeft) => {
          if (timeLeft <= 1) {
            setIsBlocked(true)
            setIsActive(false)
            router.push('/pos-teste')
            return 0
          }
          return timeLeft - 1
        })
      }, 1000)
    }

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [isActive, timeLeft])

  const startDemo = (skipToEnd = false) => {
    if (skipToEnd) {
      setIsBlocked(true)
      setIsActive(false)
      router.push('/pos-teste')
    } else {
      setIsActive(true)
      setTimeLeft(60)
      setIsBlocked(false)
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  const handleKitEssencialClick = () => {
    router.push("/checkout")
  }

  if (!isActive && !isBlocked && !skipDemo) {
    return (
      <div className="min-h-screen gradient-feminine floral-pattern flex items-center justify-center p-4">
        <Card className="w-full max-w-3xl shadow-xl border-2 border-primary/20">
          <CardHeader className="text-center space-y-4">
            <div className="mx-auto mb-4 w-20 h-20 bg-primary rounded-full flex items-center justify-center shadow-lg">
              <Heart className="w-10 h-10 text-primary-foreground" />
            </div>
            <div className="flex items-center justify-center gap-2 mb-2">
              <Sparkles className="w-5 h-5 text-accent" />
              <span className="text-sm font-medium text-accent-foreground">🌸 Especialmente para você 🌸</span>
              <Sparkles className="w-5 h-5 text-accent" />
            </div>
            <CardTitle className="text-3xl md:text-4xl font-bold text-balance leading-tight">
              Transforme sua célula feminina com estudos que tocam o coração - sem stress, sem correria
            </CardTitle>
            <CardDescription className="text-lg md:text-xl text-pretty text-muted-foreground">
              Receba agora 90 estudos exclusivos e veja como vai revolucionar suas ministrações femininas
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-[#f8e9f7] p-6 rounded-xl border-2 border-pink-200">
              <h3 className="font-semibold text-xl mb-4 flex items-center gap-2 text-pink-800">
                <Star className="w-6 h-6 text-pink-500 fill-pink-300" />
                ⭐ Seus estudos personalizados estão prontos!
              </h3>
              <p className="text-gray-800 mb-4 text-lg">
                Posso confiar na sua honestidade como irmã em Cristo?
              </p>
              <p className="text-gray-800 mb-6">
                Vou entregar primeiro todo o material para você avaliar, confiando que você vai fazer o pagamento depois. Igual Jesus nos ensinou sobre integridade e cumprir nossa palavra.
              </p>
              <h4 className="font-semibold text-lg mb-3 text-pink-700">📖 90 Estudos Completos organizados por temas:</h4>
              <div className="grid grid-cols-1 gap-3 mb-6">
                <div className="bg-white/50 p-3 rounded-lg border border-pink-100">
                  <div className="font-semibold text-pink-700">✅ IDENTIDADE FEMININA</div>
                  <p className="text-sm text-gray-700">Autoestima bíblica, valor da mulher, propósito, dons e talentos</p>
                </div>
                <div className="bg-white/50 p-3 rounded-lg border border-pink-100">
                  <div className="font-semibold text-pink-700">✅ RELACIONAMENTOS</div>
                  <p className="text-sm text-gray-700">Casamento cristão, amizades, perdão, relacionamento mãe e filhos</p>
                </div>
                <div className="bg-white/50 p-3 rounded-lg border border-pink-100">
                  <div className="font-semibold text-pink-700">✅ VIDA ESPIRITUAL</div>
                  <p className="text-sm text-gray-700">Oração eficaz, intimidade com Deus, jejum, disciplinas espirituais</p>
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <CheckCircle className="w-5 h-5 text-pink-500" />
                  <span className="text-gray-800">Versões em PDF + Site interativo</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-pink-500" />
                  <span className="text-gray-800">Acesso vitalício para consultar sempre</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-pink-500" />
                  <span className="text-gray-800">Economize 5+ horas de preparação por semana</span>
                </div>
              </div>
            </div>

            <div className="text-center bg-pink-50 p-4 rounded-xl border-2 border-pink-100">
              <p className="text-sm font-medium text-pink-700 flex items-center justify-center gap-2">
                <Users className="w-5 h-5 text-pink-500" />
                ⭐ Mais de 500 líderes já estão transformando suas células - Nota média: 4.9/5 ⭐⭐⭐⭐⭐
              </p>
            </div>

            <div className="bg-pink-50 border-2 border-pink-100 p-6 rounded-xl text-center">
              <p className="text-lg font-semibold text-pink-800 mb-4">
                Se você se compromete a fazer o pagamento de R$ 15 após receber e avaliar todo o material, clique abaixo:
              </p>
              <div className="w-full max-w-xl mx-auto">
                <Button
                  onClick={startDemo}
                  className="w-full text-base py-8 px-8 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-bold shadow-lg transform hover:scale-105 transition-all"
                  size="lg"
                >
                  <div className="flex flex-col items-center justify-center w-full space-y-1">
                    <div className="text-center">
                      <span>🎁 RECEBER ESTUDOS AGORA</span>
                    </div>
                    <div className="text-center">Vou Confiar em Você! 📖</div>
                  </div>
                </Button>
              </div>
              <p className="text-sm text-pink-700 mt-3 italic">
                É assim que funciona: confiança gera confiança.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (isBlocked) {
    return (
      <div className="min-h-screen gradient-feminine floral-pattern flex items-center justify-center p-4">
        <Card className="w-full max-w-5xl shadow-xl border-2 border-primary/20">
          <CardHeader className="text-center space-y-4">
            <div className="mx-auto mb-4 w-20 h-20 bg-accent rounded-full flex items-center justify-center shadow-lg">
              <Star className="w-10 h-10 text-accent-foreground" />
            </div>
            <CardTitle className="text-2xl md:text-3xl font-bold text-balance leading-tight">
              🎯 Você acabou de experimentar o que mais de 500 líderes já usam!
            </CardTitle>
            <CardDescription className="text-lg md:text-xl text-pretty">
              Viu como é fácil encontrar o estudo perfeito em segundos?
              <br />
              Agora imagine ter isso disponível 24h para suas células femininas...
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Kit Básico */}
              <Card className="border-2 border-secondary/40 bg-secondary/10">
                <CardHeader className="pb-4">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <CardTitle className="text-lg sm:text-xl flex items-center gap-2">💜 KIT ESSENCIAL</CardTitle>
                    <Badge
                      variant="secondary"
                      className="bg-secondary text-secondary-foreground text-base sm:text-lg px-3 py-1 self-start"
                    >
                      R$ 15,00
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-accent mt-0.5 flex-shrink-0" />
                      <span className="text-sm">✅ Acesso VITALÍCIO ao sistema completo</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-accent mt-0.5 flex-shrink-0" />
                      <span className="text-sm">✅ 90 estudos prontos (sem mais noites em branco preparando)</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-accent mt-0.5 flex-shrink-0" />
                      <span className="text-sm">✅ Receba a versão em PDF dos 90 Estudos</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-accent mt-0.5 flex-shrink-0" />
                      <span className="text-sm">✅ Estudos Separados por tema/duração</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-accent mt-0.5 flex-shrink-0" />
                      <span className="text-sm">✅ Suporte direto comigo no WhatsApp</span>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    onClick={handleKitEssencialClick} // Added click handler to redirect to checkout
                    className="w-full bg-green-100 border-green-300 hover:bg-green-200 text-black text-xs sm:text-sm py-4 px-2 h-auto min-h-[3rem] whitespace-normal leading-tight"
                  >
                    <span className="text-balance flex items-center justify-center">
                      <ArrowRight className="w-4 h-4 mr-1" />
                      <span>Quero Facilitar Minha Vida por R$ 15,00 ❤️</span>
                    </span>
                  </Button>
                </CardContent>
              </Card>

              {/* Kit Completo */}
              <Card className="border-2 border-primary bg-primary/10 relative shadow-lg">
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <Badge className="bg-accent text-accent-foreground shadow-md text-xs sm:text-sm">
                    👑 MAIS ESCOLHIDO
                  </Badge>
                </div>
                <CardHeader className="pb-4 pt-6">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                    <CardTitle className="text-lg sm:text-xl flex items-center gap-2">
                      👑 KIT LÍDER TRANSFORMADA
                    </CardTitle>
                    <div className="text-left sm:text-right">
                      <Badge className="bg-primary text-primary-foreground text-base sm:text-lg px-3 py-1">
                        R$ 24,90
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <p className="text-sm font-semibold bg-accent/20 p-2 rounded">🔥 TUDO do Kit Essencial +</p>
                    <div className="flex items-start gap-2">
                      <Gift className="w-4 h-4 text-accent mt-0.5 flex-shrink-0" />
                      <div className="text-sm">
                        <strong>🎁 BÔNUS 1:</strong> Guia da Líder de Célula Feminina
                        <br />
                        <span className="text-muted-foreground text-xs sm:text-sm">
                          → Domine a arte de liderar com segurança, propósito e sabedoria bíblica
                        </span>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <Gift className="w-4 h-4 text-accent mt-0.5 flex-shrink-0" />
                      <div className="text-sm">
                        <strong>🎁 BÔNUS 2:</strong> Dinâmicas Quebra-Gelo
                        <br />
                        <span className="text-muted-foreground text-xs sm:text-sm">
                          → Atividades testadas que criam conexão instantânea e preparam corações receptivos
                        </span>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <Gift className="w-4 h-4 text-accent mt-0.5 flex-shrink-0" />
                      <div className="text-sm">
                        <strong>🎁 BÔNUS 3:</strong> Banco de Versículos por Tema Feminino
                        <br />
                        <span className="text-muted-foreground text-xs sm:text-sm">
                          → Versículos estrategicamente organizados para cada desafio da vida feminina
                        </span>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <Gift className="w-4 h-4 text-accent mt-0.5 flex-shrink-0" />
                      <div className="text-sm">
                        <strong>🎁 BÔNUS 4:</strong> A Força da Mulher de Fé
                        <br />
                        <span className="text-muted-foreground text-xs sm:text-sm">
                          → Domine oração e jejum como armas poderosas de transformação pessoal
                        </span>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <Gift className="w-4 h-4 text-accent mt-0.5 flex-shrink-0" />
                      <div className="text-sm">
                        <strong>🎁 BÔNUS 5:</strong> Mulheres Inspiradoras da Bíblia
                        <br />
                        <span className="text-muted-foreground text-xs sm:text-sm">
                          → Cases reais de coragem aplicados aos desafios da mulher atual
                        </span>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <Gift className="w-4 h-4 text-accent mt-0.5 flex-shrink-0" />
                      <div className="text-sm">
                        <strong>🎁 BÔNUS 6:</strong> Perguntas Reflexivas Poderosas
                        <br />
                        <span className="text-muted-foreground text-xs sm:text-sm">
                          → Técnicas de conversas que geram cura profunda e crescimento genuíno
                        </span>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <Gift className="w-4 h-4 text-accent mt-0.5 flex-shrink-0" />
                      <div className="text-sm">
                        <strong>🎁 BÔNUS 7:</strong> Manual de Primeiros Socorros Espirituais
                        <br />
                        <span className="text-muted-foreground text-xs sm:text-sm">
                          → Protocolo bíblico para acolher e restaurar mulheres em momentos críticos
                        </span>
                      </div>
                    </div>
                  </div>
                  <Button 
                    onClick={() => router.push('/checkout-premium')}
                    className="w-full text-xs sm:text-base py-4 sm:py-6 bg-purple-500 hover:bg-purple-600 text-white shadow-lg px-2 h-auto min-h-[3.5rem] whitespace-normal leading-tight"
                  >
                    <span className="text-balance flex items-center justify-center">
                      <ArrowRight className="w-4 h-4 mr-1" />
                      <span>QUERO SER UMA LÍDER TRANSFORMADA - R$ 24,90 🚀</span>
                    </span>
                  </Button>
                </CardContent>
              </Card>
            </div>

            <div className="bg-red-50 border-2 border-red-200 p-3 sm:p-4 rounded-xl">
              <div className="text-center space-y-2">
                <p className="text-red-800 font-semibold flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 text-sm sm:text-base">
                  <Clock className="w-4 h-4" />⏰ ATENÇÃO: Esta oferta especial expira hoje às 23:59h
                </p>
                <p className="text-xs sm:text-sm text-red-700">🔥 Últimas 48h: 73 líderes escolheram o Kit Completo</p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
              <div className="bg-accent/10 p-3 sm:p-4 rounded-xl border border-accent/20">
                <p className="text-sm italic">"Comprei ontem e já usei hoje! Minha célula feminina foi INCRÍVEL!"</p>
                <p className="text-xs text-muted-foreground mt-2">- Priscila, líder há 3 anos</p>
              </div>
              <div className="bg-accent/10 p-3 sm:p-4 rounded-xl border border-accent/20">
                <p className="text-sm italic">"Nunca pensei que preparar estudo pudesse ser tão rápido!"</p>
                <p className="text-xs text-muted-foreground mt-2">- Mariana, São Paulo</p>
              </div>
            </div>

            <div className="bg-primary/10 p-6 rounded-xl border border-primary/20 text-center">
              <p className="text-sm font-medium mb-2">💡 LEMBRE-SE: Cada estudo economiza 2-3 horas de preparação</p>
              <p className="text-sm text-muted-foreground mb-3">
                Em apenas 1 mês você já terá economizado mais tempo do que o investimento vale!
              </p>
              <p className="text-xs text-muted-foreground">
                🔒 Pagamento 100% seguro • Acesso em 2 minutos • Usado por líderes em todo Brasil
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background relative">
      <div className="fixed top-0 left-0 right-0 z-50 bg-primary text-primary-foreground p-4 shadow-lg border-b-2 border-primary/20">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 bg-accent rounded-full pulse-animation"></div>
            <span className="font-semibold">✨ DEMO ATIVA</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-lg font-bold">
              <Clock className="w-5 h-5" />
              {formatTime(timeLeft)}
            </div>
            <Button
              onClick={() => startDemo(true)}
              variant="outline"
              size="sm"
              className="bg-white/10 hover:bg-white/20 border-white/20 text-white cursor-pointer"
            >
              Ir para o material
            </Button>
          </div>
        </div>
      </div>

      {/* Iframe Container */}
      <div className="pt-16 h-screen">
        <iframe
          src="https://estudo-biblico-mulheres.lovable.app/"
          className="w-full h-full border-0"
          title="Demo do Sistema de Estudos Bíblicos"
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
        />
      </div>

      {/* Watermark */}
      <div className="watermark">Versão Demonstrativa 💕</div>

      {timeLeft <= 10 && (
        <div className="fixed inset-0 pointer-events-none z-40">
          <div className="absolute inset-0 bg-accent/20 animate-pulse"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
            <Card className="bg-accent/30 border-accent shadow-xl">
              <CardContent className="p-4 text-center">
                <p className="text-accent-foreground font-semibold">⚠️ Tempo quase esgotado: {timeLeft}s</p>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  )
}
