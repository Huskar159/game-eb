'use client';

import { useEffect } from 'react';

interface FacebookPixelPurchaseProps {
  price: number;
  contentId: string;
  contentName: string;
}

declare global {
  interface Window {
    fbq: any;
    _fbq?: any;
  }
}

export default function FacebookPixelPurchase({ 
  price = 0, 
  contentId = '', 
  contentName = 'Product' 
}: FacebookPixelPurchaseProps) {
  useEffect(() => {
    // Função para rastrear a compra
    const trackPurchase = () => {
      console.log('[Facebook Pixel] Iniciando rastreamento de compra...', { contentId, contentName, price });
      
      // Verifica se o fbq está disponível
      if (typeof window.fbq === 'function') {
        console.log('[Facebook Pixel] fbq disponível, disparando evento de compra');
        
        // Garante que o Pixel está inicializado
        window.fbq('consent', 'grant');
        window.fbq('init', '2292146237905291');
        
        // Dispara o evento de compra com parâmetros obrigatórios
        window.fbq('track', 'Purchase', {
          // Parâmetros principais
          value: price,
          currency: 'BRL',
          content_ids: [contentId],
          content_name: contentName,
          content_type: 'product',
          content_category: 'Estudos Bíblicos',
          num_items: 1,
          order_id: 'order_' + Date.now() + '_' + contentId
        });
        
        console.log('[Facebook Pixel] Evento de compra disparado com sucesso!');
        return true;
      }
      
      console.log('[Facebook Pixel] fbq ainda não está disponível');
      return false;
    };

    // Tenta rastrear imediatamente
    let tracked = trackPurchase();
    
    // Se não conseguiu, tenta novamente após 1 segundo
    if (!tracked) {
      const timer1 = setTimeout(() => {
        console.log('[Facebook Pixel] Segunda tentativa de rastreamento...');
        tracked = trackPurchase();
        
        // Se ainda não conseguiu, tenta mais uma vez após 2 segundos
        if (!tracked) {
          const timer2 = setTimeout(() => {
            console.log('[Facebook Pixel] Terceira tentativa de rastreamento...');
            trackPurchase();
          }, 2000);
          
          return () => clearTimeout(timer2);
        }
      }, 1000);
      
      return () => clearTimeout(timer1);
    }
    
    return () => {};
  }, []);

  return null;
}
