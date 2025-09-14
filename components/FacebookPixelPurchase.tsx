'use client';

import { useEffect } from 'react';
import { trackPurchase } from '@/lib/facebook-pixel';

interface FacebookPixelPurchaseProps {
  price: number;
  contentId: string;
  contentName: string;
  currency?: string;
  orderId?: string;
  additionalParams?: Record<string, any>;
}

const PIXEL_ID = '2292146237905291';

export default function FacebookPixelPurchase({ 
  price, 
  contentId, 
  contentName,
  currency = 'BRL',
  orderId,
  additionalParams = {}
}: FacebookPixelPurchaseProps) {
  useEffect(() => {
    console.log('[FacebookPixelPurchase] Iniciando rastreamento de compra com:', { 
      price, 
      contentId, 
      contentName, 
      currency,
      orderId,
      additionalParams
    });
    
    // Gera um ID de pedido se não for fornecido
    const generatedOrderId = orderId || 'order_' + Date.now() + '_' + Math.floor(Math.random() * 1000) + '_' + contentId;
    
    // Parâmetros adicionais para o evento
    const eventParams = {
      source: 'checkout_premium',
      page_type: 'thank_you_page',
      product_catalog_id: 'estudos_biblicos',
      product_price: price,
      product_quantity: 1,
      ...additionalParams
    };
    
    // Dispara o evento de compra usando a função aprimorada
    trackPurchase(
      price,
      currency,
      contentId,
      contentName,
      generatedOrderId,
      eventParams
    );
    
  }, [price, contentId, contentName, currency, orderId, additionalParams]);

  // Código do Pixel para navegadores com JavaScript desabilitado
  return (
    <noscript>
      <img
        height="1"
        width="1"
        style={{ display: 'none' }}
        src={`https://www.facebook.com/tr?id=${PIXEL_ID}&ev=Purchase&noscript=1`}
        alt=""
      />
    </noscript>
  );
}
