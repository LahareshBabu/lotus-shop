// app/contact/page.tsx
'use client'
import Link from 'next/link'

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-[#1a0505] text-[#e5d5a3] font-serif p-8 flex flex-col items-center justify-center">
      
      {/* Navigation */}
      <Link href="/" className="absolute top-8 left-8 text-sm hover:text-white border-b border-[#e5d5a3]/30 pb-1 transition-all">
        ← Back to Home
      </Link>

      <div className="text-center mb-12">
        <span className="text-xs font-sans font-bold tracking-[0.3em] text-[#e5d5a3]/50 uppercase">We are here to help</span>
        <h1 className="text-5xl mt-4 text-[#f4e4bc]">Get in Touch</h1>
        <div className="h-px w-16 bg-[#c5a059] mx-auto mt-6"></div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-4xl">
        
        {/* Contact Card 1: Phone */}
        <div className="bg-[#2a0808] border border-[#e5d5a3]/20 p-10 text-center hover:border-[#e5d5a3]/50 transition-all group">
            <div className="text-2xl mb-4 opacity-50 group-hover:opacity-100">📞</div>
            <h3 className="text-xl mb-2 text-[#f4e4bc]">Customer Care</h3>
            <p className="font-sans text-sm text-[#e5d5a3]/60 mb-6">Mon - Sat, 10am - 7pm</p>
            <p className="text-2xl font-bold tracking-wide text-white">+91 98765 43210</p>
        </div>

        {/* Contact Card 2: Email */}
        <div className="bg-[#2a0808] border border-[#e5d5a3]/20 p-10 text-center hover:border-[#e5d5a3]/50 transition-all group">
            <div className="text-2xl mb-4 opacity-50 group-hover:opacity-100">✉️</div>
            <h3 className="text-xl mb-2 text-[#f4e4bc]">Email Support</h3>
            <p className="font-sans text-sm text-[#e5d5a3]/60 mb-6">We reply within 24 hours</p>
            <p className="text-xl font-bold tracking-wide text-white">support@lotusjewels.in</p>
        </div>

      </div>

      {/* Address Section */}
      <div className="mt-16 text-center opacity-60 font-sans text-sm">
        <p>Registered Office:</p>
        <p className="mt-2">123, Royal Heritage Lane, T. Nagar</p>
        <p>Chennai, Tamil Nadu - 600017</p>
      </div>

    </div>
  )
}