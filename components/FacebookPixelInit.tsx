'use client';

import Script from 'next/script';
import { useEffect } from 'react';

declare global {
  interface Window {
    fbq: any;
    _fbq?: any;
    fbAsyncInit?: () => void;
  }
}

export default function FacebookPixelInit() {
  const FB_PIXEL_ID = '2292146237905291';
  
  useEffect(() => {
    // Função para verificar se o fbq foi carregado
    const checkFbqLoaded = () => {
      return typeof window !== 'undefined' && window.fbq && typeof window.fbq === 'function';
    };

    // Tenta inicializar o Pixel se ainda não estiver carregado
    if (checkFbqLoaded()) {
      console.log('[Facebook Pixel] fbq já está disponível');
      initializePixel();
    } else {
      console.log('[Facebook Pixel] fbq ainda não está disponível, aguardando carregamento...');
      
      // Tenta novamente após um atraso
      const timer = setTimeout(() => {
        if (checkFbqLoaded()) {
          console.log('[Facebook Pixel] fbq carregado após atraso');
          initializePixel();
        } else {
          console.error('[Facebook Pixel] fbq não carregado após atraso');
        }
      }, 2000);
      
      return () => clearTimeout(timer);
    }
  }, []);
  
  const initializePixel = () => {
    try {
      // Inicializa o Pixel com o ID correto
      window.fbq('init', FB_PIXEL_ID);
      console.log('[Facebook Pixel] Inicializado com o ID:', FB_PIXEL_ID);
      
      // Dispara o PageView
      window.fbq('track', 'PageView');
      console.log('[Facebook Pixel] PageView disparado');
      
      // Marca que o Pixel foi inicializado
      window.fbq.loaded = true;
    } catch (error) {
      console.error('[Facebook Pixel] Erro ao inicializar:', error);
    }
  };
  
  return (
    <>
      <Script 
        id="fb-pixel" 
        strategy="afterInteractive"
        onLoad={() => {
          console.log('[Facebook Pixel] Script carregado');
          if (typeof window !== 'undefined' && window.fbq) {
            console.log('[Facebook Pixel] fbq disponível após carregamento do script');
            initializePixel();
          } else {
            console.error('[Facebook Pixel] fbq não disponível após carregamento do script');
          }
        }}
        onError={(e) => {
          console.error('[Facebook Pixel] Erro ao carregar o script:', e);
        }}
      >
        {`
          !function(f,b,e,v,n,t,s) {
            if(f.fbq) return;
            n=f.fbq=function() {
              n.callMethod ?
              n.callMethod.apply(n,arguments) : n.queue.push(arguments)
            };
            if(!f._fbq) f._fbq=n;
            n.push=n;
            n.loaded=!0;
            n.version='2.0';
            n.queue=[];
            t=b.createElement(e);
            t.async=!0;
            t.src=v;
            s=b.getElementsByTagName(e)[0];
            s.parentNode.insertBefore(t,s);
            
            // Adiciona evento para quando o script for carregado
            t.onload = function() {
              console.log('[Facebook Pixel] Script do Facebook carregado com sucesso');
              if (window.fbq) {
                console.log('[Facebook Pixel] fbq disponível após carregamento do script (onload)');
                window.fbq('init', '${FB_PIXEL_ID}');
                window.fbq('track', 'PageView');
              } else {
                console.error('[Facebook Pixel] fbq não disponível após carregamento do script (onload)');
              }
            };
            
            t.onerror = function(error) {
              console.error('[Facebook Pixel] Erro ao carregar o script do Facebook:', error);
            };
          }(window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js');
        `}
      </Script>
      <noscript>
        <img
          height="1"
          width="1"
          style={{ display: 'none' }}
          src={`https://www.facebook.com/tr?id=${FB_PIXEL_ID}&ev=PageView&noscript=1`}
          alt=""
        />
      </noscript>
    </>
  );
}
