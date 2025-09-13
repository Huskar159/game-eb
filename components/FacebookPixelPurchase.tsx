'use client';

import { useEffect } from 'react';

interface FacebookPixelPurchaseProps {
  price: number;
  contentId: string;
  contentName: string;
  currency?: string;
}

const PIXEL_ID = '2292146237905291';

export default function FacebookPixelPurchase({ 
  price, 
  contentId, 
  contentName,
  currency = 'BRL'
}: FacebookPixelPurchaseProps) {
  useEffect(() => {
    console.log('Iniciando FacebookPixelPurchase com:', { price, contentId, contentName, currency });
    
    // Função para disparar o evento de compra
    const trackPurchase = () => {
      console.log('Tentando disparar evento Purchase...');
      
      if (typeof window.fbq === 'function') {
        console.log('fbq disponível, disparando evento Purchase com:', {
          price,
          contentId,
          contentName,
          currency
        });
        
        try {
          // Gera um ID único para o pedido
          const orderId = 'order_' + Date.now() + '_' + Math.floor(Math.random() * 1000) + '_' + contentId;
          
          window.fbq('track', 'Purchase', {
            value: price,
            currency: currency,
            content_ids: [contentId],
            content_name: contentName,
            content_type: 'product_group',
            content_category: 'Estudos Bíblicos',
            num_items: 1,
            order_id: orderId,
            product_catalog_id: 'estudos_biblicos',
            product_price: price,
            product_quantity: 1,
            source: 'checkout_premium',
            page_type: 'thank_you_page'
          });
          
          console.log('Evento Purchase disparado com sucesso!', { orderId });
          return true;
        } catch (error) {
          console.error('Erro ao disparar evento Purchase:', error);
          return false;
        }
      } else {
        console.warn('fbq ainda não está disponível, tentando novamente em 1 segundo...');
        // Tenta novamente após 1 segundo se o fbq ainda não estiver disponível
        setTimeout(trackPurchase, 1000);
        return false;
      }
    };

    // Verifica se o Pixel já está carregado
    if (window.fbq && window.fbq.loaded) {
      console.log('Facebook Pixel já está carregado, disparando evento...');
      trackPurchase();
    } else {
      // Se o Pixel ainda não estiver carregado, tenta novamente após um atraso
      console.log('Aguardando o Facebook Pixel carregar...');
      const checkPixelLoaded = setInterval(() => {
        if (window.fbq && window.fbq.loaded) {
          clearInterval(checkPixelLoaded);
          trackPurchase();
        }
      }, 500);
      // Limpa o intervalo se o componente for desmontado
      return () => clearInterval(checkPixelLoaded);
    }
  }, [price, contentId, contentName, currency]);

  // Código do Pixel para navegadores com JavaScript desabilitado
  return (
    <noscript>
      <img
        height="1"
        width="1"
        style={{ display: 'none' }}
        src={`https://www.facebook.com/tr?id=${PIXEL_ID}&ev=Purchase&noscript=1`}
      />
    </noscript>
  );
}
