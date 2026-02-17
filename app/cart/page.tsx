'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

const supabaseUrl = "https://fwyliqsazdyprlkemavu.supabase.co"
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ3eWxpcXNhemR5cHJsa2VtYXZ1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAzOTg2MzIsImV4cCI6MjA4NTk3NDYzMn0.dXkx1pEtiZ5uwcQJgisJs14ZyUJTuz-SomMCeZv-jbE"
const supabase = createClient(supabaseUrl, supabaseKey)

function CheckIcon({ className="h-4 w-4" }) { return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg> }
function TrashIcon({ className="h-5 w-5" }) { return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg> }

export default function CartPage() {
  const router = useRouter()
  const [cartItems, setCartItems] = useState<any[]>([])
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)

  useEffect(() => { fetchCart() }, [])

  const fetchCart = async () => {
    const localCart = JSON.parse(localStorage.getItem('cart') || '[]')
    if (localCart.length > 0) {
        setCartItems(localCart)
        const allIds = new Set<string>(localCart.map((item: any) => String(item.id)))
        setSelectedIds(allIds)
        setLoading(false)
        return
    }
    const { data: { session } } = await supabase.auth.getSession()
    if (session) {
        const { data } = await supabase.from('cart').select('*').eq('user_id', session.user.id)
        if (data && data.length > 0) {
            setCartItems(data)
            setSelectedIds(new Set<string>(data.map((item: any) => String(item.id))))
        }
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

  const toggleItem = (id: string) => {
      const idStr = String(id)
      const newSelected = new Set(selectedIds)
      if (newSelected.has(idStr)) newSelected.delete(idStr)
      else newSelected.add(idStr)
      setSelectedIds(newSelected)
  }

  const toggleAll = () => {
      if (selectedIds.size === cartItems.length) setSelectedIds(new Set())
      else setSelectedIds(new Set(cartItems.map(i => String(i.id))))
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

  const selectedTotal = cartItems.filter(item => selectedIds.has(String(item.id))).reduce((sum, item) => sum + (item.price * (item.quantity || 1)), 0)

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
                            <button onClick={toggleAll} className={`w-5 h-5 rounded border flex items-center justify-center transition-all ${selectedIds.size === cartItems.length ? 'bg-[#c5a059] border-[#c5a059] text-[#1a0505]' : 'border-[#e5d5a3]/50 bg-transparent'}`}>
                                {selectedIds.size === cartItems.length && <CheckIcon />}
                            </button>
                            <span className="text-xs uppercase tracking-widest text-[#e5d5a3]/70 font-bold">Select All</span>
                        </div>

                        {cartItems.map(item => {
                            const isSelected = selectedIds.has(String(item.id));
                            return (
                                <div 
                                    key={item.id} 
                                    // 🌟 CLICK ANYWHERE TO TOGGLE SELECTION 🌟
                                    onClick={() => toggleItem(item.id)}
                                    className={`flex gap-6 p-4 rounded border transition-all cursor-pointer bg-[#2a0808] ${isSelected ? 'border-[#c5a059]/50 shadow-[0_0_15px_rgba(197,160,89,0.05)]' : 'border-[#e5d5a3]/10 hover:border-[#e5d5a3]/30'}`}
                                >
                                    <div className={`w-5 h-5 mt-auto mb-auto rounded border flex items-center justify-center transition-all flex-shrink-0 ${isSelected ? 'bg-[#c5a059] border-[#c5a059] text-[#1a0505]' : 'border-[#e5d5a3]/50 bg-transparent'}`}>
                                        {isSelected && <CheckIcon />}
                                    </div>
                                    <div className="h-24 w-24 bg-[#1a0505] rounded overflow-hidden flex-shrink-0 border border-[#e5d5a3]/10">
                                        <img src={item.image_url} className="h-full w-full object-cover" />
                                    </div>
                                    <div className="flex-1 flex justify-between items-center">
                                        <div className="flex flex-col justify-between h-full py-1">
                                            <h3 className="font-serif text-lg text-[#f4e4bc]">{item.name}</h3>
                                            <div className="flex items-center gap-4 mt-2">
                                                <div className="flex items-center border border-[#e5d5a3]/20 rounded bg-[#1a0505]" onClick={(e) => e.stopPropagation()}>
                                                    <button onClick={(e) => updateQuantity(e, item.id, (item.quantity || 1) - 1)} className="px-2 py-1 text-[#c5a059] hover:bg-[#e5d5a3]/10 text-xs">-</button>
                                                    <span className="text-xs text-[#e5d5a3] px-2 font-mono">{item.quantity || 1}</span>
                                                    <button onClick={(e) => updateQuantity(e, item.id, (item.quantity || 1) + 1)} className="px-2 py-1 text-[#c5a059] hover:bg-[#e5d5a3]/10 text-xs">+</button>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex flex-col items-end gap-3 h-full justify-center">
                                            <p className="font-bold text-[#c5a059] text-xl">₹{item.price.toLocaleString("en-IN")}</p>
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
                            <button onClick={handleCheckout} disabled={selectedIds.size === 0} className={`w-full py-4 rounded font-bold uppercase tracking-widest text-xs transition-all shadow-lg ${selectedIds.size > 0 ? 'bg-[#c5a059] text-[#1a0505] hover:bg-white' : 'bg-[#e5d5a3]/10 text-[#e5d5a3]/30 cursor-not-allowed'}`}>Checkout & Pay</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    </div>
  )
}