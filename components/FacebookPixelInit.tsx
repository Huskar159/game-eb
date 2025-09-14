'use client';

import Script from 'next/script';
import { useEffect, useRef } from 'react';

declare global {
  interface Window {
    fbq: any;
    _fbq?: any;
  }
}

export default function FacebookPixelInit() {
  const FB_PIXEL_ID = '2292146237905291';
  const checkIntervalRef = useRef<NodeJS.Timeout>();
  
  // Inicializa a função fbq
  useEffect(() => {
    if (typeof window === 'undefined') {
      console.log('[Facebook Pixel] Executando no servidor, ignorando inicialização');
      return;
    }
    
    console.log('[Facebook Pixel] Inicializando Facebook Pixel...');
    
    // Cria a função fbq se não existir
    if (!window.fbq) {
      console.log('[Facebook Pixel] Criando função fbq...');
      window.fbq = function() {
        console.log('[Facebook Pixel] fbq chamado com:', arguments);
        (window.fbq.q = window.fbq.q || []).push(arguments);
      };
      window.fbq.push = window.fbq;
      window.fbq.loaded = false; // Inicialmente não está carregado
      window.fbq.version = '2.0';
      window.fbq.queue = [];
      window._fbq = window.fbq;
      
      console.log('[Facebook Pixel] Função fbq criada:', window.fbq);
    } else {
      console.log('[Facebook Pixel] Função fbq já existe:', window.fbq);
    }
    
    // Função para verificar se o fbq está pronto
    const checkFbq = () => {
      console.log('[Facebook Pixel] Verificando se fbq está pronto...', {
        fbq: typeof window.fbq,
        fbqLoaded: window.fbq?.loaded,
        fbqQueue: window.fbq?.queue
      });
      
      if (window.fbq && window.fbq.loaded) {
        console.log('[Facebook Pixel] fbq está pronto!');
        
        // Dispara um evento de teste para verificar se está funcionando
        try {
          console.log('[Facebook Pixel] Disparando evento de teste...');
          window.fbq('track', 'PageView');
          console.log('[Facebook Pixel] Evento de teste disparado');
        } catch (e) {
          console.error('[Facebook Pixel] Erro ao disparar evento de teste:', e);
        }
        
        return true;
      }
      return false;
    };
    
    // Verifica imediatamente
    if (checkFbq()) {
      return;
    }
    
    // Se não estiver pronto, configura um intervalo para verificar
    checkIntervalRef.current = setInterval(() => {
      if (checkFbq() && checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current);
      }
    }, 500);
    
    // Limpa o intervalo quando o componente for desmontado
    return () => {
      console.log('[Facebook Pixel] Limpando verificação de fbq');
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current);
      }
    };
  }, []);
  
  return (
    <>
      {/* Preconnect para melhor desempenho */}
      <link 
        rel="preconnect" 
        href="https://connect.facebook.net" 
        crossOrigin="anonymous"
      />
      <link 
        rel="preconnect" 
        href="https://www.facebook.com" 
        crossOrigin="anonymous"
      />
      
      {/* Script principal do Facebook Pixel */}
      <Script
        id="fb-pixel-script"
        strategy="afterInteractive"
        onLoad={() => {
          console.log('[Facebook Pixel] Script carregado com sucesso');
          if (window.fbq) {
            console.log('[Facebook Pixel] fbq disponível após carregamento do script');
            window.fbq.loaded = true;
            
            // Força a inicialização se ainda não estiver inicializado
            try {
              window.fbq('init', '${FB_PIXEL_ID}');
              console.log('[Facebook Pixel] fbq(init) chamado no onLoad');
              window.fbq('track', 'PageView');
              console.log('[Facebook Pixel] PageView disparado no onLoad');
            } catch (e) {
              console.error('[Facebook Pixel] Erro no onLoad:', e);
            }
          }
        }}
        onError={(e) => {
          console.error('[Facebook Pixel] Erro ao carregar o script:', e);
        }}
        dangerouslySetInnerHTML={{
          __html: `
            console.log('[Facebook Pixel] Iniciando carregamento do script...');
            
            // Verifica se o fbq já foi carregado
            if (typeof fbq !== 'undefined' && fbq.loaded) {
              console.log('[Facebook Pixel] fbq já está carregado');
              return;
            }
            
            // Inicializa o objeto fbq
            !function(f,b,e,v,n,t,s) {
              if(f.fbq) {
                console.log('[Facebook Pixel] fbq já existe, retornando...');
                return;
              }
              
              n=f.fbq=function(){n.callMethod?
              n.callMethod.apply(n,arguments):n.queue.push(arguments)};
              if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
              n.queue=[];t=b.createElement(e);t.async=!0;
              t.src=v;s=b.getElementsByTagName(e)[0];
              s.parentNode.insertBefore(t,s);
              
              console.log('[Facebook Pixel] Script injetado, inicializando...');
              
              // Configura o objeto global
              window.fbq = n;
              
              // Inicializa o Pixel
              try {
                n('init', '${FB_PIXEL_ID}');
                console.log('[Facebook Pixel] fbq(init) chamado no script principal');
                
                // Dispara o PageView
                n('track', 'PageView');
                console.log('[Facebook Pixel] PageView disparado no script principal');
                
                // Marca como carregado
                n.loaded = true;
                console.log('[Facebook Pixel] fbq.loaded definido como true no script principal');
                
                // Dispara um evento personalizado para notificar que o Pixel está pronto
                document.dispatchEvent(new Event('fbevents.loaded'));
                
              } catch (e) {
                console.error('[Facebook Pixel] Erro no script principal:', e);
              }
            }(window, document, 'script', 'https://connect.facebook.net/pt_BR/fbevents.js');
            
            // Verificação adicional
            if (typeof fbq !== 'undefined') {
              console.log('[Facebook Pixel] fbq disponível após carregamento');
            } else {
              console.warn('[Facebook Pixel] fbq NÃO está disponível após carregamento!');
            }
          `
        }}
      />
      
      {/* Script alternativo para garantir o carregamento */}
      <Script
        id="fb-pixel-alternative"
        strategy="afterInteractive"
        src="https://connect.facebook.net/en_US/fbevents.js"
        onLoad={() => {
          console.log('[Facebook Pixel] Script alternativo carregado');
          
          // Verifica se o fbq foi carregado corretamente
          if (typeof window.fbq === 'function') {
            console.log('[Facebook Pixel] fbq disponível no script alternativo');
            
            // Tenta inicializar novamente se ainda não estiver inicializado
            try {
              if (!window.fbq.loaded) {
                window.fbq('init', '${FB_PIXEL_ID}');
                window.fbq('track', 'PageView');
                window.fbq.loaded = true;
                console.log('[Facebook Pixel] Pixel inicializado pelo script alternativo');
              }
            } catch (e) {
              console.error('[Facebook Pixel] Erro ao inicializar pelo script alternativo:', e);
            }
          } else {
            console.error('[Facebook Pixel] fbq não está disponível no script alternativo');
          }
        }}
        onError={(e) => {
          console.error('[Facebook Pixel] Erro ao carregar o script alternativo:', e);
        }}
      />
      
      {/* Imagem de fallback para navegadores sem JavaScript */}
      <noscript>
        <img
          height="1"
          width="1"
          style={{ display: 'none' }}
          src={"https://www.facebook.com/tr?id=${FB_PIXEL_ID}&ev=PageView&noscript=1"}
          alt=""
        />
      </noscript>
      
      {/* Script para forçar o carregamento do Pixel */}
      <Script
        id="fb-pixel-force-load"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            // Verifica se o fbq foi carregado corretamente
            function checkFbqLoaded(attempt = 0, maxAttempts = 10) {
              console.log('[Facebook Pixel] Verificando fbq (tentativa ' + (attempt + 1) + ')...');
              
              if (typeof fbq === 'function') {
                console.log('[Facebook Pixel] fbq encontrado, inicializando...');
                
                try {
                  // Inicializa o Pixel
                  fbq('init', '${FB_PIXEL_ID}');
                  console.log('[Facebook Pixel] fbq(init) forçado');
                  
                  // Dispara o PageView
                  fbq('track', 'PageView');
                  console.log('[Facebook Pixel] PageView forçado');
                  
                  // Marca como carregado
                  if (window.fbq) {
                    window.fbq.loaded = true;
                    console.log('[Facebook Pixel] fbq.loaded definido como true (forçado)');
                  }
                  
                  return true;
                } catch (e) {
                  console.error('[Facebook Pixel] Erro ao forçar inicialização:', e);
                }
              } else if (attempt < maxAttempts) {
                // Tenta novamente após um atraso
                setTimeout(() => checkFbqLoaded(attempt + 1, maxAttempts), 1000);
              } else {
                console.error('[Facebook Pixel] Não foi possível carregar o fbq após ' + maxAttempts + ' tentativas');
              }
              
              return false;
            }
            
            // Inicia a verificação
            checkFbqLoaded();
          `
        }}
      />
    </>
  );
}
