'use client';

import { useEffect } from 'react';

interface FacebookPixelPurchaseProps {
  price?: number;
  contentId?: string;
  contentName?: string;
  currency?: string;
}

declare global {
  interface Window {
    fbq: any;
    _fbq?: any;
  }
}

const PIXEL_ID = '2292146237905291';

export default function FacebookPixelPurchase({ 
  price = 24.90, 
  contentId = 'kit_lider_transformada', 
  contentName = 'Kit Líder Transformada',
  currency = 'BRL'
}: FacebookPixelPurchaseProps = {}) {
  useEffect(() => {
    // Função para carregar o Pixel do Facebook se não estiver carregado
    const loadFacebookPixel = () => {
      if (!document.getElementById('facebook-pixel-script')) {
        const script = document.createElement('script');
        script.id = 'facebook-pixel-script';
        script.innerHTML = `
          !function(f,b,e,v,n,t,s)
          {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
          n.callMethod.apply(n,arguments):n.queue.push(arguments)};
          if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
          n.queue=[];t=b.createElement(e);t.async=!0;
          t.src=v;s=b.getElementsByTagName(e)[0];
          s.parentNode.insertBefore(t,s)}(window, document,'script',
          'https://connect.facebook.net/en_US/fbevents.js');
          
          fbq('init', '${PIXEL_ID}');
          fbq('track', 'PageView');
        `;
        document.head.appendChild(script);
      }
      return true;
    };

    // Função para rastrear a compra
    const trackPurchase = () => {
      console.log('[Facebook Pixel] Iniciando rastreamento de compra...', { 
        contentId, 
        contentName, 
        price,
        currency
      });
      
      // Carrega o Pixel se ainda não estiver carregado
      loadFacebookPixel();
      
      // Verifica se o fbq está disponível
      if (typeof window.fbq === 'function') {
        console.log('[Facebook Pixel] fbq disponível, disparando evento de compra');
        
        // Garante que o Pixel está inicializado
        window.fbq('consent', 'grant');
        window.fbq('init', PIXEL_ID);
        
        // Dispara o evento de compra com parâmetros obrigatórios
        window.fbq('track', 'Purchase', {
          // Parâmetros principais
          value: price,
          currency: currency,
          content_ids: [contentId],
          content_name: contentName,
          content_type: 'product',
          content_category: 'Estudos Bíblicos',
          num_items: 1,
          order_id: 'order_' + Date.now() + '_' + contentId,
          // Parâmetros adicionais para melhor segmentação
          product_catalog_id: 'estudos_biblicos',
          product_price: price,
          product_quantity: 1
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
  }, [contentId, contentName, price, currency]);

  return null;
}
