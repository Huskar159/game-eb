'use client';

import { useEffect, useState } from 'react';

declare global {
  interface Window {
    fbq: any;
    _fbq?: any;
  }
}

export function useFacebookPixel() {
  const FB_PIXEL_ID = '2292146237905291';
  const [isReady, setIsReady] = useState(false);

  // Inicializa o fbq
  useEffect(() => {
    if (typeof window === 'undefined') {
      return; // Não executa no servidor
    }

    // Cria a função fbq se não existir
    if (!window.fbq) {
      window.fbq = function() {
        (window.fbq.q = window.fbq.q || []).push(arguments);
      };
      window.fbq.q = window.fbq.q || [];
      window.fbq.loaded = false;
    }

    // Carrega o script do Facebook Pixel
    const loadFacebookPixel = () => {
      if (document.getElementById('facebook-pixel-script')) {
        return; // Já está carregado
      }

      const script = document.createElement('script');
      script.id = 'facebook-pixel-script';
      script.async = true;
      script.defer = true;
      script.src = `https://connect.facebook.net/en_US/fbevents.js`;
      
      script.onload = () => {
        try {
          window.fbq('init', FB_PIXEL_ID);
          window.fbq('track', 'PageView');
          window.fbq.loaded = true;
          setIsReady(true);
        } catch (e) {
          console.error('Erro ao inicializar o Facebook Pixel:', e);
        }
      };
      
      script.onerror = (error) => {
        console.error('Erro ao carregar o script do Facebook Pixel:', error);
      };
      
      document.head.appendChild(script);
    };
    
    loadFacebookPixel();
    
    return () => {
      // Limpeza se necessário
    };
  }, []);

  // Função para rastrear eventos
  const trackEvent = (eventName: string, eventData: Record<string, any> = {}) => {
    if (typeof window === 'undefined') {
      return false;
    }
    
    if (!window.fbq) {
      window.fbq = function() {
        (window.fbq.q = window.fbq.q || []).push(arguments);
      };
      window.fbq.q = window.fbq.q || [];
      window.fbq.loaded = false;
    }
    
    try {
      // Tenta rastrear o evento de duas formas diferentes
      window.fbq('track', eventName, eventData);
      window.fbq('trackSingle', FB_PIXEL_ID, eventName, eventData);
      return true;
    } catch (error) {
      console.error(`Erro ao rastrear evento ${eventName}:`, error);
      return false;
    }
  };

  return { trackEvent, isReady };
}
