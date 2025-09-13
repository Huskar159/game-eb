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
    
    // Cria o script do Pixel se não existir
    if (!document.getElementById('facebook-pixel-script')) {
      console.log('Criando script do Facebook Pixel');
      const script = document.createElement('script');
      script.id = 'facebook-pixel-script';
      script.innerHTML = `
        console.log('Inicializando Facebook Pixel...');
        !function(f,b,e,v,n,t,s)
        {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
        n.callMethod.apply(n,arguments):n.queue.push(arguments)};
        if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
        n.queue=[];t=b.createElement(e);t.async=!0;
        t.src=v;s=b.getElementsByTagName(e)[0];
        s.parentNode.insertBefore(t,s);
        
        // Adiciona um listener para quando o script carregar
        t.onload = function() {
          console.log('Facebook Pixel carregado com sucesso!');
          try {
            fbq('init', '${PIXEL_ID}');
            fbq('track', 'PageView');
            console.log('PageView disparado com sucesso');
            
            // Tenta disparar o evento de compra imediatamente
            if (window.fbq) {
              console.log('Tentando disparar evento Purchase...');
              fbq('track', 'Purchase', {
                value: ${price},
                currency: '${currency}',
                content_ids: ['${contentId}'],
                content_name: '${contentName.replace(/'/g, "\\'")}',
                content_type: 'product',
                content_category: 'Estudos Bíblicos',
                num_items: 1,
                order_id: 'order_' + Date.now() + '_${contentId}',
                product_catalog_id: 'estudos_biblicos',
                product_price: ${price},
                product_quantity: 1
              });
              console.log('Evento Purchase disparado com sucesso no carregamento do script');
            }
          } catch (error) {
            console.error('Erro ao inicializar o Pixel:', error);
          }
        };
        
        // Em caso de erro no carregamento
        t.onerror = function(error) {
          console.error('Erro ao carregar o Facebook Pixel:', error);
        };
        
        }(window, document,'script',
        'https://connect.facebook.net/en_US/fbevents.js');
      `;
      document.head.appendChild(script);
    } else {
      console.log('Script do Facebook Pixel já existe');
    }

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
          console.log('Evento Purchase disparado com sucesso!');
          return true;
        } catch (error) {
          console.error('Erro ao disparar evento Purchase:', error);
          return false;
        }
      } else {
        console.log('fbq ainda não está disponível');
        return false;
      }
    };

    // Tenta disparar o evento imediatamente
    if (!trackPurchase()) {
      console.log('Primeira tentativa falhou, agendando nova tentativa em 1 segundo...');
      // Se falhar, tenta novamente após 1 segundo
      const timer1 = setTimeout(() => {
        console.log('Segunda tentativa de disparar evento Purchase...');
        if (!trackPurchase()) {
          // Se ainda falhar, tenta mais uma vez após 2 segundos
          const timer2 = setTimeout(() => {
            console.log('Terceira tentativa de disparar evento Purchase...');
            trackPurchase();
          }, 2000);
          return () => clearTimeout(timer2);
        }
      }, 1000);
      
      return () => clearTimeout(timer1);
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
