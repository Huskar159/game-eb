"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { CheckCircle, Download } from "lucide-react"
import { Button } from "@/components/ui/button"
import FacebookPixelPurchase from "@/components/FacebookPixelPurchase"

export default function PagamentoAprovadoPremium() {
  const router = useRouter()

  // Componente FacebookPixelPurchase agora cuida do rastreamento

  return (
    <div className="min-h-screen gradient-feminine">
      {/* Meta Pixel Code */}
      <noscript>
        <img
          height="1"
          width="1"
          style={{ display: 'none' }}
          src={`https://www.facebook.com/tr?id=2292146237905291&ev=PageView&noscript=1`}
        />
      </noscript>
      {/* End Meta Pixel Code */}
      
      <FacebookPixelPurchase 
        price={24.90}
        contentId="kit_lider_transformada"
        contentName="Kit Líder Transformada"
        currency="BRL"
      />
      <div className="flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-2xl p-8 max-w-2xl w-full mx-4 text-center">
          <div className="flex justify-center mb-6">
            <div className="bg-green-100 p-3 rounded-full">
              <CheckCircle className="w-12 h-12 text-green-600" />
            </div>
          </div>
        
        <h1 className="text-3xl font-bold text-gray-800 mb-4">Pagamento Aprovado!</h1>
        
        <p className="text-gray-600 mb-8">
          Obrigado por adquirir o Kit Líder Transformada! Seu pagamento foi aprovado e seu acesso foi liberado.
        </p>
        
        <div className="space-y-4">
          <a 
            href="https://drive.google.com/drive/folders/1e1KGaKDgcC2UMtZTH-KA6kXbCjADHksQ?usp=sharing" 
            target="_blank" 
            rel="noopener noreferrer"
            className="w-full"
          >
            <Button 
              className="w-full bg-green-600 hover:bg-green-700 text-white py-3 flex items-center justify-center gap-2"
            >
              <Download className="w-5 h-5" />
              Baixar Material Agora
            </Button>
          </a>
          
          <a 
            href="https://estudo-biblico-mulheres.lovable.app/" 
            target="_blank" 
            rel="noopener noreferrer"
            className="w-full block mt-4"
          >
            <Button 
              className="w-full bg-pink-600 hover:bg-pink-700 text-white py-3 flex items-center justify-center gap-2"
            >
              Acessar Site com 90 Estudos Bíblicos
            </Button>
          </a>
        </div>
        </div>
      </div>
    </div>
  )
}
