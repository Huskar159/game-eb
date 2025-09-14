'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle, Loader2, Clock, MessageCircle } from 'lucide-react';

export default function PosTestePage() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [pixData, setPixData] = useState<any>(null);
  const [error, setError] = useState('');
  const [paymentStatus, setPaymentStatus] = useState<'pending' | 'approved' | 'checking' | string>('pending');
  const [checkingPayment, setCheckingPayment] = useState(false);
  const router = useRouter();

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
  };

  // Check payment status
  useEffect(() => {
    let interval: NodeJS.Timeout;

    const checkPaymentStatus = async () => {
      if (!pixData?.id) return;
      
      try {
        console.log("[v0] Verificando status do pagamento:", pixData.id, "Status atual:", paymentStatus);
        setCheckingPayment(true);

        const response = await fetch(`/api/check-payment/${pixData.id}?t=${Date.now()}`); // Adiciona timestamp para evitar cache
        
        if (!response.ok) {
          console.error("[v0] Erro na resposta da API:", response.status);
          return;
        }
        
        const data = await response.json();
        console.log("[v0] Resposta da verificação de pagamento:", data);

        if (data.status === "approved") {
          console.log("[v0] Pagamento aprovado!");
          setPaymentStatus("approved");
          clearInterval(interval);
          // Redireciona para a página de pagamento aprovado
          setTimeout(() => {
            router.push("/pagamento-aprovado");
          }, 2000);
        } else if (data.status === "rejected") {
          console.log("[v0] Pagamento rejeitado");
          setError("Pagamento rejeitado. Por favor, tente novamente.");
          setPaymentStatus("pending");
          clearInterval(interval);
        }
        
      } catch (error) {
        console.error("[v0] Erro ao verificar pagamento:", error);
        setError("Erro ao verificar status do pagamento. Atualize a página e tente novamente.");
      } finally {
        setCheckingPayment(false);
      }
    };

    if (pixData?.id && paymentStatus === "pending") {
      // Verifica imediatamente e depois a cada 5 segundos
      checkPaymentStatus();
      interval = setInterval(checkPaymentStatus, 5000);
      
      // Limpa o intervalo quando o componente for desmontado
      return () => {
        if (interval) clearInterval(interval);
      };
    }
  }, [pixData?.id, paymentStatus, router]);

  const handlePixPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    
    setIsLoading(true);
    setError('');

    try {
      console.log("[v0] Iniciando geração do PIX...");
      console.log("[v0] Email:", email);

      const response = await fetch("/api/generate-pix", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      console.log("[v0] Response status:", response.status);

      const data = await response.json();
      console.log("[v0] Response data:", data);

      if (!response.ok) {
        throw new Error(data.error || "Erro ao processar pagamento");
      }

      setPixData(data);
      setPaymentStatus("pending");
      console.log("[v0] PIX gerado com sucesso!");
    } catch (err) {
      console.log("[v0] Erro capturado:", err);
      setError(`Erro ao gerar PIX: ${err instanceof Error ? err.message : "Tente novamente."}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-pink-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto text-center">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-purple-900 mb-6">Obrigada por testar nosso conteúdo!</h1>
          
          <div className="bg-white rounded-xl shadow-lg p-8 mb-8 text-left">
            {!pixData ? (
              <>
                <div className="text-center mb-8">
                  <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-pink-100 flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-pink-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <p className="text-gray-700 mb-6 text-lg">
                    Você testou por 60 segundos e viu que o conteúdo é sério.
                  </p>
                  <p className="text-gray-700 mb-6">
                    Vou confiar na sua honestidade como irmã em Cristo. Vou liberar primeiro todo o material para você baixar, confiando que você é íntegra e vai cumprir sua palavra, como Jesus nos ensinou.
                  </p>
                </div>

                <div className="text-center mb-8">
                  <h2 className="text-2xl font-semibold text-purple-800 mb-4">
                    👇 BAIXE AGORA os 90 Estudos Bíblicos + Link do Site Completo
                  </h2>
                  <div className="flex flex-col space-y-4 max-w-xs mx-auto">
                    <a 
                      href="https://drive.google.com/drive/folders/1_UFdNBFTTb8WNucLI7wqkw_efr-EYIN_" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="bg-pink-500 hover:bg-pink-600 text-white font-bold py-4 px-8 rounded-full text-lg shadow-lg transform transition-all duration-300 hover:scale-105 inline-block text-center"
                    >
                      Baixar PDFs
                    </a>
                    <a 
                      href="https://estudo-biblico-mulheres.lovable.app/" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="bg-purple-500 hover:bg-purple-600 text-white font-bold py-4 px-8 rounded-full text-lg shadow-lg transform transition-all duration-300 hover:scale-105 inline-block text-center"
                    >
                      Acessar Site Completo
                    </a>
                  </div>
                </div>

                <div className="text-center">
                  <p className="text-gray-700 mb-6 text-center">
                    Para gerar o PIX e ter acesso completo, insira seu e-mail abaixo e clique em "Gerar PIX - R$ 15,00"
                  </p>
                  
                  <form onSubmit={handlePixPayment} className="max-w-md mx-auto">
                    {error && <div className="text-red-600 text-sm mb-4 bg-red-50 p-2 rounded">{error}</div>}
                    
                    <div className="mb-4">
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Seu melhor e-mail"
                        className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-pink-300 focus:border-transparent"
                        required
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-4 px-6 rounded-lg text-lg shadow-lg transition-all duration-300 flex items-center justify-center"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" />
                          Gerando PIX...
                        </>
                      ) : (
                        'Gerar PIX - R$ 15,00'
                      )}
                    </button>
                  </form>
                  
                  <a 
                    href="https://wa.me/556181662814?text=Olá,%20preciso%20de%20ajuda%20com%20o%20pagamento%20PIX%20do%20Kit%20Básico" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 w-full max-w-md mx-auto mt-4 text-sm text-gray-600 hover:text-gray-800 transition-colors border border-gray-200 hover:border-gray-300 rounded-md py-2 px-4 bg-white shadow-sm"
                  >
                    <svg className="w-5 h-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                    Precisa de ajuda? Fale pelo WhatsApp
                  </a>
                  
                  <p className="text-sm text-gray-500 mt-4">
                    É assim que funciona: confiança gera confiança.
                  </p>
                </div>
              </>
            ) : paymentStatus === "approved" ? (
              <div className="text-center py-8">
                <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                <h3 className="text-2xl font-bold text-green-600 mb-2">Pagamento Aprovado!</h3>
                <p className="text-gray-700 mb-6">Seu acesso foi liberado com sucesso!</p>
                <button 
                  onClick={() => router.push('/pagamento-aprovado')}
                  className="bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-6 rounded-lg"
                >
                  Acessar Conteúdo
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="text-center">
                  <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-green-100 flex items-center justify-center">
                    <CheckCircle className="w-12 h-12 text-green-500" />
                  </div>
                  <h3 className="text-xl font-bold text-purple-800 mb-2">PIX Gerado com Sucesso!</h3>
                  <p className="text-gray-600 mb-6">Escaneie o QR Code ou copie o código PIX abaixo</p>
                  
                  {checkingPayment && (
                    <div className="flex items-center justify-center gap-2 text-blue-600 bg-blue-50 p-2 rounded-lg mb-4">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Verificando pagamento...
                    </div>
                  )}
                </div>

                <div className="bg-gray-50 p-6 rounded-xl">
                  {pixData.point_of_interaction?.transaction_data?.qr_code_base64 ? (
                    <div className="bg-white p-4 rounded-lg border border-gray-200 mb-6">
                      <p className="text-sm text-gray-500 mb-3">Escaneie este QR Code no seu app do banco:</p>
                      <div className="w-48 h-48 mx-auto bg-white rounded-lg flex items-center justify-center p-2 border border-gray-200">
                        <img
                          src={`data:image/png;base64,${pixData.point_of_interaction.transaction_data.qr_code_base64}`}
                          alt="QR Code PIX"
                          className="w-full h-full object-contain"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
                      <p className="text-yellow-700">QR Code não disponível. Por favor, copie o código PIX abaixo.</p>
                    </div>
                  )}

                  <div className="mb-6">
                    <p className="text-sm text-gray-600 mb-2">Ou copie o código PIX:</p>
                    <div className="relative">
                      <div className="bg-white p-3 rounded-lg border border-gray-300 overflow-x-auto">
                        <p className="text-sm font-mono break-all">
                          {pixData.point_of_interaction?.transaction_data?.qr_code || "Código PIX não disponível"}
                        </p>
                        <button
                          onClick={copyPixCode}
                          className="mt-3 w-full bg-purple-100 hover:bg-purple-200 text-purple-700 font-medium py-2 px-4 rounded-md transition-colors flex items-center justify-center gap-2"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                          </svg>
                          Copiar Código PIX
                        </button>
                      </div>
                      <button
                        onClick={copyPixCode}
                        className="absolute top-2 right-2 p-1 text-gray-500 hover:text-purple-600"
                        title="Copiar código PIX"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                      </button>
                    </div>
                  </div>

                  <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                    <h4 className="font-semibold text-blue-800 mb-2 flex items-center justify-center gap-2">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h2a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                      </svg>
                      Como pagar com PIX
                    </h4>
                    <ol className="text-sm text-gray-700 space-y-2 text-left pl-5 list-decimal">
                      <li>Abra o app do seu banco</li>
                      <li>Vá em PIX Copia e Cola</li>
                      <li>Cole o código e confirme o pagamento</li>
                      <li>Seu acesso será liberado automaticamente</li>
                    </ol>
                  </div>
                </div>

                <div className="text-center">
                  <a 
                    href="https://wa.me/556181662814?text=Olá,%20preciso%20de%20ajuda%20com%20o%20pagamento%20PIX%20do%20Kit%20Básico" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 w-full max-w-md mx-auto mb-4 text-sm text-gray-600 hover:text-gray-800 transition-colors border border-gray-200 hover:border-gray-300 rounded-md py-2 px-4 bg-white shadow-sm"
                  >
                    <svg className="w-5 h-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                    Precisa de ajuda? Fale pelo WhatsApp
                  </a>
                  <p className="text-xs text-gray-400">
                    Pagamento processado com segurança por Mercado Pago
                  </p>
                </div>
              </div>
            )}
          </div>
          
          {!pixData && (
            <div className="mt-8 text-sm text-gray-500">
              <p>Se tiver qualquer dúvida, entre em contato pelo nosso WhatsApp de suporte.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
