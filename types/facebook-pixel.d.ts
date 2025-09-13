// Global type declarations for Facebook Pixel
type FbqFunction = {
  (action: 'track' | 'init' | 'consent' | 'trackSingle', eventName: string, parameters?: Record<string, any>): void;
  (action: 'trackSingle', pixelId: string, eventName: string, parameters?: Record<string, any>): void;
  (method: 'set', field: string, value: any): void;
  push: (...args: any[]) => void;
  queue: any[];
  version: string;
  loaded: boolean;
  q?: any[];
  callMethod?: any;
};

declare global {
  interface Window {
    fbq: FbqFunction;
    _fbq?: FbqFunction;
  }
}

export {};
