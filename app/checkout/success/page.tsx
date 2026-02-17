'use client'
import Link from 'next/link'

export default function SuccessPage() {
  return (
    <div className="min-h-screen bg-[#1a0505] text-[#e5d5a3] font-sans flex flex-col items-center justify-center p-8 text-center relative overflow-hidden">
      
      {/* 🌟 DECORATIVE GOLD GLOW (Background Effect) 🌟 */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-[#c5a059] rounded-full blur-[150px] opacity-10 pointer-events-none"></div>

      <div className="relative z-10 max-w-lg animate-fade-in-up">
          
          {/* GOLD CHECKMARK ICON */}
          <div className="mb-8 flex justify-center">
              <div className="h-24 w-24 rounded-full border-2 border-[#c5a059] flex items-center justify-center text-[#c5a059] shadow-[0_0_30px_rgba(197,160,89,0.2)]">
                  <svg className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
              </div>
          </div>
          
          <h1 className="font-serif text-4xl md:text-5xl text-[#f4e4bc] mb-6">Acquisition Complete</h1>
          
          <p className="text-[#e5d5a3]/60 text-sm leading-relaxed mb-12">
              Your royal treasure has been secured. We are now preparing it for a safe and elegant journey to your doorstep. You can track its status in your personal vault.
          </p>

          <div className="flex flex-col gap-4 w-full max-w-xs mx-auto">
              {/* PRIMARY BUTTON: SHOP AGAIN */}
              <Link href="/" className="bg-[#c5a059] text-[#1a0505] px-8 py-4 rounded font-bold uppercase tracking-widest text-xs hover:bg-white transition-all shadow-[0_0_20px_rgba(197,160,89,0.3)] block">
                  Continue Shopping
              </Link>
              
              {/* SECONDARY LINK: VIEW ORDERS */}
              <Link href="/account" className="text-[#e5d5a3]/50 hover:text-white text-xs uppercase tracking-widest transition-colors py-4 block">
                  View My Orders
              </Link>
          </div>
      </div>
    </div>
  )
}