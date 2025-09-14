'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle, Loader2, Clock, MessageCircle, Copy } from 'lucide-react';

declare global {
  interface Window {
    fbq: any;
    _fbq?: any;
  }
}

export default function PosTestePage() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [pixData, setPixData] = useState<any>(null);
  const [error, setError] = useState('');
  const [paymentStatus, setPaymentStatus] = useState<'pending' | 'approved' | 'checking' | string>('pending');
  const [checkingPayment, setCheckingPayment] = useState(false);
  const router = useRouter();
  const paymentCheckInterval = useRef<NodeJS.Timeout | null>(null);

  // Facebook Pixel - Initiate Checkout
  useEffect(() => {
    const FB_PIXEL_ID = '2292146237905291';
    
    const fireInitiateCheckout = () => {
      if (typeof window === 'undefined' || !window.fbq) {
        console.log('[Facebook Pixel] fbq not available yet, will retry...');
        setTimeout(fireInitiateCheckout, 500);
        return;
      }
      
      console.log('[Facebook Pixel] Disparando InitiateCheckout...');
      
      try {
        const eventData = {
          content_category: 'Religioso',
          content_ids: ['kit_basico'],
          content_name: 'Kit Básico de Estudos Bíblicos',
          currency: 'BRL',
          value: 15.00,
          content_type: 'product',
          eventID: 'pos-teste-initiate-checkout-' + Date.now()
        };
        
        console.log('[Facebook Pixel] Dados do evento:', JSON.stringify(eventData, null, 2));
        
        // Track the event
        window.fbq('track', 'InitiateCheckout', eventData);
        console.log('[Facebook Pixel] InitiateCheckout disparado com sucesso');
        
        // Also fire a standard PageView
        window.fbq('track', 'PageView');
      } catch (error) {
        console.error('[Facebook Pixel] Erro ao disparar InitiateCheckout:', error);
      }
    };
    
    // Add event listener for when the pixel is loaded
    const handlePixelLoaded = () => {
      console.log('[Facebook Pixel] Evento de carregamento detectado');
      fireInitiateCheckout();
    };
    
    // Listen for the pixel loaded event
    document.addEventListener('fbevents.loaded', handlePixelLoaded);
    
    // Try to fire immediately in case pixel is already loaded
    fireInitiateCheckout();
    
    // Clean up
    return () => {
      document.removeEventListener('fbevents.loaded', handlePixelLoaded);
    };
  }, []);

  // Handle PIX code copy
  const copyPixCode = () => {
    if (!pixData?.pixCode) return;
    
    navigator.clipboard.writeText(pixData.pixCode)
      .then(() => {
        alert('Código PIX copiado para a área de transferência!');
      })
      .catch(err => {
        console.error('Erro ao copiar código PIX:', err);
        alert('Não foi possível copiar o código PIX. Por favor, copie manualmente.');
      });
  };

  // Check payment status
  const checkPaymentStatus = async () => {
    if (!pixData?.id) return;
    
    setCheckingPayment(true);
    
    try {
      const response = await fetch(`/api/check-payment?id=${pixData.id}`);
      const data = await response.json();
      
      if (data.status === 'approved') {
        setPaymentStatus('approved');
        
        // Fire Facebook Pixel Purchase event
        try {
          if (typeof window !== 'undefined' && window.fbq) {
            const purchaseData = {
              value: 15.00,
              currency: 'BRL',
              content_type: 'product',
              content_ids: ['kit_basico'],
              content_name: 'Kit Básico de Estudos Bíblicos',
              content_category: 'Religioso',
              transaction_id: pixData.id,
              eventID: 'purchase-' + Date.now()
            };
            
            window.fbq('track', 'Purchase', purchaseData);
            console.log('[Facebook Pixel] Purchase event fired:', purchaseData);
          }
        } catch (error) {
          console.error('[Facebook Pixel] Error firing Purchase event:', error);
        }
        
        // Clear the interval
        if (paymentCheckInterval.current) {
          clearInterval(paymentCheckInterval.current);
          paymentCheckInterval.current = null;
        }
        
        // Redirect to thank you page after a short delay
        setTimeout(() => {
          router.push('/pagamento-aprovado');
        }, 2000);
      }
    } catch (error) {
      console.error('Erro ao verificar status do pagamento:', error);
      setError('Erro ao verificar status do pagamento. Por favor, tente novamente.');
    } finally {
      setCheckingPayment(false);
    }
  };

  // Set up payment status checking
  useEffect(() => {
    if (pixData?.id && paymentStatus === 'pending') {
      // Check immediately and then every 5 seconds
      checkPaymentStatus();
      paymentCheckInterval.current = setInterval(checkPaymentStatus, 5000);
    }
    
    return () => {
      if (paymentCheckInterval.current) {
        clearInterval(paymentCheckInterval.current);
        paymentCheckInterval.current = null;
      }
    };
  }, [pixData, paymentStatus]);

  // Handle PIX payment form submission
  const handlePixPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      setError('Por favor, insira um e-mail válido.');
      return;
    }
    
    setIsLoading(true);
    setError('');
    
    try {
      const response = await fetch('/api/generate-pix', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });
      
      if (!response.ok) {
        throw new Error('Erro ao gerar código PIX');
      }
      
      const data = await response.json();
      setPixData(data);
      setPaymentStatus('pending');
      
    } catch (error) {
      console.error('Erro ao processar pagamento:', error);
      setError('Não foi possível processar o pagamento. Por favor, tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto bg-white rounded-xl shadow-md overflow-hidden md:max-w-2xl">
        <div className="p-8">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-gray-900">Pagamento via PIX</h1>
            <p className="mt-2 text-gray-600">Complete seu pedido em poucos segundos</p>
          </div>
          
          {!pixData ? (
            <form onSubmit={handlePixPayment} className="space-y-6">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  Seu melhor e-mail
                </label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="seu@email.com"
                  required
                />
              </div>
              
              {error && (
                <div className="text-red-600 text-sm">
                  {error}
                </div>
              )}
              
              <div>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" />
                      Processando...
                    </>
                  ) : (
                    'Gerar Código PIX'
                  )}
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-6">
              <div className="bg-blue-50 border-l-4 border-blue-400 p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <MessageCircle className="h-5 w-5 text-blue-400" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-blue-700">
                      Enviamos o QR Code e o código PIX para <span className="font-medium">{email}</span>.
                      Verifique sua caixa de entrada e spam.
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium text-gray-900">Código PIX Copia e Cola</h3>
                  <button
                    onClick={copyPixCode}
                    className="inline-flex items-center px-3 py-1 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    <Copy className="h-4 w-4 mr-1" />
                    Copiar
                  </button>
                </div>
                
                <div className="bg-gray-50 p-3 rounded-md overflow-x-auto">
                  <code className="text-sm text-gray-800 break-all">
                    {pixData.pixCode}
                  </code>
                </div>
                
                <div className="mt-4 flex items-center text-sm text-gray-500">
                  <Clock className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" />
                  <p>Este código PIX expira em 30 minutos</p>
                </div>
              </div>
              
              {checkingPayment && (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="animate-spin h-5 w-5 text-blue-500 mr-2" />
                  <span className="text-sm text-gray-600">Verificando pagamento...</span>
                </div>
              )}
              
              {paymentStatus === 'approved' && (
                <div className="rounded-md bg-green-50 p-4">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <CheckCircle className="h-5 w-5 text-green-400" />
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-green-800">
                        Pagamento aprovado! Redirecionando...
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
          
          <div className="mt-6 text-center text-sm text-gray-500">
            <p>Dúvidas? Entre em contato pelo suporte@seusite.com</p>
          </div>
        </div>
      </div>
    </div>
  );
}
