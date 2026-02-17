'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'

// CONFIGURATION
const supabaseUrl = "https://fwyliqsazdyprlkemavu.supabase.co"
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ3eWxpcXNhemR5cHJsa2VtYXZ1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAzOTg2MzIsImV4cCI6MjA4NTk3NDYzMn0.dXkx1pEtiZ5uwcQJgisJs14ZyUJTuz-SomMCeZv-jbE"
const supabase = createClient(supabaseUrl, supabaseKey)

// ICONS
function TrashIcon({ className="h-4 w-4" }) { return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg> }
function EditIcon({ className="h-4 w-4" }) { return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" /></svg> }

export default function CheckoutPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const itemsParam = searchParams.get('ids')

  const [checkoutItems, setCheckoutItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  
  // ADDRESS STATE
  const [savedAddresses, setSavedAddresses] = useState<any[]>([])
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null)
  
  const [formData, setFormData] = useState({ firstName: '', lastName: '', street: '', city: '', zip: '', phone: '' })

  useEffect(() => {
    fetchData()
  }, [itemsParam])

  const fetchData = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    
    // FETCH ADDRESSES
    if (session) {
        const { data: addrs } = await supabase.from('addresses').select('*').eq('user_id', session.user.id)
        if (addrs) setSavedAddresses(addrs)
    }

    // FETCH ITEMS (Local + URL filter)
    const localCart = JSON.parse(localStorage.getItem('cart') || '[]')
    let itemsToDisplay = localCart;

    if (itemsParam) {
        const idsArray = itemsParam.split(',')
        itemsToDisplay = localCart.filter((i: any) => idsArray.includes(String(i.id)))
    }

    setCheckoutItems(itemsToDisplay)
    setLoading(false)
  }

  const handleSelectAddress = (addr: any) => {
      setSelectedAddressId(addr.id)
      setFormData({
          firstName: addr.name.split(' ')[0] || '',
          lastName: addr.name.split(' ').slice(1).join(' ') || '',
          street: addr.street,
          city: addr.city,
          zip: addr.zip,
          phone: addr.phone
      })
  }

  const updateQuantity = (id: string, newQty: number) => {
      if (newQty < 1) return
      setCheckoutItems(items => items.map(item => item.id === id ? { ...item, quantity: newQty } : item))
      const cart = JSON.parse(localStorage.getItem('cart') || '[]')
      const idx = cart.findIndex((i: any) => i.id === id)
      if(idx > -1) { cart[idx].quantity = newQty; localStorage.setItem('cart', JSON.stringify(cart)) }
  }

  const removeItem = (id: string) => {
      setCheckoutItems(items => items.filter(item => item.id !== id))
      const cart = JSON.parse(localStorage.getItem('cart') || '[]')
      const newCart = cart.filter((i: any) => i.id !== id)
      localStorage.setItem('cart', JSON.stringify(newCart))
  }

  const total = checkoutItems.reduce((acc, item) => acc + (item.price * (item.quantity || 1)), 0)

  const handlePlaceOrder = async (e: React.FormEvent) => {
      e.preventDefault()
      const { data: { session } } = await supabase.auth.getSession()
      if(!session) return alert("Please login to place your royal order.")

      const orderId = `ORD-${Date.now()}`

      const { data: order, error } = await supabase.from('orders').insert({
          id: orderId,
          user_id: session.user.id,
          total: total,
          status: 'Processing',
          items: { products: checkoutItems, shipping_details: formData }
      }).select().single()

      if (!error && order) {
          const currentCart = JSON.parse(localStorage.getItem('cart') || '[]')
          const idsPurchased = checkoutItems.map(i => String(i.id))
          const remainingCart = currentCart.filter((i: any) => !idsPurchased.includes(String(i.id)))
          localStorage.setItem('cart', JSON.stringify(remainingCart))
          
          await supabase.from('cart').delete().in('id', idsPurchased)
          
          // 🌟 FINAL STEP: REDIRECT TO SUCCESS PAGE 🌟
          router.push('/checkout/success')
      } else {
          alert(`Order Error: ${error?.message || "Unknown error"}`)
      }
  }

  if (loading) return <div className="min-h-screen bg-[#1a0505] flex items-center justify-center text-[#c5a059]">Loading...</div>

  return (
    <div className="min-h-screen bg-[#1a0505] text-[#e5d5a3] font-sans">
      <header className="border-b border-[#e5d5a3]/10 bg-[#1a0505] p-6 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <Link href="/" className="font-serif text-2xl font-bold tracking-widest text-[#e5d5a3]">LOTUS</Link>
          <Link href="/cart" className="text-xs uppercase tracking-widest text-[#e5d5a3]/50 hover:text-white">← Back to Cart</Link>
        </div>
      </header>

      <div className="max-w-6xl mx-auto p-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
            
            {/* LEFT: SHIPPING */}
            <div>
                <h2 className="font-serif text-2xl text-[#f4e4bc] mb-8 flex items-center gap-4">
                    <span className="bg-[#c5a059] text-[#1a0505] rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">1</span>
                    Shipping Details
                </h2>

                {savedAddresses.length > 0 && (
                    <div className="mb-10">
                        <p className="text-[10px] uppercase tracking-widest text-[#e5d5a3]/50 font-bold mb-4">Saved Addresses</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            {savedAddresses.map(addr => (
                                <div 
                                    key={addr.id} 
                                    onClick={() => handleSelectAddress(addr)}
                                    className={`relative p-6 rounded cursor-pointer transition-all border group ${selectedAddressId === addr.id ? 'bg-[#2a0808] border-[#c5a059] shadow-[0_0_15px_rgba(197,160,89,0.1)]' : 'bg-[#2a0808] border-[#e5d5a3]/20 hover:border-[#e5d5a3]/40'}`}
                                >
                                    <div className="absolute top-4 right-4 flex gap-2">
                                        <div className="border border-[#e5d5a3]/20 p-1.5 rounded text-[#c5a059] opacity-50"><EditIcon /></div>
                                    </div>
                                    <h3 className="font-bold text-[#f4e4bc] mb-2 font-serif uppercase tracking-wide text-sm">{addr.name}</h3>
                                    <p className="text-xs text-[#e5d5a3]/70 leading-relaxed mb-1">{addr.street}</p>
                                    <p className="text-xs text-[#e5d5a3]/70 leading-relaxed mb-4">{addr.city} - {addr.zip}</p>
                                    <p className="text-[10px] text-[#c5a059] font-bold tracking-widest uppercase">Phone: {addr.phone}</p>
                                </div>
                            ))}
                        </div>
                        <div className="flex items-center gap-4 my-8">
                            <div className="h-px bg-[#e5d5a3]/10 flex-1"></div>
                            <span className="text-[10px] uppercase text-[#e5d5a3]/30 tracking-widest">Or Enter New Address</span>
                            <div className="h-px bg-[#e5d5a3]/10 flex-1"></div>
                        </div>
                    </div>
                )}

                <form onSubmit={handlePlaceOrder} className="space-y-6">
                    <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-2"><label className="text-[10px] uppercase tracking-widest text-[#e5d5a3]/50 font-bold">First Name</label><input required className="w-full bg-[#2a0808] border border-[#e5d5a3]/20 p-4 rounded text-[#c5a059] outline-none focus:border-[#c5a059]" value={formData.firstName} onChange={e => setFormData({...formData, firstName: e.target.value})} /></div>
                        <div className="space-y-2"><label className="text-[10px] uppercase tracking-widest text-[#e5d5a3]/50 font-bold">Last Name</label><input required className="w-full bg-[#2a0808] border border-[#e5d5a3]/20 p-4 rounded text-[#c5a059] outline-none focus:border-[#c5a059]" value={formData.lastName} onChange={e => setFormData({...formData, lastName: e.target.value})} /></div>
                    </div>
                    <div className="space-y-2"><label className="text-[10px] uppercase tracking-widest text-[#e5d5a3]/50 font-bold">Street Address</label><input required className="w-full bg-[#2a0808] border border-[#e5d5a3]/20 p-4 rounded text-[#c5a059] outline-none focus:border-[#c5a059]" value={formData.street} onChange={e => setFormData({...formData, street: e.target.value})} /></div>
                    <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-2"><label className="text-[10px] uppercase tracking-widest text-[#e5d5a3]/50 font-bold">City</label><input required className="w-full bg-[#2a0808] border border-[#e5d5a3]/20 p-4 rounded text-[#c5a059] outline-none focus:border-[#c5a059]" value={formData.city} onChange={e => setFormData({...formData, city: e.target.value})} /></div>
                        <div className="space-y-2"><label className="text-[10px] uppercase tracking-widest text-[#e5d5a3]/50 font-bold">Pincode</label><input required className="w-full bg-[#2a0808] border border-[#e5d5a3]/20 p-4 rounded text-[#c5a059] outline-none focus:border-[#c5a059]" value={formData.zip} onChange={e => setFormData({...formData, zip: e.target.value})} /></div>
                    </div>
                    <div className="space-y-2"><label className="text-[10px] uppercase tracking-widest text-[#e5d5a3]/50 font-bold">Phone Number</label><input required className="w-full bg-[#2a0808] border border-[#e5d5a3]/20 p-4 rounded text-[#c5a059] outline-none focus:border-[#c5a059]" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} /></div>
                    <button type="submit" id="submit-order" className="hidden">Submit</button>
                </form>
            </div>

            {/* RIGHT: SUMMARY */}
            <div className="bg-[#2a0808] p-10 rounded border border-[#e5d5a3]/20 h-fit sticky top-28">
                <h2 className="font-serif text-2xl text-[#f4e4bc] mb-8 flex items-center gap-4">
                    <span className="bg-[#c5a059] text-[#1a0505] rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">2</span>
                    Order Summary
                </h2>

                <div className="space-y-6 mb-8 border-b border-[#e5d5a3]/10 pb-8">
                    {checkoutItems.map(item => (
                        <div key={item.id} className="flex gap-4 items-start relative group">
                            <button onClick={() => removeItem(String(item.id))} className="absolute top-0 right-0 text-[#e5d5a3]/20 hover:text-red-500 transition-colors">
                                <TrashIcon />
                            </button>
                            <div className="h-20 w-20 bg-[#1a0505] rounded overflow-hidden border border-[#e5d5a3]/10 flex-shrink-0">
                                <img src={item.image_url} className="h-full w-full object-cover" />
                            </div>
                            <div className="flex-1 pt-1">
                                <h4 className="font-serif text-[#f4e4bc] text-lg leading-tight mb-2 pr-6">{item.name}</h4>
                                <div className="flex items-center gap-4">
                                    <div className="flex items-center border border-[#e5d5a3]/20 rounded bg-[#1a0505]">
                                        <button onClick={() => updateQuantity(String(item.id), (item.quantity || 1) - 1)} className="px-2 text-[#c5a059] hover:bg-[#e5d5a3]/10">-</button>
                                        <span className="text-xs text-[#e5d5a3] px-2 font-mono">{item.quantity || 1}</span>
                                        <button onClick={() => updateQuantity(String(item.id), (item.quantity || 1) + 1)} className="px-2 text-[#c5a059] hover:bg-[#e5d5a3]/10">+</button>
                                    </div>
                                </div>
                            </div>
                            <p className="font-bold text-[#c5a059] self-center">₹{item.price.toLocaleString("en-IN")}</p>
                        </div>
                    ))}
                </div>

                <div className="space-y-3 text-sm text-[#e5d5a3]/70">
                    <div className="flex justify-between"><span>Subtotal</span><span>₹{total.toLocaleString("en-IN")}</span></div>
                    <div className="flex justify-between text-[#10b981]"><span>Shipping</span><span>Free</span></div>
                </div>
                <div className="border-t border-[#e5d5a3]/10 pt-6 mt-6 flex justify-between text-2xl font-serif text-[#f4e4bc]">
                    <span>Total</span>
                    <span>₹{total.toLocaleString("en-IN")}</span>
                </div>

                <label htmlFor="submit-order" className="mt-8 w-full bg-[#c5a059] text-[#1a0505] py-4 rounded font-bold uppercase tracking-widest text-xs hover:bg-white transition-all shadow-lg text-center block cursor-pointer">
                    Complete Checkout
                </label>
            </div>

        </div>
      </div>
    </div>
  )
}