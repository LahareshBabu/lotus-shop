'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
import Link from 'next/link'
import { useParams } from 'next/navigation'

// CONFIGURATION
import { supabase } from '@/app/supabase'

// ICONS
function CheckCircleIcon({ className="h-4 w-4" }) { return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> }

export default function OrderDetailsPage() {
  const { id } = useParams()
  const [order, setOrder] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  
  const [openDropdown, setOpenDropdown] = useState<number | null>(null)
  const [openGlobalDropdown, setOpenGlobalDropdown] = useState(false)

  useEffect(() => {
    async function fetchOrder() {
        if(!id) return
        const { data } = await supabase.from('orders').select('*').eq('id', id).single()
        if(data) setOrder(data)
        setLoading(false)
    }
    fetchOrder()
  }, [id])

  // 🌟 ITEM-LEVEL STATUS UPDATE LOGIC (Strict 4-Step Track) 🌟
  const handleItemStatusChange = async (index: number, newStatus: string) => {
      if (!order) return;

      const itemsData = order.items || {};
      const products = Array.isArray(itemsData.products) ? [...itemsData.products] : [];
      
      products[index] = { ...products[index], status: newStatus };

      // Removed 'Processing'
      const statusPriority = ['Order Placed', 'Shipped', 'Out for Delivery', 'Delivered'];
      let lowestStatusIndex = 3; 
      
      products.forEach(p => {
          let s = p.status || 'Order Placed';
          if (s === 'Processing') s = 'Order Placed'; // Safely catch any old DB data
          
          let idx = statusPriority.indexOf(s);
          if (idx === -1) idx = 0; 
          if (idx < lowestStatusIndex) {
              lowestStatusIndex = idx;
          }
      });
      
      const newOverallStatus = statusPriority[lowestStatusIndex];
      const updatedItems = { ...itemsData, products };

      setOrder({ ...order, items: updatedItems, status: newOverallStatus });

      await supabase.from('orders').update({ 
          items: updatedItems, 
          status: newOverallStatus 
      }).eq('id', order.id);
  }

  // 🌟 GLOBAL "UPDATE ALL" STATUS LOGIC 🌟
  const handleGlobalStatusChange = async (newStatus: string) => {
      if (!order) return;

      const itemsData = order.items || {};
      const products = Array.isArray(itemsData.products) ? [...itemsData.products] : [];
      
      // Force every single item to match the new status
      const updatedProducts = products.map(p => ({ ...p, status: newStatus }));
      const updatedItems = { ...itemsData, products: updatedProducts };

      setOrder({ ...order, items: updatedItems, status: newStatus });
      setOpenGlobalDropdown(false);

      await supabase.from('orders').update({ 
          items: updatedItems, 
          status: newStatus 
      }).eq('id', order.id);
  }

  if(loading) return <div className="min-h-screen bg-[#1a0505] flex items-center justify-center text-[#c5a059]">Loading Order...</div>
  if(!order) return <div className="min-h-screen bg-[#1a0505] text-[#e5d5a3] flex items-center justify-center">Order Not Found</div>

  const itemsData = order.items || {}
  const shipping = itemsData.shipping_details || {}
  const products = Array.isArray(itemsData.products) ? itemsData.products : []

  // 🌟 NEW BINARY STATUS LOGIC (Matching the Main Dashboard) 🌟
  const isFullyDelivered = order.status === 'Delivered';
  let fallbackItemStatus = (!order.status) ? 'Order Placed' : order.status;
  if (fallbackItemStatus === 'Processing') fallbackItemStatus = 'Order Placed';

  return (
    <div className="min-h-screen bg-[#1a0505] text-[#e5d5a3] font-sans p-8 relative">
        <div className="max-w-4xl mx-auto relative z-10 pb-32">
            <Link href="/admin" className="text-xs uppercase tracking-widest text-[#e5d5a3]/50 hover:text-white mb-8 block">← Back to Dashboard</Link>
            
            {/* ORDER INFO CARD */}
            <div className="bg-[#2a0808] border border-[#e5d5a3]/20 rounded p-8 mb-8 shadow-lg relative z-20">
                <div className="flex justify-between items-start border-b border-[#e5d5a3]/10 pb-6 mb-6">
                    <div>
                        <h1 className="font-serif text-3xl text-[#f4e4bc] mb-1">Order Details</h1>
                        <p className="text-[#c5a059] font-mono text-sm">Order ID: {order.id}</p>
                    </div>
                    
                    <div className="text-right flex flex-col items-end relative">
                        <p className="text-sm text-[#e5d5a3]/50 uppercase tracking-widest mb-2">Overall Status</p>
                        
                        {/* 🌟 SYNCED DASHBOARD BADGES 🌟 */}
                        {isFullyDelivered ? (
                            <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded text-[10px] font-bold uppercase tracking-widest bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 shadow-md">
                                <CheckCircleIcon className="w-3.5 h-3.5" /> Fully Delivered
                            </span>
                        ) : (
                            <span className="inline-flex items-center px-4 py-1.5 rounded text-[10px] font-bold uppercase tracking-widest bg-[#c5a059]/10 text-[#c5a059] border border-[#c5a059]/30 shadow-md">
                                Pending Delivery
                            </span>
                        )}

                        {/* 🌟 NEW GLOBAL "UPDATE ALL" DROPDOWN 🌟 */}
                        <div className="relative mt-4">
                            <button 
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setOpenGlobalDropdown(!openGlobalDropdown);
                                }}
                                className="text-[9px] uppercase tracking-widest text-[#c5a059] border border-[#c5a059]/30 px-3 py-1.5 rounded hover:bg-[#c5a059]/10 transition-colors flex items-center shadow-sm"
                            >
                                Update All Items
                                <svg className={`w-3 h-3 ml-1.5 opacity-70 transition-transform ${openGlobalDropdown ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                            </button>

                            {openGlobalDropdown && (
                                <>
                                    <div 
                                        className="fixed inset-0 z-[90]" 
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setOpenGlobalDropdown(false);
                                        }}
                                    ></div>

                                    <div className="absolute right-0 top-full mt-2 w-[150px] bg-[#1a0505] border border-[#c5a059] rounded shadow-[0_10px_30px_rgba(0,0,0,0.9)] overflow-hidden z-[100]">
                                        <div className="px-3 py-2 bg-[#c5a059]/10 border-b border-[#c5a059]/20 text-[8px] text-[#c5a059] font-bold uppercase tracking-widest text-left">
                                            Apply to entire order:
                                        </div>
                                        {['Order Placed', 'Shipped', 'Out for Delivery', 'Delivered'].map((statusOption) => (
                                            <button 
                                                key={statusOption}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleGlobalStatusChange(statusOption);
                                                }}
                                                className="w-full text-left px-3 py-2.5 text-[10px] uppercase tracking-widest cursor-pointer transition-colors text-[#e5d5a3]/70 hover:bg-[#e5d5a3]/10 hover:text-[#e5d5a3]"
                                            >
                                                {statusOption}
                                            </button>
                                        ))}
                                    </div>
                                </>
                            )}
                        </div>
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
            <div className="bg-[#2a0808] border border-[#e5d5a3]/20 rounded p-8 shadow-lg relative z-10">
                <h3 className="font-serif text-xl text-[#f4e4bc] mb-6">Items Ordered ({products.length})</h3>
                
                {products.length === 0 ? (
                    <p className="text-[#e5d5a3]/30 italic">No product details found for this order.</p>
                ) : (
                    <div className="space-y-6">
                        {products.map((item: any, idx: number) => {
                            let currentItemStatus = item.status || fallbackItemStatus;
                            if (currentItemStatus === 'Processing') currentItemStatus = 'Order Placed'; // Fallback catch
                            
                            return (
                                <div key={idx} className={`flex gap-4 items-center border-b border-[#e5d5a3]/5 pb-6 last:border-0 last:pb-0 relative ${openDropdown === idx ? 'z-50' : 'z-10'}`}>
                                    <div className="h-16 w-16 bg-[#1a0505] rounded overflow-hidden border border-[#e5d5a3]/10 flex-shrink-0 shadow-sm">
                                        {item.image_url ? (
                                            <img src={item.image_url} className="h-full w-full object-cover" />
                                        ) : (
                                            <div className="h-full w-full flex items-center justify-center text-[8px] text-[#e5d5a3]/30">NO IMAGE</div>
                                        )}
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="font-bold text-[#e5d5a3]">{item.name}</h4>
                                        <p className="text-xs text-[#e5d5a3]/50 mt-1">Qty: {item.quantity || 1}</p>
                                    </div>
                                    
                                    <div className="flex flex-col items-end gap-3 relative">
                                        <p className="font-mono text-[#c5a059] font-bold">₹{item.price.toLocaleString("en-IN")}</p>
                                        
                                        <div className="relative">
                                            <button 
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setOpenDropdown(openDropdown === idx ? null : idx);
                                                }}
                                                className="relative z-50 bg-[#1a0505] border border-[#e5d5a3]/20 text-[#e5d5a3] text-[10px] uppercase tracking-widest px-3 py-2 rounded outline-none hover:border-[#c5a059] cursor-pointer hover:bg-[#e5d5a3]/5 transition-colors flex items-center justify-between min-w-[140px]"
                                            >
                                                <span>{currentItemStatus}</span>
                                                <svg className={`w-3 h-3 ml-2 opacity-50 transition-transform ${openDropdown === idx ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                                            </button>

                                            {openDropdown === idx && (
                                                <>
                                                    <div 
                                                        className="fixed inset-0 z-[90]" 
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setOpenDropdown(null);
                                                        }}
                                                    ></div>

                                                    <div className="absolute right-0 top-full mt-1 w-[140px] bg-[#1a0505] border border-[#c5a059] rounded shadow-[0_10px_30px_rgba(0,0,0,0.9)] overflow-hidden z-[100]">
                                                        {/* Strict 4-Option Menu */}
                                                        {['Order Placed', 'Shipped', 'Out for Delivery', 'Delivered'].map((statusOption) => (
                                                            <button 
                                                                key={statusOption}
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    handleItemStatusChange(idx, statusOption);
                                                                    setOpenDropdown(null);
                                                                }}
                                                                className={`w-full text-left px-3 py-2 text-[10px] uppercase tracking-widest cursor-pointer transition-colors ${
                                                                    currentItemStatus === statusOption 
                                                                        ? 'bg-[#c5a059]/10 text-[#c5a059] font-bold border-l-2 border-[#c5a059]' 
                                                                        : 'text-[#e5d5a3]/70 hover:bg-[#e5d5a3]/10 hover:text-[#e5d5a3]'
                                                                }`}
                                                            >
                                                                {statusOption}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )
                        })}
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