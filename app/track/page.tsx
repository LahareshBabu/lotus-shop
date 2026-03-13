'use client'
import { useState, useEffect, Suspense } from 'react'
import { createClient } from '@supabase/supabase-js'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'

// CONFIGURATION
import { supabase } from '@/app/supabase'

// ICONS
function BoxIcon({ className="h-10 w-10" }) { return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg> }

function TrackContent() {
  const router = useRouter() 
  const searchParams = useSearchParams()
  const urlOrderId = searchParams.get('id')
  
  const [loading, setLoading] = useState(!!urlOrderId)
  const [orderId, setOrderId] = useState(urlOrderId || '')
  const [error, setError] = useState('')
  
  const [trackedData, setTrackedData] = useState<{ id: string, name: string, status: string } | null>(null)
  const [progressWidth, setProgressWidth] = useState(0)

  useEffect(() => {
    if (urlOrderId) {
      handleTrack(urlOrderId)
    } else {
      setLoading(false)
    }
  }, [urlOrderId])

  const handleTrack = async (idToSearch: string) => {
    setLoading(true)
    setError('')
    setProgressWidth(0) 
    
    let dbOrderId = idToSearch.trim().toUpperCase()
    let itemIndex = -1

    // 🌟 FORTRESS LOGIC: Decode the TRK number to find the Order ID and Item Index 🌟
    if (dbOrderId.startsWith('TRK') && dbOrderId.length > 5) {
        // Example: TRK177331706189300
        const base = dbOrderId.slice(3, -2) // Extract the middle timestamp
        const idxHex = dbOrderId.slice(-2)  // Extract the last 2 hex chars
        
        dbOrderId = `ORD-${base}`
        itemIndex = parseInt(idxHex, 16)
        
    } else if (dbOrderId.startsWith('ORD')) {
        setError('Please enter a specific Item Tracking ID (starts with TRK), not a general Order ID.')
        setTrackedData(null)
        setLoading(false)
        return
    } else {
        setError('Invalid Tracking ID. It should start with TRK.')
        setTrackedData(null)
        setLoading(false)
        return
    }

    // Now query Supabase with the properly reconstructed ORD- string
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('id', dbOrderId)
      .single()

    if (error || !data) {
      setError('Item not found. Please verify the Tracking ID.')
      setTrackedData(null)
    } else {
      
      const products = Array.isArray(data.items?.products) ? data.items.products : (Array.isArray(data.items) ? data.items : []);
      
      if (isNaN(itemIndex) || itemIndex < 0 || itemIndex >= products.length) {
          setError('Item not found in this shipment. Please verify the Tracking ID.')
          setTrackedData(null)
          setLoading(false)
          return
      }

      // Fetch the strict item status
      const item = products[itemIndex];
      let statusToDisplay = item.status || data.status || 'Order Placed';
      if (statusToDisplay === 'Processing') statusToDisplay = 'Order Placed';

      setTrackedData({
          id: idToSearch.trim(), 
          name: item.name,
          status: statusToDisplay
      })
    }
    setLoading(false)
  }

  const getStepIndex = (status: string) => {
      if (!status) return 0
      const s = status.toLowerCase()
      if (s.includes('delivered')) return 3
      if (s.includes('out')) return 2
      if (s.includes('shipped')) return 1
      if (s.includes('placed') || s.includes('processing')) return 0
      return 0
  }

  const currentStep = trackedData ? getStepIndex(trackedData.status) : 0
  const steps = ['ORDER PLACED', 'SHIPPED', 'OUT FOR DELIVERY', 'DELIVERED']

  useEffect(() => {
    if (trackedData) {
      const timer = setTimeout(() => {
        setProgressWidth((currentStep / 3) * 100)
      }, 100)
      return () => clearTimeout(timer)
    }
  }, [trackedData, currentStep])

  // 🌟 SMART RESET FUNCTION 🌟
  const handleReset = () => {
      setTrackedData(null)
      setOrderId('')
      setError('')
      router.push('/track') // Clears the query parameters from the URL
  }

  return (
    <div className="min-h-screen bg-[#1a0505] text-[#e5d5a3] font-sans flex items-center justify-center p-6">
      
      <div className="w-full max-w-lg bg-[#2a0808] border border-[#e5d5a3]/10 p-8 rounded shadow-2xl relative text-center">
        
        {/* 🌟 SMART BACK BUTTON 🌟 */}
        <button 
            onClick={() => trackedData ? handleReset() : router.back()} 
            className="absolute top-6 left-6 text-[10px] uppercase tracking-widest text-[#e5d5a3]/50 hover:text-white flex items-center gap-1 transition-colors"
        >
            <span>←</span> BACK
        </button>

        <div className="flex justify-center mb-6 pt-4">
            <div className="text-[#c5a059]"><BoxIcon /></div>
        </div>

        <h1 className="font-serif text-3xl text-[#f4e4bc] mb-2">Track Your Item</h1>
        
        {loading && (
            <div className="py-12 animate-pulse">
                <p className="text-[#c5a059] text-xs uppercase tracking-widest">Locating Royal Shipment...</p>
            </div>
        )}

        {!loading && !trackedData && (
            <div className="animate-fade-in">
                <p className="text-[#e5d5a3]/50 text-xs mb-8">Enter your Tracking ID to locate your specific royal treasure.</p>
                <div className="mb-4 text-left">
                    <label className="text-[10px] uppercase tracking-widest text-[#e5d5a3]/30 mb-2 block font-bold">TRACKING ID</label>
                    <div className="flex flex-col gap-4">
                        <input 
                            type="text" 
                            value={orderId}
                            onChange={(e) => setOrderId(e.target.value)}
                            placeholder="e.g. TRK177331706189300"
                            className="w-full bg-[#1a0505] border border-[#e5d5a3]/20 p-3 rounded text-[#c5a059] text-center font-mono text-sm outline-none focus:border-[#c5a059]"
                        />
                        {error && <p className="text-red-500 text-xs text-center bg-red-500/10 p-2 rounded border border-red-500/20">{error}</p>}
                        <button onClick={() => handleTrack(orderId)} className="w-full bg-[#c5a059] text-[#1a0505] py-3 font-bold uppercase tracking-widest hover:bg-[#e5d5a3] rounded transition-all shadow-lg text-xs">
                            TRACK STATUS
                        </button>
                    </div>
                </div>
            </div>
        )}

        {!loading && trackedData && (
            <div className="animate-fade-in-up mt-8">
                <div className="mb-10 border-b border-[#e5d5a3]/10 pb-4">
                    <p className="text-[10px] uppercase tracking-widest text-[#e5d5a3]/30 mb-1">Tracking ID</p>
                    <p className="text-[#c5a059] font-mono text-sm tracking-wide mb-2">{trackedData.id}</p>
                    
                    <p className="text-[#e5d5a3]/70 text-xs font-serif italic bg-[#1a0505] inline-block px-4 py-1.5 rounded-full border border-[#e5d5a3]/10">{trackedData.name}</p>
                </div>

                <div className="relative mb-12 mx-4">
                    <div className="absolute left-0 right-0 top-1/2 h-1 bg-[#1a0505] -z-0 rounded-full transform -translate-y-1/2"></div>
                    
                    <div 
                        className="absolute left-0 top-1/2 h-1 bg-[#10b981] -z-0 transition-all duration-[1500ms] ease-out shadow-[0_0_10px_#10b981] rounded-full transform -translate-y-1/2" 
                        style={{ width: `${progressWidth}%` }}
                    ></div>

                    <div className="flex justify-between relative z-10 w-full">
                        {steps.map((step, idx) => (
                            <div key={idx} className="flex flex-col items-center group relative w-0">
                                <div 
                                    className={`h-4 w-4 rounded-full border-2 transition-all duration-500 transform 
                                    ${idx <= currentStep ? 'bg-[#10b981] border-[#10b981] shadow-[0_0_15px_#10b981] scale-110' : 'bg-[#1a0505] border-[#e5d5a3]/20'}
                                    ${idx <= currentStep ? 'delay-[600ms]' : ''} 
                                `}></div>
                                
                                <span className={`absolute top-6 w-32 text-[7px] md:text-[8px] uppercase tracking-wider font-bold text-center -ml-16 left-1/2 leading-tight transition-colors duration-500 delay-[600ms] ${idx <= currentStep ? 'text-[#10b981]' : 'text-[#e5d5a3]/30'}`}>
                                    {step}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="bg-[#1a0505] p-6 rounded border border-[#e5d5a3]/10 text-center mt-8 animate-fade-in delay-1000">
                    <p className="text-[#e5d5a3]/40 text-[10px] uppercase tracking-widest mb-2">CURRENT STATUS</p>
                    <h3 className="text-2xl font-serif text-[#10b981] mb-2">{trackedData.status}</h3>
                    <p className="text-[#e5d5a3]/60 text-[10px] italic">
                        {currentStep === 3 ? "Package has been delivered." : "Estimated delivery by end of day tomorrow."}
                    </p>
                </div>

                {/* 🌟 APPLIED RESET FUNCTION HERE AS WELL 🌟 */}
                <button onClick={handleReset} className="mt-8 text-[10px] text-[#e5d5a3]/40 hover:text-white border-b border-transparent hover:border-[#e5d5a3]/40 transition-all">
                    Track a different item
                </button>
            </div>
        )}

      </div>
    </div>
  )
}

export default function TrackPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#1a0505]"></div>}>
      <TrackContent />
    </Suspense>
  )
}