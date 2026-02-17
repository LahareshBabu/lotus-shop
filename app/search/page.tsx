'use client'
import { useState, useEffect, Suspense } from "react"
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'

// ICONS
function SearchIcon({ className = "h-5 w-5" }: { className?: string }) { return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M11 19a8 8 0 100-16 8 8 0 000 16z" /></svg> }
function HeartIcon({ className = "h-5 w-5", filled = false }: { className?: string; filled?: boolean }) { return <svg className={className} fill={filled ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" /></svg> }
function ShoppingBagIcon({ className = "h-5 w-5" }: { className?: string }) { return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4zM3 6h18M16 10a4 4 0 01-8 0" /></svg> }
function UserIcon({ className = "h-5 w-5" }: { className?: string }) { return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2M12 3a4 4 0 100 8 4 4 0 000-8z" /></svg> }

// 🌟 CRASH-PROOF PRODUCT CARD 🌟
function ProductCard({ product, onAddToCart, isWishlisted, onToggleWishlist }: any) {
  const [addedEffect, setAddedEffect] = useState(false)
  
  // Safety: Ensure price exists, default to 0 if missing
  const displayPrice = product.price ? product.price.toLocaleString("en-IN") : "0"

  return (
    <article className="group relative flex flex-col overflow-hidden bg-[#2a0808] border border-[#e5d5a3]/20 transition-all duration-300 hover:border-[#e5d5a3]/60 hover:shadow-2xl rounded">
      <div className="relative aspect-[3/4] overflow-hidden bg-[#1a0505] flex items-center justify-center rounded-t group cursor-pointer">
        <Link href={`/product/${product.id}`} className="absolute inset-0 z-0">
            {product.image_url ? <img src={product.image_url} alt={product.name} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105 opacity-90 group-hover:opacity-100" /> : <div className="flex flex-col items-center justify-center text-[#e5d5a3]/30 h-full"><span className="font-serif text-lg tracking-widest">IMAGE</span></div>}
        </Link>
        <button onClick={(e) => { e.preventDefault(); onToggleWishlist(product); }} className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-[#1a0505]/60 backdrop-blur-sm hover:bg-[#e5d5a3] hover:text-[#1a0505] text-[#e5d5a3] border border-[#e5d5a3]/30 z-20 transition-colors">
          <HeartIcon className={`h-4 w-4 ${isWishlisted ? "fill-red-600 text-red-600" : ""}`} filled={isWishlisted} />
        </button>
        <div className="absolute inset-x-0 bottom-0 z-20 translate-y-full transition-transform duration-300 group-hover:translate-y-0">
             <button onClick={(e) => { e.preventDefault(); onAddToCart(product); setAddedEffect(true); setTimeout(() => setAddedEffect(false), 1500); }} className="w-full bg-[#e5d5a3] py-3 font-sans text-xs font-bold uppercase tracking-widest text-[#1a0505] hover:bg-white flex items-center justify-center gap-2">
                <ShoppingBagIcon className="h-4 w-4" /> {addedEffect ? "Added!" : "Add to Cart"}
            </button>
        </div>
      </div>
      <div className="flex flex-1 flex-col gap-2 p-4 bg-[#2a0808]">
        <Link href={`/product/${product.id}`} className="hover:text-white transition-colors">
            <h3 className="font-serif text-lg font-medium tracking-wide text-[#e5d5a3]">{product.name}</h3>
        </Link>
        <p className="font-sans text-base font-bold text-white/80">₹{displayPrice}</p>
      </div>
    </article>
  )
}

function SearchContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const query = searchParams.get('q') || ""
  
  const [products, setProducts] = useState<any[]>([])
  const [cart, setCart] = useState<any[]>([])
  const [wishlist, setWishlist] = useState<any[]>([])
  const [searchTermInput, setSearchTermInput] = useState(query)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function init() {
        if (!query) { setLoading(false); return }
        setLoading(true)
        try {
            const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`)
            const data = await res.json()
            setProducts(data || [])
        } catch (error) {
            console.error("Search API Error:", error)
        } finally {
            setLoading(false)
        }
        setCart(JSON.parse(localStorage.getItem('cart') || '[]'))
        setWishlist(JSON.parse(localStorage.getItem('wishlist') || '[]'))
    }
    init()
  }, [query])

  const handleNewSearch = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
          router.push(`/search?q=${searchTermInput}`)
      }
  }

  const addToCart = (product: any) => { 
      const existingItemIndex = cart.findIndex((item) => item.id === product.id)
      let newCart;
      if (existingItemIndex !== -1) {
          newCart = [...cart]
          newCart[existingItemIndex].quantity = (newCart[existingItemIndex].quantity || 0) + 1
      } else {
          newCart = [...cart, { ...product, quantity: 1 }]
      }
      setCart(newCart); 
      localStorage.setItem('cart', JSON.stringify(newCart))
  }
  const toggleWishlist = (product: any) => { const exists = wishlist.find(i => i.id === product.id); let newW; if(exists) newW = wishlist.filter(i=>i.id!==product.id); else newW=[...wishlist, product]; setWishlist(newW); localStorage.setItem('wishlist', JSON.stringify(newW)); }

  return (
    <div className="min-h-screen bg-[#1a0505] text-[#e5d5a3] font-sans flex flex-col">
      <header className="sticky top-0 z-40 border-b border-[#e5d5a3]/10 bg-[#1a0505]/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 lg:px-8">
          <Link href="/" className="font-serif text-2xl font-bold tracking-[0.2em] lg:text-3xl text-gradient bg-clip-text text-transparent bg-gradient-to-r from-[#e5d5a3] via-[#fbf5e6] to-[#c5a059] text-[#e5d5a3]">LOTUS</Link>
          <div className="hidden flex-1 justify-center px-12 md:flex">
            <div className="relative w-full max-w-md group">
              <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#e5d5a3]/40" />
              <input 
                type="text" 
                placeholder="Search treasures..." 
                className="w-full rounded-sm border border-[#e5d5a3]/20 bg-[#2a0808] py-2 pl-10 pr-4 text-sm text-[#e5d5a3] outline-none focus:border-[#c5a059]"
                value={searchTermInput}
                onChange={(e) => setSearchTermInput(e.target.value)}
                onKeyDown={handleNewSearch}
              />
            </div>
          </div>
          <nav className="flex items-center gap-5 text-[#e5d5a3]">
             <Link href="/" className="hover:text-white"><HeartIcon /></Link>
             <Link href="/cart" className="hover:text-white"><ShoppingBagIcon /></Link>
             <UserIcon />
          </nav>
        </div>
      </header>
      <div className="flex-1 max-w-7xl mx-auto w-full p-8 md:p-16">
        <div className="mb-12">
            <p className="text-[#e5d5a3]/50 text-xs uppercase tracking-widest mb-2">Search Results</p>
            <h1 className="font-serif text-3xl text-[#f4e4bc]">"{query}"</h1>
        </div>
        {loading ? (
             <div className="py-20 text-center"><p className="text-[#e5d5a3]/50 animate-pulse">Consulting the royal archives...</p></div>
        ) : products.length === 0 ? (
            <div className="py-20 text-center border border-dashed border-[#e5d5a3]/20 rounded bg-[#2a0808]/20 flex flex-col items-center gap-6">
                <p className="text-[#e5d5a3]/40 font-serif text-xl">No royal treasures found matching "{query}".</p>
                <Link href="/" className="bg-[#e5d5a3] px-8 py-3 font-sans text-xs font-bold uppercase tracking-widest text-[#1a0505] hover:bg-white transition-all rounded">Return Home</Link>
            </div>
        ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                {products.map((product) => (
                    <ProductCard key={product.id} product={product} onAddToCart={addToCart} isWishlisted={wishlist.some(item => item.id === product.id)} onToggleWishlist={toggleWishlist} />
                ))}
            </div>
        )}
      </div>
    </div>
  )
}

export default function SearchPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-[#1a0505] flex items-center justify-center text-[#c5a059]">Searching...</div>}>
            <SearchContent />
        </Suspense>
    )
}