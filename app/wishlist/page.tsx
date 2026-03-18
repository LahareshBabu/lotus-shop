'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import Script from 'next/script'

export default function WishlistPage() {
  const [wishlist, setWishlist] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const storedWishlist = JSON.parse(localStorage.getItem('wishlist') || '[]')
    setWishlist(storedWishlist)
    setLoading(false)
  }, [])

  const removeFromWishlist = (id: number) => {
    const updated = wishlist.filter(item => item.id !== id)
    setWishlist(updated)
    localStorage.setItem('wishlist', JSON.stringify(updated))
  }

  // ─── SMART ADD TO CART (No Duplicates) ───
  const addToCart = (product: any) => {
    if (product.is_sold_out) return; // Safety check
    const currentCart = JSON.parse(localStorage.getItem('cart') || '[]')
    const existingIndex = currentCart.findIndex((item: any) => item.id === product.id)
    
    let updatedCart;
    if (existingIndex !== -1) {
        // Exists? +1
        updatedCart = [...currentCart]
        updatedCart[existingIndex].quantity = (updatedCart[existingIndex].quantity || 1) + 1
    } else {
        // New? Add
        updatedCart = [...currentCart, { ...product, quantity: 1 }]
    }
    
    localStorage.setItem('cart', JSON.stringify(updatedCart))
    alert("Added to Cart!") 
  }

  if (loading) return <div className="min-h-screen bg-[#1a0505] flex items-center justify-center text-[#e5d5a3] animate-pulse">Loading favorites...</div>

  return (
    <div className="min-h-screen bg-[#1a0505] text-[#e5d5a3] font-sans pb-20">
      
      {/* ─── NAVIGATION ─── */}
      <div className="p-6 border-b border-[#e5d5a3]/10 flex justify-between items-center sticky top-0 bg-[#1a0505]/95 backdrop-blur z-50">
         <Link href="/" className="font-serif text-2xl font-bold tracking-widest text-[#e5d5a3]">LOTUS</Link>
         <Link href="/" className="text-sm hover:text-white border-b border-transparent hover:border-[#e5d5a3] transition-all">← Back Home</Link>
      </div>

      <div className="max-w-7xl mx-auto p-6 md:p-12">
        <h1 className="font-serif text-4xl text-[#f4e4bc] mb-2">Your Loved Treasures</h1>
        <p className="text-[#e5d5a3]/50 text-sm mb-12">Items you have saved for your royal collection.</p>

        {wishlist.length === 0 ? (
            <div className="text-center py-20 border border-dashed border-[#e5d5a3]/20 bg-[#2a0808]/20 rounded">
                <p className="text-[#e5d5a3]/50 text-lg mb-4">Your heart is empty.</p>
                <Link href="/" className="bg-[#c5a059] text-[#1a0505] px-8 py-3 font-bold uppercase tracking-widest hover:bg-white transition-all rounded">
                    Find Something to Love
                </Link>
            </div>
        ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                {wishlist.map((item) => (
                    <WishlistCard 
                        key={item.id} 
                        product={item} 
                        onRemove={() => removeFromWishlist(item.id)}
                        onAddToCart={() => addToCart(item)}
                    />
                ))}
            </div>
        )}
      </div>
    </div>
  )
}

function WishlistCard({ product, onRemove, onAddToCart }: any) {
  const [addedEffect, setAddedEffect] = useState(false)

  return (
    <div className="group relative flex flex-col overflow-hidden bg-[#2a0808] border border-[#e5d5a3]/20 hover:border-[#e5d5a3]/60 hover:shadow-2xl rounded transition-all">
        <div className={`relative aspect-[3/4] overflow-hidden bg-[#1a0505] flex items-center justify-center rounded-t ${product.is_sold_out ? 'cursor-default' : 'group cursor-pointer'}`}>
            <Link href={`/product/${product.id}`} className="absolute inset-0 z-0">
                {/* 🌟 FIX: DEDICATED WRAPPER FOR GRAYSCALE TO PREVENT CSS CONFLICTS 🌟 */}
                <div className={`absolute inset-0 ${product.is_sold_out ? 'grayscale opacity-50' : ''}`}>
                    {product.image_url ? (
                        <img 
                            src={product.image_url} 
                            className={`h-full w-full object-cover transition-transform duration-500 ${!product.is_sold_out ? 'group-hover:scale-105 opacity-90 group-hover:opacity-100' : 'opacity-100'}`} 
                        />
                    ) : <span className="text-[#e5d5a3]/30 tracking-widest">IMAGE</span>}
                </div>

                {/* 🌟 ELITE SOLD OUT OVERLAY 🌟 */}
                {product.is_sold_out && (
                    <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
                        <div className="w-full bg-[#1a0505]/80 border-y border-[#c5a059]/30 py-3 flex justify-center shadow-lg">
                            <span className="text-[#c5a059] text-[10px] font-bold uppercase tracking-[0.3em] ml-[0.3em]">
                                Sold Out
                            </span>
                        </div>
                    </div>
                )}
            </Link>

            <button onClick={(e) => { e.preventDefault(); onRemove(); }} className="absolute right-3 top-3 h-8 w-8 flex items-center justify-center rounded-full bg-[#1a0505]/60 backdrop-blur-sm text-[#e5d5a3]/60 hover:bg-red-900/50 hover:text-red-500 border border-[#e5d5a3]/20 z-20 transition-all">✕</button>

            <div className={`absolute inset-x-0 bottom-0 z-20 ${product.is_sold_out ? '' : 'translate-y-full group-hover:translate-y-0'} transition-transform duration-300`}>
                {product.is_sold_out ? (
                    <div className="w-full py-3 font-sans text-[10px] font-bold uppercase tracking-[0.2em] flex items-center justify-center gap-2 bg-[#1a0505] text-[#c5a059]/40 border-t border-[#c5a059]/20 cursor-not-allowed">
                        Out of Stock
                    </div>
                ) : (
                    <button 
                        onClick={(e) => { 
                            e.preventDefault(); 
                            onAddToCart(); 
                            setAddedEffect(true); 
                            setTimeout(() => setAddedEffect(false), 1500); 
                        }} 
                        className="w-full bg-[#e5d5a3] py-3 font-sans text-xs font-bold uppercase tracking-widest text-[#1a0505] hover:bg-white flex items-center justify-center gap-2 transition-all"
                    >
                        {addedEffect ? "Added!" : "Add to Cart"}
                    </button>
                )}
            </div>
        </div>

        <div className={`p-4 bg-[#2a0808] ${product.is_sold_out ? 'opacity-70' : ''}`}>
            <Link href={`/product/${product.id}`} className="hover:text-white transition-colors">
                <h3 className="font-serif text-sm font-medium tracking-wide text-[#e5d5a3] truncate">{product.name}</h3>
            </Link>
            <p className="font-sans text-sm font-bold text-white/80 mt-1">₹{product.price.toLocaleString("en-IN")}</p>
        </div>
    </div>
  )
}