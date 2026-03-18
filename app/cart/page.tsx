'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

import { supabase } from '@/app/supabase'

function CheckIcon({ className="h-4 w-4" }) { return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg> }
function TrashIcon({ className="h-5 w-5" }) { return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg> }

export default function CartPage() {
  const router = useRouter()
  const [cartItems, setCartItems] = useState<any[]>([])
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)

  useEffect(() => { fetchCart() }, [])

  const fetchCart = async () => {
    try {
        // 🌟 FORTRESS DATA SYNCHRONIZER: Fetch freshest inventory from DB 🌟
        const { data: freshProducts, error } = await supabase.from('products').select('*')
        if (error) throw error

        const localCart = JSON.parse(localStorage.getItem('cart') || '[]')
        const { data: { session } } = await supabase.auth.getSession()
        
        let initialCart = [];

        if (localCart.length > 0) {
            initialCart = localCart;
        } else if (session) {
            const { data } = await supabase.from('cart').select('*').eq('user_id', session.user.id)
            if (data && data.length > 0) {
                initialCart = data;
            }
        }

        // 🌟 Sync local cart with fresh DB data to catch "is_sold_out" status 🌟
        if (initialCart.length > 0 && freshProducts) {
            const syncedCart = initialCart.map((item: any) => {
                const freshData = freshProducts.find(p => p.id === item.id) || item;
                return { ...item, ...freshData }; // Override local with fresh data
            });

            setCartItems(syncedCart)
            localStorage.setItem('cart', JSON.stringify(syncedCart)); // Update local storage with fresh data

            // Only auto-select items that are NOT sold out
            const validIds = new Set<string>(
                syncedCart.filter((item: any) => !item.is_sold_out).map((item: any) => String(item.id))
            )
            setSelectedIds(validIds)
        }
    } catch (err) {
        console.error("Cart Sync Error:", err);
    }
    setLoading(false)
  }

  const updateQuantity = async (e: any, id: string, newQty: number) => {
      e.stopPropagation() // 🌟 Prevent triggering card selection
      if (newQty < 1) return
      const updatedItems = cartItems.map(item => String(item.id) === String(id) ? { ...item, quantity: newQty } : item)
      setCartItems(updatedItems)
      localStorage.setItem('cart', JSON.stringify(updatedItems))
      const { data: { session } } = await supabase.auth.getSession()
      if (session) await supabase.from('cart').update({ quantity: newQty }).eq('id', id)
  }

  const toggleItem = (id: string, isSoldOut: boolean) => {
      if (isSoldOut) return; // Prevent selecting sold out items
      
      const idStr = String(id)
      const newSelected = new Set(selectedIds)
      if (newSelected.has(idStr)) newSelected.delete(idStr)
      else newSelected.add(idStr)
      setSelectedIds(newSelected)
  }

  const toggleAll = () => {
      // Only count available items
      const availableItems = cartItems.filter(i => !i.is_sold_out);
      
      if (selectedIds.size === availableItems.length) {
          setSelectedIds(new Set())
      } else {
          setSelectedIds(new Set(availableItems.map(i => String(i.id))))
      }
  }

  const removeItem = async (e: any, id: string) => {
      e.stopPropagation() // 🌟 Prevent triggering card selection
      const newItems = cartItems.filter(i => String(i.id) !== String(id))
      setCartItems(newItems)
      localStorage.setItem('cart', JSON.stringify(newItems))
      const { data: { session } } = await supabase.auth.getSession()
      if (session) await supabase.from('cart').delete().eq('id', id)
      const newSelected = new Set(selectedIds)
      newSelected.delete(String(id))
      setSelectedIds(newSelected)
      window.dispatchEvent(new Event('storage'))
  }

  const handleCheckout = () => {
      if (selectedIds.size === 0) return alert("Please select items to buy.")
      const idsParam = Array.from(selectedIds).join(',')
      router.push(`/checkout?ids=${idsParam}`)
  }

  const selectedTotal = cartItems.filter(item => selectedIds.has(String(item.id)) && !item.is_sold_out).reduce((sum, item) => sum + (item.price * (item.quantity || 1)), 0)
  
  // Count only available items for the "Select All" toggle logic
  const availableItemsCount = cartItems.filter(i => !i.is_sold_out).length;

  if (loading) return <div className="min-h-screen bg-[#1a0505] flex items-center justify-center text-[#c5a059] font-serif">Loading...</div>

  return (
    <div className="min-h-screen bg-[#1a0505] text-[#e5d5a3] font-sans">
        <header className="border-b border-[#e5d5a3]/10 bg-[#1a0505] p-6 sticky top-0 z-50">
            <div className="max-w-6xl mx-auto flex justify-between items-center">
            <Link href="/" className="font-serif text-2xl font-bold tracking-widest text-[#e5d5a3]">LOTUS</Link>
            <Link href="/" className="text-xs uppercase tracking-widest text-[#e5d5a3]/50 hover:text-white">Back Home</Link>
            </div>
        </header>

        <div className="max-w-6xl mx-auto p-8">
            <h1 className="font-serif text-3xl text-[#f4e4bc] mb-2">Your Shopping Cart</h1>
            <p className="text-[#e5d5a3]/50 text-sm mb-12 italic">Select the treasures you wish to claim.</p>

            {cartItems.length === 0 ? (
                <div className="text-center py-20 border border-dashed border-[#e5d5a3]/20 rounded">
                    <p className="text-[#e5d5a3]/50 mb-4">Your cart is empty.</p>
                    <Link href="/" className="text-[#c5a059] hover:underline uppercase tracking-widest text-xs">Continue Shopping</Link>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                    <div className="lg:col-span-2 space-y-4">
                        <div className="flex items-center gap-4 border-b border-[#e5d5a3]/10 pb-4 mb-6">
                            <button 
                                onClick={toggleAll} 
                                disabled={availableItemsCount === 0}
                                className={`w-5 h-5 rounded border flex items-center justify-center transition-all ${availableItemsCount === 0 ? 'border-[#e5d5a3]/10 bg-[#1a0505] cursor-not-allowed' : selectedIds.size === availableItemsCount ? 'bg-[#c5a059] border-[#c5a059] text-[#1a0505]' : 'border-[#e5d5a3]/50 bg-transparent'}`}
                            >
                                {(selectedIds.size === availableItemsCount && availableItemsCount > 0) && <CheckIcon />}
                            </button>
                            <span className="text-xs uppercase tracking-widest text-[#e5d5a3]/70 font-bold">Select All</span>
                        </div>

                        {cartItems.map(item => {
                            const isSelected = selectedIds.has(String(item.id));
                            return (
                                <div 
                                    key={item.id} 
                                    // 🌟 CLICK ANYWHERE TO TOGGLE SELECTION (IF NOT SOLD OUT) 🌟
                                    onClick={() => toggleItem(item.id, item.is_sold_out)}
                                    className={`flex gap-6 p-4 rounded border transition-all bg-[#2a0808] ${item.is_sold_out ? 'opacity-60 cursor-not-allowed border-[#e5d5a3]/5' : isSelected ? 'border-[#c5a059]/50 shadow-[0_0_15px_rgba(197,160,89,0.05)] cursor-pointer' : 'border-[#e5d5a3]/10 hover:border-[#e5d5a3]/30 cursor-pointer'}`}
                                >
                                    <div className={`w-5 h-5 mt-auto mb-auto rounded border flex items-center justify-center transition-all flex-shrink-0 ${item.is_sold_out ? 'border-[#e5d5a3]/10 bg-[#1a0505]' : isSelected ? 'bg-[#c5a059] border-[#c5a059] text-[#1a0505]' : 'border-[#e5d5a3]/50 bg-transparent'}`}>
                                        {isSelected && !item.is_sold_out && <CheckIcon />}
                                    </div>
                                    <div className="h-24 w-24 bg-[#1a0505] rounded overflow-hidden flex-shrink-0 border border-[#e5d5a3]/10 relative">
                                        <img src={item.image_url} className={`h-full w-full object-cover ${item.is_sold_out ? 'grayscale opacity-70' : ''}`} />
                                        {item.is_sold_out && (
                                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                                <div className="w-full bg-[#1a0505]/80 py-1 flex justify-center">
                                                    <span className="text-[#c5a059] text-[8px] font-bold uppercase tracking-widest">Sold Out</span>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex-1 flex justify-between items-center">
                                        <div className="flex flex-col justify-between h-full py-1">
                                            <h3 className={`font-serif text-lg ${item.is_sold_out ? 'text-[#e5d5a3]/70 line-through' : 'text-[#f4e4bc]'}`}>{item.name}</h3>
                                            
                                            {item.is_sold_out ? (
                                                <div className="mt-2 inline-block bg-red-900/30 border border-red-500/30 text-red-400 text-[10px] px-2 py-1 rounded uppercase tracking-widest font-bold w-fit">
                                                    Out of Stock
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-4 mt-2">
                                                    <div className="flex items-center border border-[#e5d5a3]/20 rounded bg-[#1a0505]" onClick={(e) => e.stopPropagation()}>
                                                        <button onClick={(e) => updateQuantity(e, item.id, (item.quantity || 1) - 1)} className="px-2 py-1 text-[#c5a059] hover:bg-[#e5d5a3]/10 text-xs">-</button>
                                                        <span className="text-xs text-[#e5d5a3] px-2 font-mono">{item.quantity || 1}</span>
                                                        <button onClick={(e) => updateQuantity(e, item.id, (item.quantity || 1) + 1)} className="px-2 py-1 text-[#c5a059] hover:bg-[#e5d5a3]/10 text-xs">+</button>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex flex-col items-end gap-3 h-full justify-center">
                                            <p className={`font-bold text-xl ${item.is_sold_out ? 'text-[#c5a059]/50' : 'text-[#c5a059]'}`}>₹{item.price.toLocaleString("en-IN")}</p>
                                            <button onClick={(e) => removeItem(e, item.id)} className="text-[#e5d5a3]/30 hover:text-red-500 transition-colors text-xs flex items-center gap-1">
                                                <TrashIcon /> <span className="hidden md:inline">Remove</span>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                    <div className="lg:col-span-1">
                        <div className="bg-[#2a0808] p-8 rounded border border-[#e5d5a3]/20 sticky top-28">
                            <h3 className="font-serif text-xl text-[#f4e4bc] mb-6">Summary</h3>
                            <div className="flex justify-between mb-3 text-sm text-[#e5d5a3]/70"><span>Selected</span><span>{selectedIds.size} Items</span></div>
                            <div className="flex justify-between mb-8 text-2xl font-serif text-[#c5a059] pt-4 border-t border-[#e5d5a3]/10"><span>Total</span><span>₹{selectedTotal.toLocaleString("en-IN")}</span></div>
                            <button onClick={handleCheckout} disabled={selectedIds.size === 0} className={`w-full py-4 rounded font-bold uppercase tracking-widest text-xs transition-all shadow-lg ${selectedIds.size > 0 ? 'bg-[#c5a059] text-[#1a0505] hover:bg-white' : 'bg-[#e5d5a3]/10 text-[#e5d5a3]/30 cursor-not-allowed shadow-none'}`}>Checkout & Pay</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    </div>
  )
}