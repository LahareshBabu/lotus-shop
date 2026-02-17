'use client'
import Link from 'next/link'

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-[#1a0505] text-[#e5d5a3] font-serif p-8 lg:p-20">
      {/* Back Button */}
      <Link href="/" className="text-sm border-b border-[#e5d5a3]/30 pb-1 hover:text-white">← Back to Home</Link>
      
      <div className="max-w-3xl mx-auto mt-12 text-center">
        
        {/* ✏️ EDIT HEADLINE HERE */}
        <h1 className="text-5xl font-medium mb-8 text-[#f4e4bc]">The Lotus Story</h1>
        
        {/* Gold Divider Line */}
        <div className="h-px w-24 bg-[#c5a059] mx-auto mb-12"></div>
        
        <div className="space-y-8 text-lg leading-relaxed text-[#e5d5a3]/80 font-sans">
          
          {/* ✏️ EDIT PARAGRAPH 1 HERE */}
          <p>
            Welcome to <span className="text-[#f4e4bc] font-bold">LOTUS</span>, where tradition meets affordable luxury. 
            Founded with a singular vision: to make the grandeur of royal Indian jewelry accessible to the modern woman.
          </p>

          {/* ✏️ EDIT PARAGRAPH 2 HERE */}
          <p>
            We believe that looking expensive shouldn't cost a fortune. Our artisans meticulously craft each piece using 
            premium copper alloys and high-grade stones, plated with 24K gold technology to ensure that "Real Gold Look" 
            you desire.
          </p>

          {/* ✏️ EDIT PARAGRAPH 3 HERE */}
          <p>
            From the intricate temple designs of the South to the Polki grandeur of the North, LOTUS brings you 
            India's heritage, handcrafted for your special moments.
          </p>
        </div>

        {/* ✏️ EDIT YOUR 3 CORE VALUES HERE */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 border-t border-[#e5d5a3]/20 pt-12">
            <div>
                <h3 className="text-2xl text-[#f4e4bc] mb-2">Premium Quality</h3>
                <p className="text-sm opacity-60">High-grade imitation that lasts.</p>
            </div>
            <div>
                <h3 className="text-2xl text-[#f4e4bc] mb-2">Handcrafted</h3>
                <p className="text-sm opacity-60">Made by skilled Indian artisans.</p>
            </div>
            <div>
                <h3 className="text-2xl text-[#f4e4bc] mb-2">Affordable</h3>
                <p className="text-sm opacity-60">Luxury within your reach.</p>
            </div>
        </div>

      </div>
    </div>
  )
}