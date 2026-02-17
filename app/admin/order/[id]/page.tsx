'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
import Link from 'next/link'
import { useParams } from 'next/navigation'

// CONFIGURATION
const supabaseUrl = "https://fwyliqsazdyprlkemavu.supabase.co"
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ3eWxpcXNhemR5cHJsa2VtYXZ1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAzOTg2MzIsImV4cCI6MjA4NTk3NDYzMn0.dXkx1pEtiZ5uwcQJgisJs14ZyUJTuz-SomMCeZv-jbE"
const supabase = createClient(supabaseUrl, supabaseKey)

export default function OrderDetailsPage() {
  const { id } = useParams()
  const [order, setOrder] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchOrder() {
        if(!id) return
        const { data } = await supabase.from('orders').select('*').eq('id', id).single()
        if(data) setOrder(data)
        setLoading(false)
    }
    fetchOrder()
  }, [id])

  if(loading) return <div className="min-h-screen bg-[#1a0505] flex items-center justify-center text-[#c5a059]">Loading Order...</div>
  if(!order) return <div className="min-h-screen bg-[#1a0505] text-[#e5d5a3] flex items-center justify-center">Order Not Found</div>

  const itemsData = order.items || {}
  const shipping = itemsData.shipping_details || {}
  const products = Array.isArray(itemsData.products) ? itemsData.products : []

  // 🌟 FIX STATUS DISPLAY: Match Dashboard Logic 🌟
  // If status is 'Processing', show 'Order Placed' to be consistent
  const displayStatus = order.status === 'Processing' ? 'Order Placed' : order.status

  return (
    <div className="min-h-screen bg-[#1a0505] text-[#e5d5a3] font-sans p-8">
        <div className="max-w-4xl mx-auto">
            <Link href="/admin" className="text-xs uppercase tracking-widest text-[#e5d5a3]/50 hover:text-white mb-8 block">← Back to Dashboard</Link>
            
            {/* ORDER INFO CARD */}
            <div className="bg-[#2a0808] border border-[#e5d5a3]/20 rounded p-8 mb-8">
                <div className="flex justify-between items-start border-b border-[#e5d5a3]/10 pb-6 mb-6">
                    <div>
                        <h1 className="font-serif text-3xl text-[#f4e4bc] mb-1">Order Details</h1>
                        <p className="text-[#c5a059] font-mono text-sm">Order ID: {order.id}</p>
                    </div>
                    <div className="text-right">
                        <p className="text-sm text-[#e5d5a3]/50 uppercase tracking-widest mb-1">Status</p>
                        {/* 🌟 STATUS BADGE UPDATED 🌟 */}
                        <span className="bg-[#c5a059]/20 text-[#c5a059] px-3 py-1 rounded text-xs font-bold uppercase tracking-widest">
                            {displayStatus}
                        </span>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div>
                        <h3 className="font-bold text-[#e5d5a3] uppercase text-xs tracking-widest mb-4 border-b border-[#e5d5a3]/10 pb-2">Customer</h3>
                        <p className="text-lg font-serif text-white">{shipping.firstName} {shipping.lastName}</p>
                        <p className="text-sm text-[#e5d5a3]/70">Phone: {shipping.phone}</p>
                    </div>
                    <div>
                        <h3 className="font-bold text-[#e5d5a3] uppercase text-xs tracking-widest mb-4 border-b border-[#e5d5a3]/10 pb-2">Shipping Address</h3>
                        <p className="text-sm text-[#e5d5a3]/70">{shipping.street}</p>
                        <p className="text-sm text-[#e5d5a3]/70">{shipping.city} - {shipping.zip}</p>
                    </div>
                </div>
            </div>

            {/* PRODUCT LIST CARD */}
            <div className="bg-[#2a0808] border border-[#e5d5a3]/20 rounded p-8">
                <h3 className="font-serif text-xl text-[#f4e4bc] mb-6">Items Ordered ({products.length})</h3>
                
                {products.length === 0 ? (
                    <p className="text-[#e5d5a3]/30 italic">No product details found for this order.</p>
                ) : (
                    // 🌟 SCROLLBAR ADDED HERE 🌟
                    // max-h-[320px] limits height to roughly 3-4 items, forcing scroll if more.
                    <div className="space-y-6 max-h-[320px] overflow-y-auto pr-2 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-[#1a0505] [&::-webkit-scrollbar-thumb]:bg-[#c5a059] [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-[#e5d5a3]">
                        {products.map((item: any, idx: number) => (
                            <div key={idx} className="flex gap-4 items-center border-b border-[#e5d5a3]/5 pb-4 last:border-0 last:pb-0">
                                <div className="h-16 w-16 bg-[#1a0505] rounded overflow-hidden border border-[#e5d5a3]/10 flex-shrink-0">
                                    {item.image_url ? (
                                        <img src={item.image_url} className="h-full w-full object-cover" />
                                    ) : (
                                        <div className="h-full w-full flex items-center justify-center text-[8px] text-[#e5d5a3]/30">NO IMAGE</div>
                                    )}
                                </div>
                                <div className="flex-1">
                                    <h4 className="font-bold text-[#e5d5a3]">{item.name}</h4>
                                    <p className="text-xs text-[#e5d5a3]/50">Qty: {item.quantity || 1}</p>
                                </div>
                                <p className="font-mono text-[#c5a059]">₹{item.price.toLocaleString("en-IN")}</p>
                            </div>
                        ))}
                    </div>
                )}

                <div className="mt-8 pt-6 border-t border-[#e5d5a3]/10 flex justify-between items-center">
                    <span className="uppercase text-xs font-bold tracking-widest text-[#e5d5a3]/50">Total Amount</span>
                    <span className="text-3xl font-serif text-[#f4e4bc]">₹{order.total.toLocaleString("en-IN")}</span>
                </div>
            </div>
        </div>
    </div>
  )
}