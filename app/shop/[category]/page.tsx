'use client'
import { useState, useEffect, useRef } from "react"
import { createClient } from '@supabase/supabase-js'
import { useParams, useRouter, useSearchParams } from 'next/navigation' 
import Link from 'next/link'
import Script from 'next/script'

// CONFIGURATION
const supabaseUrl = "https://fwyliqsazdyprlkemavu.supabase.co"
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ3eWxpcXNhemR5cHJsa2VtYXZ1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAzOTg2MzIsImV4cCI6MjA4NTk3NDYzMn0.dXkx1pEtiZ5uwcQJgisJs14ZyUJTuz-SomMCeZv-jbE"
const supabase = createClient(supabaseUrl, supabaseKey)

const PREDICTED_CATEGORIES = [
    { name: "Necklaces", slug: "necklaces" },
    { name: "Earrings", slug: "earrings" },
    { name: "Bangles", slug: "bangles" },
    { name: "Bridal Sets", slug: "bridal" },
    { name: "Rings", slug: "rings" }
]

// ICONS
function SearchIcon({ className = "h-5 w-5" }: { className?: string }) { return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M11 19a8 8 0 100-16 8 8 0 000 16z" /></svg> }
function HeartIcon({ className = "h-5 w-5", filled = false }: { className?: string; filled?: boolean }) { return <svg className={className} fill={filled ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" /></svg> }
function ShoppingBagIcon({ className = "h-5 w-5" }: { className?: string }) { return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4zM3 6h18M16 10a4 4 0 01-8 0" /></svg> }
function UserIcon({ className = "h-5 w-5" }: { className?: string }) { return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2M12 3a4 4 0 100 8 4 4 0 000-8z" /></svg> }
function XIcon({ className = "h-5 w-5" }: { className?: string }) { return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M18 6L6 18M6 6l12 12" /></svg> }
function TrashIcon({ className = "h-4 w-4" }: { className?: string }) { return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg> }
function ArrowUpRight({ className = "h-3 w-3" }: { className?: string }) { return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 19.5l15-15m0 0H8.25m11.25 0v11.25" /></svg> }
function CheckIcon({ className = "h-5 w-5" }: { className?: string }) { return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg> }

// PRODUCT CARD
function ProductCard({ product, onAddToCart, isWishlisted, onToggleWishlist }: any) {
  const [addedEffect, setAddedEffect] = useState(false)
  const [imgLoaded, setImgLoaded] = useState(false)
  const [isGlittering, setIsGlittering] = useState(false)

  const handleWishlistClick = (e: React.MouseEvent) => {
      e.preventDefault(); 
      if (!isWishlisted) {
          setIsGlittering(true);
          setTimeout(() => setIsGlittering(false), 700); 
      }
      onToggleWishlist(product);
  }

  return (
    <article className="group relative flex flex-col overflow-hidden bg-[#2a0808] border border-[#e5d5a3]/20 transition-all duration-300 hover:border-[#e5d5a3]/60 hover:shadow-2xl rounded">
      <div className="relative aspect-[3/4] overflow-hidden bg-[#1a0505] flex items-center justify-center rounded-t group cursor-pointer">
        <Link href={`/product/${product.id}`} className="absolute inset-0 z-0">
            {product.image_url ? (
                <img 
                    src={product.image_url} 
                    alt={product.name} 
                    onLoad={() => setImgLoaded(true)}
                    className={`h-full w-full object-cover transition-transform duration-500 group-hover:scale-105 ${imgLoaded ? 'image-loaded' : 'image-loading'}`} 
                />
            ) : (
                <div className="flex flex-col items-center justify-center text-[#e5d5a3]/30 h-full"><span className="font-serif text-lg tracking-widest">IMAGE</span></div>
            )}
        </Link>

        {product.id === 1 && <span className="absolute left-3 top-3 bg-[#e5d5a3] px-3 py-1 font-sans text-[10px] font-bold uppercase text-[#1a0505] rounded-sm z-10">BESTSELLER</span>}
        
        <button onClick={handleWishlistClick} className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-[#1a0505]/60 backdrop-blur-sm hover:bg-[#e5d5a3] hover:text-[#1a0505] text-[#e5d5a3] border border-[#e5d5a3]/30 z-20 transition-colors">
            {isGlittering && (
                <>
                    <i className="heart-particle p-1 animate-heart-burst hp-red">♥</i><i className="heart-particle p-2 animate-heart-burst hp-gold">♥</i><i className="heart-particle p-3 animate-heart-burst hp-red">♥</i><i className="heart-particle p-4 animate-heart-burst hp-gold">♥</i>
                    <i className="heart-particle p-5 animate-heart-burst hp-red">♥</i><i className="heart-particle p-6 animate-heart-burst hp-gold">♥</i><i className="heart-particle p-7 animate-heart-burst hp-red">♥</i><i className="heart-particle p-8 animate-heart-burst hp-gold">♥</i>
                    <i className="heart-particle p-9 animate-heart-burst hp-gold">♥</i><i className="heart-particle p-10 animate-heart-burst hp-red">♥</i><i className="heart-particle p-11 animate-heart-burst hp-gold">♥</i><i className="heart-particle p-12 animate-heart-burst hp-red">♥</i>
                </>
            )}
            <HeartIcon className={`h-4 w-4 relative z-10 ${isWishlisted ? "fill-red-600 text-red-600" : ""}`} filled={isWishlisted} />
        </button>

        <div className="absolute inset-x-0 bottom-0 z-20 translate-y-full transition-transform duration-300 group-hover:translate-y-0">
            <button 
                onClick={(e) => { 
                    e.preventDefault(); 
                    onAddToCart(product); 
                    setAddedEffect(true); 
                    setTimeout(() => setAddedEffect(false), 2000); 
                }} 
                className={`w-full py-3 font-sans text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2 transition-all duration-300 ${addedEffect ? "bg-green-700 text-white" : "bg-[#e5d5a3] text-[#1a0505] hover:bg-white"}`}
            >
                {addedEffect ? (
                    <div className="flex items-center gap-2"><CheckIcon className="h-5 w-5 animate-check" /> <span className="animate-pulse">Added</span></div>
                ) : (
                    <><ShoppingBagIcon className="h-4 w-4" /> Add to Cart</>
                )}
            </button>
        </div>
      </div>
      
      <div className="flex flex-1 flex-col gap-2 p-4 bg-[#2a0808]">
        <Link href={`/product/${product.id}`} className="hover:text-white transition-colors">
            <h3 className="font-serif text-lg font-medium tracking-wide text-[#e5d5a3]">{product.name}</h3>
        </Link>
        <p className="font-sans text-base font-bold text-white/80">₹{product.price.toLocaleString("en-IN")}</p>
      </div>
    </article>
  )
}

// CATEGORY PAGE
export default function CategoryPage() {
  const router = useRouter()
  const params = useParams()
  const searchParams = useSearchParams()
  
  const categoryRaw = params?.category
  const category = Array.isArray(categoryRaw) ? categoryRaw[0] : categoryRaw || "Collection"
  const searchQuery = searchParams.get('q')
  
  // 🌟 FETCH PARAMS FOR RECOMMENDATIONS
  const sourceId = searchParams.get('sourceId')
  const originalCat = searchParams.get('cat')
  const isFallback = searchParams.get('fallback') === 'true'

  // 🌟 TITLE LOGIC
  let title = "Collection"
  if (category === 'search' && searchQuery) {
      title = `Results for "${searchQuery}"`
  } else if (category === 'recommendations') {
      title = "You Might Also Like"
  } else if (category === 'all') {
      title = "All Treasures" 
  } else if (category !== 'search') {
      title = category.charAt(0).toUpperCase() + category.slice(1) + " Collection"
  }

  const [products, setProducts] = useState<any[]>([])
  const [cart, setCart] = useState<any[]>([])
  const [wishlist, setWishlist] = useState<any[]>([])
  const [user, setUser] = useState<any>(null)
  
  const [isCartOpen, setIsCartOpen] = useState(false)
  const [isWishlistOpen, setIsWishlistOpen] = useState(false)

  const [searchTerm, setSearchTerm] = useState("")
  const [suggestions, setSuggestions] = useState<any[]>([])
  const searchRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const fetchSuggestions = async () => {
        if (searchTerm.length < 2) { setSuggestions([]); return }
        const termLower = searchTerm.toLowerCase()
        const categoryMatches = PREDICTED_CATEGORIES.filter(cat => cat.name.toLowerCase().includes(termLower)).map(cat => ({ type: 'category', ...cat }))
        const { data: productMatches } = await supabase.from('products').select('id, name, category, image_url').or(`name.ilike.%${searchTerm}%,category.ilike.%${searchTerm}%`).limit(4)
        const finalSuggestions = [...categoryMatches, ...(productMatches || []).map(p => ({ type: 'product', ...p }))]
        setSuggestions(finalSuggestions)
    }
    const timeoutId = setTimeout(fetchSuggestions, 150)
    return () => clearTimeout(timeoutId)
  }, [searchTerm])

  const handleSearchKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && searchTerm.trim()) {
      router.push(`/shop/search?q=${encodeURIComponent(searchTerm.trim())}`)
      setSuggestions([]) 
    }
  }

  useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => { if (searchRef.current && !searchRef.current.contains(event.target as Node)) { setSuggestions([]) } }
      document.addEventListener("mousedown", handleClickOutside); return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  // 🌟 PAGE INIT (UPDATED TO HANDLE RECOMMENDATIONS)
  useEffect(() => {
    async function init() {
        const { data: { session } } = await supabase.auth.getSession()
        if (session) setUser(session.user)

        let query = supabase.from('products').select('*')

        // 🌟 SCENARIO 1: SEARCH MODE
        if (category === 'search' && searchQuery) {
            query = query.or(`name.ilike.%${searchQuery}%,category.ilike.%${searchQuery}%`)
        }
        // 🌟 SCENARIO 2: RECOMMENDATIONS (THE FIX)
        else if (category === 'recommendations') {
             // If NOT a fallback (means we found matching category items), filter by original category
             if (!isFallback && originalCat) {
                 query = query.eq('category', originalCat)
             }
             // ALWAYS exclude the source ID so we don't show what the user just saw
             if (sourceId) {
                 query = query.neq('id', sourceId)
             }
        }
        // 🌟 SCENARIO 3: SPECIFIC CATEGORY
        else if (category && category.toLowerCase() !== 'all' && category.toLowerCase() !== 'search') {
             let queryTerm = category
             if (category.toLowerCase().endsWith('s')) {
                queryTerm = category.slice(0, -1) 
             }
             query = query.ilike('category', `%${queryTerm}%`)
        }
        
        const { data } = await query
        setProducts(data || [])

        const rawCart = JSON.parse(localStorage.getItem('cart') || '[]')
        setCart(rawCart)
        const storedWishlist = JSON.parse(localStorage.getItem('wishlist') || '[]')
        setWishlist(storedWishlist)
    }
    init()
  }, [category, searchQuery, sourceId]) // 🌟 Re-run when sourceId changes

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

  const updateQuantity = (index: number, change: number) => {
    const newCart = [...cart]
    const item = newCart[index]
    const currentQty = (item.quantity !== undefined) ? item.quantity : 1
    const newQty = currentQty + change
    if (newQty < 0) return 
    item.quantity = newQty
    setCart(newCart)
    localStorage.setItem('cart', JSON.stringify(newCart))
  }

  const removeFromCart = (idx: number) => { 
      const newCart = cart.filter((_, i) => i !== idx)
      setCart(newCart)
      localStorage.setItem('cart', JSON.stringify(newCart))
  }

  const toggleWishlist = (product: any) => {
    const exists = wishlist.find(i => i.id === product.id)
    let newWishlist;
    if (exists) { newWishlist = wishlist.filter(i => i.id !== product.id) } 
    else { newWishlist = [...wishlist, product] }
    setWishlist(newWishlist)
    localStorage.setItem('wishlist', JSON.stringify(newWishlist))
  }

  const cartTotal = cart.reduce((t, i) => t + (i.price * (i.quantity || 1)), 0)

  return (
    <div className="min-h-screen bg-[#1a0505] text-[#e5d5a3] font-sans flex flex-col">
      <header className="sticky top-0 z-40 border-b border-[#e5d5a3]/10 bg-[#1a0505]/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 lg:px-8">
          <Link href="/" className="flex items-center gap-2">
            <span className="font-serif text-2xl font-bold tracking-[0.2em] lg:text-3xl text-gradient bg-clip-text text-transparent bg-gradient-to-r from-[#e5d5a3] via-[#fbf5e6] to-[#c5a059] text-[#e5d5a3]">LOTUS</span>
          </Link>

          <div className="hidden flex-1 justify-center px-12 md:flex">
            <div className="relative w-full max-w-md group" ref={searchRef}>
              <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#e5d5a3]/40" />
              <input 
                type="text" 
                placeholder="Search..." 
                className="w-full rounded-sm border border-[#e5d5a3]/20 bg-[#2a0808] py-2 pl-10 pr-4 text-sm text-[#e5d5a3] outline-none focus:border-[#c5a059] transition-all"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={handleSearchKey}
                onFocus={() => { if(searchTerm.length >=2) setSuggestions(suggestions) }}
              />
              {suggestions.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-[#1a0505] border border-[#e5d5a3]/20 rounded shadow-2xl z-50 overflow-hidden divide-y divide-[#e5d5a3]/10">
                      {suggestions.map((item, idx) => (
                          <div key={idx}>
                              {item.type === 'category' ? (
                                  <Link href={`/shop/${item.slug}`} className="flex items-center gap-3 p-3 hover:bg-[#2a0808] transition-colors group/item" onClick={() => { setSuggestions([]); setSearchTerm("") }}>
                                      <div className="h-8 w-8 flex items-center justify-center text-[#c5a059]"><SearchIcon className="h-4 w-4" /></div>
                                      <div className="flex-1"><p className="text-sm font-bold text-[#e5d5a3] group-hover/item:text-white capitalize">{item.name}</p><p className="text-[10px] text-[#e5d5a3]/50">Search in Categories</p></div><ArrowUpRight className="h-3 w-3 text-[#e5d5a3]/30" />
                                  </Link>
                              ) : (
                                  <Link href={`/product/${item.id}`} className="flex items-center gap-3 p-3 hover:bg-[#2a0808] transition-colors group/item" onClick={() => { setSuggestions([]); setSearchTerm("") }}>
                                      <div className="h-10 w-10 bg-[#2a0808] rounded overflow-hidden flex-shrink-0 border border-[#e5d5a3]/10">{item.image_url && <img src={item.image_url} className="h-full w-full object-cover" />}</div>
                                      <div className="flex-1"><p className="text-sm text-[#e5d5a3] group-hover/item:text-white truncate">{item.name}</p></div>
                                  </Link>
                              )}
                          </div>
                      ))}
                      <div className="p-2 text-center bg-[#2a0808]/50"><button onClick={() => { router.push(`/shop/search?q=${searchTerm}`); setSuggestions([]) }} className="text-xs text-[#e5d5a3]/60 hover:text-[#c5a059] transition-colors">See all results for "{searchTerm}"</button></div>
                  </div>
              )}
            </div>
          </div>

          <nav className="flex items-center gap-5 text-[#e5d5a3]">
            <button className="hidden md:block hover:text-white relative" onClick={() => setIsWishlistOpen(true)}>
              <HeartIcon />
              {wishlist.length > 0 && <span className="absolute -right-1.5 -top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-600 text-[10px] font-bold text-white">{wishlist.length}</span>}
            </button>
            <button className="relative hover:text-white transition-colors" onClick={() => setIsCartOpen(true)}>
              <ShoppingBagIcon />
              {cart.length > 0 && <span className="absolute -right-1.5 -top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-[#c5a059] text-[10px] font-bold text-[#1a0505]">{cart.length}</span>}
            </button>
            <button className="hidden md:block hover:text-white transition-colors">
                {user ? <div className="h-6 w-6 rounded-full bg-[#e5d5a3] text-[#1a0505] flex items-center justify-center text-xs font-bold" title={user.email}>{user.email?.charAt(0).toUpperCase()}</div> : <UserIcon />}
            </button>
          </nav>
        </div>
      </header>

      {/* SIDEBARS */}
      <div className={`fixed inset-0 z-50 bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${isWishlistOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} onClick={() => setIsWishlistOpen(false)} />
      <div className={`fixed top-0 right-0 z-50 h-full w-full max-w-sm bg-[#1a0505] border-l border-[#e5d5a3]/20 shadow-2xl transition-transform duration-300 transform ${isWishlistOpen ? 'translate-x-0' : 'translate-x-full'} flex flex-col`}>
            <div className="flex items-center justify-between p-6 border-b border-[#e5d5a3]/10 pb-4">
                <h2 className="font-serif text-xl font-bold tracking-wide text-[#f4e4bc]">Your Favorites</h2>
                <button onClick={() => setIsWishlistOpen(false)} className="text-[#e5d5a3]/60 hover:text-white"><XIcon className="w-6 h-6" /></button>
            </div>
            <div className="flex-1 overflow-y-auto space-y-4 p-6">
                {wishlist.length === 0 ? <p className="text-center text-[#e5d5a3]/40 italic mt-10">No favorites yet.</p> : 
                wishlist.reverse().slice(0, 5).map((item) => ( 
                    <div key={item.id} className="flex gap-4 p-2 border-b border-[#e5d5a3]/10 items-center">
                        <div className="h-14 w-14 bg-[#2a0808] rounded overflow-hidden"><img src={item.image_url} className="h-full w-full object-cover" /></div>
                        <div className="flex-1"><p className="text-sm text-[#e5d5a3] font-serif">{item.name}</p><p className="text-xs text-[#e5d5a3]/60">₹{item.price.toLocaleString("en-IN")}</p></div>
                        <div className="flex gap-2 items-center">
                            <button onClick={() => addToCart(item)} className="text-[10px] bg-[#e5d5a3] text-black px-2 py-1 font-bold uppercase hover:bg-white rounded tracking-wider">Add</button>
                            <button onClick={() => toggleWishlist(item)} className="text-[#e5d5a3]/40 hover:text-red-400 transition-colors p-1" title="Remove"><XIcon className="h-4 w-4" /></button>
                        </div>
                    </div>
                ))}
            </div>
            <div className="mt-auto p-6 border-t border-[#e5d5a3]/10">
                 <Link href="/wishlist" className="block w-full text-center border border-[#e5d5a3]/30 py-3 font-sans text-xs font-bold uppercase tracking-widest text-[#e5d5a3] hover:border-[#e5d5a3] hover:text-white transition-colors rounded">View Full Wishlist</Link>
            </div>
      </div>

      <div className={`fixed inset-0 z-50 bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${isCartOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} onClick={() => setIsCartOpen(false)} />
      <div className={`fixed top-0 right-0 z-50 h-full w-full max-w-sm bg-[#2a0808] border-l border-[#e5d5a3]/20 shadow-2xl transition-transform duration-300 transform ${isCartOpen ? 'translate-x-0' : 'translate-x-full'} flex flex-col`}>
            <div className="flex items-center justify-between p-6 border-b border-[#e5d5a3]/10 pb-4">
                <h2 className="font-serif text-xl font-bold tracking-wide text-[#f4e4bc]">Your Bag ({cart.length})</h2>
                <button onClick={() => setIsCartOpen(false)} className="text-[#e5d5a3]/60 hover:text-white"><XIcon className="w-6 h-6" /></button>
            </div>
            <div className="flex-1 overflow-y-auto space-y-4 p-6">
                {cart.length === 0 ? <div className="text-center py-10 text-[#e5d5a3]/40 font-sans italic">Your royal bag is empty.</div> : cart.map((item, idx) => (
                    <div key={idx} className="flex gap-4 bg-[#1a0505]/50 p-3 rounded border border-[#e5d5a3]/10">
                        <div className="h-16 w-16 bg-[#1a0505] flex-shrink-0 overflow-hidden rounded-sm border border-[#e5d5a3]/10"><img src={item.image_url} className="h-full w-full object-cover" /></div>
                        <div className="flex-1 flex flex-col justify-between">
                            <div><h4 className="font-serif text-sm text-[#e5d5a3] leading-tight">{item.name}</h4><p className="text-xs text-[#c5a059] mt-1 font-bold">₹{item.price.toLocaleString("en-IN")}</p></div>
                            <div className="flex items-center gap-3 bg-[#2a0808] border border-[#e5d5a3]/20 w-fit px-2 py-0.5 rounded mt-2">
                                <button onClick={() => updateQuantity(idx, -1)} className="text-[#e5d5a3] hover:text-white text-xs px-1">-</button>
                                <span className="text-xs font-bold text-[#f4e4bc]">{item.quantity !== undefined ? item.quantity : 1}</span>
                                <button onClick={() => updateQuantity(idx, 1)} className="text-[#e5d5a3] hover:text-white text-xs px-1">+</button>
                            </div>
                        </div>
                        <button onClick={() => removeFromCart(idx)} className="self-start text-[#e5d5a3]/40 hover:text-red-400 transition-colors"><TrashIcon /></button>
                    </div>
                ))}
            </div>
            <div className="mt-auto p-6 bg-[#2a0808] border-t border-[#e5d5a3]/20">
                <div className="flex justify-between mb-4 text-[#f4e4bc] font-bold"><span>Total</span><span>₹{cartTotal.toLocaleString("en-IN")}</span></div>
                <Link href="/checkout" className="block w-full text-center bg-[#e5d5a3] py-3 font-sans text-xs font-bold uppercase tracking-widest text-[#1a0505] hover:bg-white transition-colors shadow-lg rounded">Checkout & Pay</Link>
            </div>
      </div>

      <div className="flex-1 max-w-7xl mx-auto w-full p-8 md:p-16 relative">
        {/* 🌟 BACK BUTTON ADDED HERE */}
        <button onClick={() => router.back()} className="absolute top-8 left-8 text-[#e5d5a3]/60 hover:text-white text-sm transition-colors mb-4 flex items-center gap-1">
            ← Back
        </button>

        <div className="mb-20 text-center">
          <span className="mb-3 inline-block font-sans text-xs font-bold uppercase tracking-[0.3em] text-[#e5d5a3]/40">Handpicked Treasures for your royal elegance</span>
          <h1 className="font-serif text-4xl md:text-5xl font-medium tracking-wide text-[#f4e4bc]">{title}</h1>
          <div className="mx-auto mt-6 h-px w-24 bg-gradient-to-r from-transparent via-[#c5a059] to-transparent" />
        </div>

        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {products.length === 0 ? (
            <div className="col-span-4 py-20 text-center border border-dashed border-[#e5d5a3]/20 rounded bg-[#2a0808]/50 flex flex-col items-center gap-6">
                <p className="text-[#e5d5a3]/50 font-serif text-lg">No treasures found in this collection.</p>
                <Link href="/" className="bg-[#e5d5a3] px-8 py-3 font-sans text-xs font-bold uppercase tracking-widest text-[#1a0505] hover:bg-white transition-all rounded">
                    Return Home
                </Link>
            </div>
          ) : (
            products.map((product) => (
              <ProductCard key={product.id} product={product} onAddToCart={addToCart} isWishlisted={wishlist.some(item => item.id === product.id)} onToggleWishlist={toggleWishlist} />
            ))
          )}
        </div>
      </div>

      <footer className="bg-[#0f0303] text-[#e5d5a3] border-t border-[#e5d5a3]/10 py-12 text-center text-xs">
        <p className="text-[#e5d5a3]/30">© 2026 LOTUS Jewelry.</p>
      </footer>
    </div>
  )
}