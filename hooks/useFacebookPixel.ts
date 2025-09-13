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
      console.log('[useFacebookPixel] Executando no servidor, ignorando inicialização');
      return;
    }

    console.log('[useFacebookPixel] Inicializando Facebook Pixel...');
    
    // Cria a função fbq se não existir
    if (!window.fbq) {
      console.log('[useFacebookPixel] Criando função fbq...');
      const fbq = function() {
        if (!fbq.loaded) {
          console.log('[useFacebookPixel] fbq chamado antes do carregamento:', arguments);
          (fbq.q = fbq.q || []).push(arguments);
        } else {
          console.log('[useFacebookPixel] fbq chamado após carregamento:', arguments);
          try {
            // Tenta chamar o FB Pixel real se estiver disponível
            if (window.fbq && typeof window.fbq === 'function') {
              window.fbq.apply(this, arguments);
            }
          } catch (e) {
            console.error('[useFacebookPixel] Erro ao chamar fbq:', e);
          }
        }
      };
      
      // Atribui as propriedades estáticas
      fbq.loaded = false;
      fbq.version = '2.0';
      fbq.queue = [];
      
      // Atribui ao escopo global
      window.fbq = fbq;
      window._fbq = fbq;
      
      console.log('[useFacebookPixel] Função fbq criada');
    } else {
      console.log('[useFacebookPixel] Função fbq já existe');
    }

    // Carrega o script do Facebook Pixel
    const loadFacebookPixel = () => {
      // Verifica se o script já foi carregado
      if (document.getElementById('facebook-pixel-script')) {
        console.log('[useFacebookPixel] Script do Facebook Pixel já carregado');
        return;
      }

      // Cria o script do Facebook Pixel
      const script = document.createElement('script');
      script.id = 'facebook-pixel-script';
      script.async = true;
      script.defer = true;
      script.src = `https://connect.facebook.net/en_US/fbevents.js`;
      
      script.onload = () => {
        console.log('[useFacebookPixel] Script do Facebook Pixel carregado com sucesso');
        
        // Inicializa o pixel
        try {
          window.fbq('init', '${FB_PIXEL_ID}');
          window.fbq('track', 'PageView');
          window.fbq.loaded = true;
          setIsReady(true);
          console.log('[useFacebookPixel] Facebook Pixel inicializado com sucesso');
        } catch (e) {
          console.error('[useFacebookPixel] Erro ao inicializar o Facebook Pixel:', e);
        }
      };
      
      script.onerror = (error) => {
        console.error('[useFacebookPixel] Erro ao carregar o script do Facebook Pixel:', error);
      };
      
      // Adiciona o script ao documento
      document.head.appendChild(script);
    };
    
    // Inicia o carregamento do pixel
    loadFacebookPixel();
    
    return () => {
      console.log('[useFacebookPixel] Limpando recursos');
      // Limpeza se necessário
    };
  }, []);

  // Função para rastrear eventos
  const trackEvent = (eventName: string, eventData: Record<string, any> = {}) => {
    console.log(`[Facebook Pixel] Iniciando rastreamento do evento: ${eventName}`, eventData);
    
    if (typeof window === 'undefined') {
      console.warn('[Facebook Pixel] window não está disponível (executando no servidor)');
      return false;
    }
    
    // Se o fbq não estiver disponível, apenas registra o evento para ser processado depois
    if (!window.fbq) {
      console.warn('[Facebook Pixel] fbq não está disponível, enfileirando evento:', eventName);
      (window.fbq = window.fbq || function() {
        (window.fbq.q = window.fbq.q || []).push(arguments);
      }).loaded = false;
      
      // Se não houver fila, cria uma
      if (!window.fbq.q) {
        window.fbq.q = [];
      }
      
      // Adiciona o evento à fila
      window.fbq('track', eventName, eventData);
      return false;
    }
    
    // Se o fbq não estiver carregado, enfileira o evento
    if (!window.fbq.loaded) {
      console.warn('[Facebook Pixel] fbq ainda não foi carregado, enfileirando evento:', eventName);
      window.fbq('track', eventName, eventData);
      return false;
    }
    
    // Se chegou aqui, o fbq está pronto para uso
    if (!window.fbq.loaded) {
      console.warn('[Facebook Pixel] fbq ainda não está carregado, adicionando à fila');
      
      // Adiciona à fila para ser processado quando o fbq estiver pronto
      if (window.fbq.q) {
        window.fbq.q.push(['track', eventName, eventData]);
        window.fbq.q.push(['trackSingle', FB_PIXEL_ID, eventName, eventData]);
        console.log('[Facebook Pixel] Evento adicionado à fila:', eventName);
      }
      
      return false;
    }

    try {
      console.log(`[Facebook Pixel] Disparando evento: ${eventName}`, eventData);
      
      // Verifica se fbq é uma função antes de chamar
      if (typeof window.fbq !== 'function') {
        console.error('[Facebook Pixel] window.fbq não é uma função:', typeof window.fbq);
        return false;
      }
      
      console.log('[Facebook Pixel] fbq disponível, disparando eventos...');
      
      // Tenta disparar o evento de várias formas
      const results = [];
      
      // Método 1: fbq('track', ...)
      try {
        console.log(`[Facebook Pixel] (1/4) Chamando fbq('track', '${eventName}')`);
        window.fbq('track', eventName, eventData);
        console.log(`[Facebook Pixel] (1/4) fbq('track') chamado com sucesso`);
        results.push('track');
      } catch (e) {
        console.error(`[Facebook Pixel] (1/4) Erro ao chamar fbq('track'):`, e);
      }
      
      // Aguarda um pouco entre as chamadas
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Método 2: fbq('trackSingle', ...)
      try {
        console.log(`[Facebook Pixel] (2/4) Chamando fbq('trackSingle', '${FB_PIXEL_ID}', '${eventName}')`);
        window.fbq('trackSingle', FB_PIXEL_ID, eventName, eventData);
        console.log(`[Facebook Pixel] (2/4) fbq('trackSingle') chamado com sucesso`);
        results.push('trackSingle');
      } catch (e) {
        console.error(`[Facebook Pixel] (2/4) Erro ao chamar fbq('trackSingle'):`, e);
      }
      
      // Aguarda um pouco entre as chamadas
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Método 3: fbq('trackCustom', ...) - Algumas implementações podem usar isso
      try {
        console.log(`[Facebook Pixel] (3/4) Tentando fbq('trackCustom', '${eventName}')`);
        window.fbq('trackCustom', eventName, eventData);
        console.log(`[Facebook Pixel] (3/4) fbq('trackCustom') chamado com sucesso`);
        results.push('trackCustom');
      } catch (e) {
        console.log(`[Facebook Pixel] (3/4) fbq('trackCustom') não disponível ou falhou`);
      }
      
      // Aguarda um pouco entre as chamadas
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Método 4: Envio direto via fetch
      try {
        console.log(`[Facebook Pixel] (4/4) Enviando pixel diretamente...`);
        
        // Adiciona informações adicionais para o rastreamento
        const enhancedData = {
          ...eventData,
          eventID: `${eventName}_${Date.now()}`,
          eventTime: Math.floor(Date.now() / 1000),
          eventSourceUrl: window.location.href,
          actionSource: 'website'
        };
        
        const params = new URLSearchParams({
          id: FB_PIXEL_ID,
          ev: eventName,
          dl: window.location.href,
          rl: document.referrer || '',
          if: 'false',
          ts: Date.now().toString(),
          ...Object.fromEntries(
            Object.entries(enhancedData).map(([key, value]) => [
              key,
              typeof value === 'object' ? JSON.stringify(value) : String(value)
            ])
          )
        });
        
        const pixelUrl = `https://www.facebook.com/tr/?${params.toString()}`;
        console.log('[Facebook Pixel] (4/4) URL do pixel:', pixelUrl);
        
        const response = await fetch(pixelUrl, {
          method: 'GET',
          mode: 'no-cors',
          cache: 'no-cache',
          credentials: 'omit',
          headers: {
            'Content-Type': 'text/plain',
            'Pragma': 'no-cache'
          }
        });
        
        console.log(`[Facebook Pixel] (4/4) Resposta do pixel:`, {
          ok: response.ok,
          status: response.status,
          statusText: response.statusText,
          type: response.type
        });
        
        results.push('direct_fetch');
      } catch (e) {
        console.error('[Facebook Pixel] (4/4) Erro ao enviar pixel diretamente:', e);
      }
      
      // Verifica se alguma das chamadas foi bem-sucedida
      const success = results.length > 0;
      console.log(`[Facebook Pixel] Evento ${eventName} ${success ? 'rastreado com sucesso' : 'falhou'}, métodos:`, results);
      
      // Verifica a fila do fbq para garantir que os eventos foram adicionados
      if (window.fbq.queue) {
        console.log(`[Facebook Pixel] Tamanho da fila do fbq:`, window.fbq.queue.length);
        console.log(`[Facebook Pixel] Últimos itens da fila:`, 
          window.fbq.queue.slice(-5).map((item: any) => ({
            method: item[0],
            eventName: item[1],
            eventData: item[2] || {}
          }))
        );
      }
      
      return success;
    } catch (error) {
      console.error('[Facebook Pixel] Erro ao rastrear evento:', error);
      return false;
    }
  };

  return { isReady, trackEvent };
}
