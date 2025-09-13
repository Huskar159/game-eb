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
    // Cria o script do Pixel se não existir
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

    // Função para disparar o evento de compra
    const trackPurchase = () => {
      if (typeof window.fbq === 'function') {
        window.fbq('track', 'Purchase', {
          value: price,
          currency: currency,
          content_ids: [contentId],
          content_name: contentName,
          content_type: 'product',
          content_category: 'Estudos Bíblicos',
          num_items: 1,
          order_id: 'order_' + Date.now() + '_' + contentId,
          product_catalog_id: 'estudos_biblicos',
          product_price: price,
          product_quantity: 1
        });
        return true;
      }
      return false;
    };

    // Tenta disparar o evento imediatamente
    if (!trackPurchase()) {
      // Se falhar, tenta novamente após 1 segundo
      const timer = setTimeout(trackPurchase, 1000);
      return () => clearTimeout(timer);
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
