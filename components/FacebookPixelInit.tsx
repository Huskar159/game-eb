'use client';

import Script from 'next/script';
import { useEffect } from 'react';

declare global {
  interface Window {
    fbq: any;
    _fbq?: any;  // Made optional to match the global type
  }
}

export default function FacebookPixelInit() {
  const FB_PIXEL_ID = '2292146237905291';

  useEffect(() => {
    // Check if fbq is loaded and initialize
    const initPixel = () => {
      if (typeof window.fbq === 'function') {
        try {
          // Initialize Pixel
          window.fbq('init', FB_PIXEL_ID);
          console.log('[Facebook Pixel] Initialized successfully');
          
          // Track PageView
          window.fbq('track', 'PageView');
          console.log('[Facebook Pixel] PageView fired');
          
          return true;
        } catch (error) {
          console.error('[Facebook Pixel] Initialization error:', error);
          return false;
        }
      }
      return false;
    };

    // Try to initialize immediately
    if (!initPixel()) {
      // If it fails, set up retry mechanism
      const retryInterval = setInterval(() => {
        if (initPixel()) {
          clearInterval(retryInterval);
        }
      }, 500);

      // Clear interval after 10 seconds
      setTimeout(() => clearInterval(retryInterval), 10000);
    }
  }, []);

  return (
    <>
      {/* Main Facebook Pixel Script */}
      <Script
        id="fb-pixel"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            !function(f,b,e,v,n,t,s){
              if(f.fbq)return;n=f.fbq=function(){n.callMethod?
              n.callMethod.apply(n,arguments):n.queue.push(arguments)};
              if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
              n.queue=[];t=b.createElement(e);t.async=!0;
              t.src=v;s=b.getElementsByTagName(e)[0];
              s.parentNode.insertBefore(t,s);
            }(window, document,'script',
            'https://connect.facebook.net/en_US/fbevents.js');
            fbq('init', '${FB_PIXEL_ID}');
            fbq('track', 'PageView');
            console.log('[Facebook Pixel] Script loaded and initialized');
          `,
        }}
      />
      
      {/* Fallback for browsers without JavaScript */}
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
