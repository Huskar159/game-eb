// Facebook Pixel utility
declare global {
  interface Window {
    fbq: any;
    _fbq?: any;
  }
}

export const FB_PIXEL_ID = '2292146237905291';

// Track Initiate Checkout
export const trackInitiateCheckout = (
  value: number, 
  currency: string = 'BRL',
  contentId: string = 'kit_basico',
  contentName: string = 'Kit Básico',
  additionalParams: Record<string, any> = {}
): void => {
  console.log('[Meta Ads] trackInitiateCheckout chamado com:', { 
    value, 
    currency, 
    contentId, 
    contentName,
    additionalParams 
  });
  
  if (typeof window === 'undefined') {
    console.log('[Meta Ads] window is undefined');
    return;
  }
  
  // Cria uma chave única para cada produto
  const trackingKey = `fb_checkout_${contentId}`;
  const alreadyTracked = sessionStorage.getItem(trackingKey);
  
  if (alreadyTracked) {
    console.log(`[Meta Ads] Evento já rastreado para ${contentName}`);
    return;
  }

  const trackEvent = (attempt = 1, maxAttempts = 10) => {
    try {
      console.log(`[Meta Ads] Tentativa ${attempt} de ${maxAttempts}`);
      
      // Tenta inicializar o fbq se não existir
      if (!window.fbq) {
        console.log('[Meta Ads] fbq não encontrado, inicializando...');
        window.fbq = function() {
          (window.fbq.q = window.fbq.q || []).push(arguments);
        };
        window.fbq.push = window.fbq;
        window.fbq.loaded = false;
        window.fbq.version = '2.0';
        window.fbq.queue = [];
        window._fbq = window.fbq;
      }
      
      // Prepara os parâmetros do evento
      const eventParams = {
        value: value,
        currency: currency,
        content_type: 'product',
        content_ids: [contentId],
        content_name: contentName,
        content_category: 'Estudos Bíblicos',
        eventID: `initiate_checkout_${Date.now()}`,
        eventSourceUrl: window.location.href,
        ...additionalParams
      };
      
      console.log('[Meta Ads] Disparando evento com parâmetros:', eventParams);
      
      // Tenta disparar o evento de várias formas
      try {
        // Método 1: Usando fbq padrão
        console.log('[Meta Ads] Tentando fbq(track)...');
        window.fbq('track', 'InitiateCheckout', eventParams);
        console.log('[Meta Ads] fbq(track) chamado com sucesso');
        
        // Método 2: Usando trackSingle
        console.log('[Meta Ads] Tentando fbq(trackSingle)...');
        window.fbq('trackSingle', '2292146237905291', 'InitiateCheckout', eventParams);
        console.log('[Meta Ads] fbq(trackSingle) chamado com sucesso');
        
        // Método 3: Usando callMethod se disponível
        if (window.fbq.callMethod) {
          console.log('[Meta Ads] Tentando fbq.callMethod...');
          window.fbq.callMethod.call(window.fbq, 'track', 'InitiateCheckout', eventParams);
          console.log('[Meta Ads] fbq.callMethod chamado com sucesso');
        }
        
        // Método 4: Envio direto via fetch
        try {
          console.log('[Meta Ads] Enviando pixel diretamente...');
          const baseParams: Record<string, string> = {
            id: '2292146237905291',
            ev: 'InitiateCheckout',
            dl: window.location.href,
            rl: document.referrer || '',
            if: 'false',
            ts: Date.now().toString(),
            value: value.toString(),
            currency: currency,
            content_type: 'product',
            content_ids: JSON.stringify([contentId]),
            content_name: contentName,
            content_category: 'Estudos Bíblicos',
            eventID: `initiate_checkout_direct_${Date.now()}`,
            eventSourceUrl: window.location.href
          };
          
          // Adiciona parâmetros adicionais
          Object.entries(additionalParams).forEach(([key, value]) => {
            if (value !== undefined) {
              baseParams[key] = typeof value === 'object' ? JSON.stringify(value) : String(value);
            }
          });
          
          const params = new URLSearchParams(baseParams);
          const pixelUrl = `https://www.facebook.com/tr/?${params.toString()}`;
          console.log('[Meta Ads] URL do pixel direto:', pixelUrl);
          
          fetch(pixelUrl, {
            method: 'GET',
            mode: 'no-cors',
            cache: 'no-cache',
            credentials: 'omit',
            headers: {
              'Content-Type': 'text/plain',
              'Pragma': 'no-cache'
            }
          }).then(response => {
            console.log('[Meta Ads] Resposta do pixel direto:', {
              ok: response.ok,
              status: response.status,
              statusText: response.statusText,
              type: response.type
            });
          }).catch(e => {
            console.error('[Meta Ads] Erro ao enviar pixel direto:', e);
          });
          
        } catch (e) {
          console.error('[Meta Ads] Erro no envio direto do pixel:', e);
        }
        
        // Marca como rastreado
        sessionStorage.setItem(trackingKey, 'true');
        console.log(`[Meta Ads] Evento InitiateCheckout registrado para ${contentName}`);
        
        // Log da fila de eventos
        if (window.fbq.queue) {
          console.log('[Meta Ads] Fila de eventos fbq:', window.fbq.queue);
        }
        
        return; // Sucesso, encerra a função
        
      } catch (e) {
        console.error('[Meta Ads] Erro ao disparar o evento:', e);
      }
      
      // Se chegou aqui, houve falha nas tentativas
      if (attempt < maxAttempts) {
        const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000); // Backoff exponencial
        console.log(`[Meta Ads] Tentando novamente em ${delay}ms... (${attempt + 1}/${maxAttempts})`);
        setTimeout(() => trackEvent(attempt + 1, maxAttempts), delay);
      } else {
        console.error('[Meta Ads] Número máximo de tentativas atingido sem sucesso');
      }
      
    } catch (error) {
      console.error('[Meta Ads] Erro inesperado ao rastrear InitiateCheckout:', error);
      if (attempt < maxAttempts) {
        setTimeout(() => trackEvent(attempt + 1, maxAttempts), 1000);
      }
    }
  };
  
  // Inicia o processo de rastreamento
  trackEvent();
};

// Track Purchase
export const trackPurchase = (
  value: number,
  currency: string = 'BRL',
  contentId: string = 'kit_basico',
  contentName: string = 'Kit Básico de Estudos Bíblicos',
  orderId?: string,
  additionalParams: Record<string, any> = {}
): void => {
  console.log('[Meta Ads] trackPurchase chamado com:', { 
    value, 
    currency, 
    contentId, 
    contentName,
    orderId,
    additionalParams 
  });
  
  if (typeof window === 'undefined') {
    console.log('[Meta Ads] window is undefined');
    return;
  }
  
  // Cria uma chave única para cada compra para rastrear apenas uma vez
  const trackingKey = `fb_purchase_${orderId || contentId}`;
  const alreadyTracked = sessionStorage.getItem(trackingKey);
  
  if (alreadyTracked) {
    console.log(`[Meta Ads] Compra já rastreada para ${contentName} (${orderId || contentId})`);
    return;
  }
  
  // Função para verificar se o fbq está disponível
  const isFbqLoaded = () => {
    return typeof window !== 'undefined' && window.fbq && typeof window.fbq === 'function';
  };
  
  // Função para tentar rastrear a compra
  const trackEvent = (attempt = 1, maxAttempts = 5) => {
    if (attempt > maxAttempts) {
      console.error(`[Meta Ads] Número máximo de tentativas (${maxAttempts}) atingido sem sucesso`);
      return;
    }

    if (!isFbqLoaded()) {
      console.log(`[Meta Ads] fbq não disponível, tentando novamente em ${attempt * 500}ms... (${attempt}/${maxAttempts})`);
      setTimeout(() => trackEvent(attempt + 1, maxAttempts), attempt * 500);
      return;
    }
    
    try {
      // Prepara os parâmetros do evento
      const eventParams = {
        value: value,
        currency: currency,
        content_type: 'product',
        content_ids: [contentId],
        content_name: contentName,
        content_category: 'Estudos Bíblicos',
        eventID: `purchase_${orderId || Date.now()}`,
        eventSourceUrl: window.location.href,
        order_id: orderId,
        num_items: 1,
        ...additionalParams
      };
      
      console.log('[Meta Ads] Disparando evento Purchase com parâmetros:', eventParams);
      
      // Tenta disparar o evento de várias formas
      try {
        // Método 1: Usando fbq padrão
        console.log('[Meta Ads] Tentando fbq(track) para Purchase...');
        window.fbq('track', 'Purchase', eventParams);
        console.log('[Meta Ads] fbq(track) Purchase chamado com sucesso');
        
        // Método 2: Usando trackSingle
        console.log('[Meta Ads] Tentando fbq(trackSingle) para Purchase...');
        window.fbq('trackSingle', '2292146237905291', 'Purchase', eventParams);
        console.log('[Meta Ads] fbq(trackSingle) Purchase chamado com sucesso');
        
        // Marca como rastreado
        sessionStorage.setItem(trackingKey, 'true');
        console.log(`[Meta Ads] Compra rastreada: ${contentName} - R$ ${value} (${orderId || 'sem ID'})`);
        
        // Log da fila de eventos
        if (window.fbq.queue) {
          console.log('[Meta Ads] Fila de eventos fbq:', window.fbq.queue);
        }
        
        return; // Sucesso, encerra a função
        
      } catch (e) {
        console.error('[Meta Ads] Erro ao disparar o evento Purchase:', e);
      }
      
      // Se chegou aqui, houve falha nas tentativas
      if (attempt < maxAttempts) {
        const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000); // Backoff exponencial
        console.log(`[Meta Ads] Tentando novamente em ${delay}ms... (${attempt + 1}/${maxAttempts})`);
        setTimeout(() => trackEvent(attempt + 1, maxAttempts), delay);
      } else {
        console.error('[Meta Ads] Número máximo de tentativas atingido sem sucesso');
      }
      
    } catch (error) {
      console.error('[Meta Ads] Erro inesperado ao rastrear Purchase:', error);
      if (attempt < maxAttempts) {
        const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
        setTimeout(() => trackEvent(attempt + 1, maxAttempts), delay);
      }
    }
  };
  
  // Inicia o processo de rastreamento
  trackEvent();
};
