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
function FilterIcon({ className = "h-5 w-5" }: { className?: string }) { return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" /></svg> }

// 🌟 PRODUCT CARD 
function ProductCard({ product, onAddToCart, isWishlisted, onToggleWishlist, index = 0 }: any) {
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
    <article 
        className="group relative flex flex-col overflow-hidden bg-[#2a0808] border border-[#e5d5a3]/20 rounded transition-all duration-500 ease-out hover:-translate-y-2 hover:z-20 hover:shadow-[0_15px_40px_rgba(197,160,89,0.15)] hover:border-[#c5a059]/50 animate-fade-up-stagger"
        style={{ animationDelay: `${index * 100}ms` }}
    >
      <div className="relative aspect-[3/4] overflow-hidden bg-[#1a0505] flex items-center justify-center rounded-t cursor-pointer">
        <Link href={`/product/${product.id}`} className="absolute inset-0 z-0">
            {product.image_url ? (
                <img 
                    src={product.image_url} 
                    alt={product.name} 
                    onLoad={() => setImgLoaded(true)}
                    className={`h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105 ${imgLoaded ? 'opacity-100' : 'opacity-0 blur-sm'} transition-all`} 
                />
            ) : (
                <div className="flex flex-col items-center justify-center text-[#e5d5a3]/30 h-full"><span className="font-serif text-lg tracking-widest">IMAGE</span></div>
            )}
        </Link>

        {product.id === 1 && <span className="absolute left-3 top-3 bg-[#e5d5a3] px-3 py-1 font-sans text-[10px] font-bold uppercase text-[#1a0505] rounded-sm z-10 shadow-lg">BESTSELLER</span>}
        
        <button onClick={handleWishlistClick} className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-[#1a0505]/60 backdrop-blur-md hover:bg-[#e5d5a3] hover:text-[#1a0505] text-[#e5d5a3] border border-[#e5d5a3]/30 z-20 transition-colors duration-300">
            {isGlittering && (
                <>
                    <i className="heart-particle p-1 animate-heart-burst hp-red">♥</i><i className="heart-particle p-2 animate-heart-burst hp-gold">♥</i><i className="heart-particle p-3 animate-heart-burst hp-red">♥</i><i className="heart-particle p-4 animate-heart-burst hp-gold">♥</i>
                    <i className="heart-particle p-5 animate-heart-burst hp-red">♥</i><i className="heart-particle p-6 animate-heart-burst hp-gold">♥</i><i className="heart-particle p-7 animate-heart-burst hp-red">♥</i><i className="heart-particle p-8 animate-heart-burst hp-gold">♥</i>
                    <i className="heart-particle p-9 animate-heart-burst hp-gold">♥</i><i className="heart-particle p-10 animate-heart-burst hp-red">♥</i><i className="heart-particle p-11 animate-heart-burst hp-gold">♥</i><i className="heart-particle p-12 animate-heart-burst hp-red">♥</i>
                </>
            )}
            <HeartIcon className={`h-4 w-4 relative z-10 transition-transform duration-300 group-hover:scale-110 ${isWishlisted ? "fill-red-600 text-red-600" : ""}`} filled={isWishlisted} />
        </button>

        <div className="absolute inset-x-0 bottom-0 z-20 translate-y-full transition-transform duration-300 ease-out group-hover:translate-y-0">
            <button 
                onClick={(e) => { 
                    e.preventDefault(); 
                    onAddToCart(product); 
                    setAddedEffect(true); 
                    setTimeout(() => setAddedEffect(false), 2000); 
                }} 
                className={`w-full py-3 font-sans text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2 transition-all duration-300 ${addedEffect ? "bg-green-700 text-white" : "bg-[#e5d5a3]/90 backdrop-blur text-[#1a0505] hover:bg-white"}`}
            >
                {addedEffect ? (
                    <div className="flex items-center gap-2"><CheckIcon className="h-5 w-5 animate-check" /> <span className="animate-pulse">Added</span></div>
                ) : (
                    <><ShoppingBagIcon className="h-4 w-4" /> Add to Cart</>
                )}
            </button>
        </div>
      </div>
      
      <div className="flex flex-1 flex-col gap-2 p-5 bg-gradient-to-b from-[#2a0808] to-[#1a0505]">
        <Link href={`/product/${product.id}`} className="hover:text-[#c5a059] transition-colors duration-300">
            <h3 className="font-serif text-lg font-medium tracking-wide text-[#e5d5a3]">{product.name}</h3>
        </Link>
        <p className="font-sans text-base font-bold text-[#f4e4bc]">₹{product.price.toLocaleString("en-IN")}</p>
      </div>
    </article>
  )
}

// MAIN CATEGORY PAGE
export default function CategoryPage() {
  const router = useRouter()
  const params = useParams()
  const searchParams = useSearchParams()
  
  const categoryRaw = params?.category
  const category = Array.isArray(categoryRaw) ? categoryRaw[0] : categoryRaw || "Collection"
  const searchQuery = searchParams.get('q')
  
  const sourceId = searchParams.get('sourceId')
  const originalCat = searchParams.get('cat')
  const isFallback = searchParams.get('fallback') === 'true'

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
  const [displayProducts, setDisplayProducts] = useState<any[]>([]) 
  const [isFiltering, setIsFiltering] = useState(true) 

  // Filter & Sort States
  const [sortOrder, setSortOrder] = useState('newest') 
  const [priceRange, setPriceRange] = useState('all') 
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false)

  const [cart, setCart] = useState<any[]>([])
  const [wishlist, setWishlist] = useState<any[]>([])
  const [user, setUser] = useState<any>(null)
  
  const [isCartOpen, setIsCartOpen] = useState(false)
  const [isWishlistOpen, setIsWishlistOpen] = useState(false)
  
  const [isLoginOpen, setIsLoginOpen] = useState(false)
  const [loadingLogin, setLoadingLogin] = useState(false)
  const [email, setEmail] = useState("")
  const [loginMessage, setLoginMessage] = useState("")

  const [searchTerm, setSearchTerm] = useState("")
  const [suggestions, setSuggestions] = useState<any[]>([])
  const searchRef = useRef<HTMLDivElement>(null)

  // 1. Fetch from DB
  useEffect(() => {
    async function init() {
        setIsFiltering(true)
        const { data: { session } } = await supabase.auth.getSession()
        if (session) setUser(session.user)

        let query = supabase.from('products').select('*')

        if (category === 'search' && searchQuery) {
            query = query.or(`name.ilike.%${searchQuery}%,category.ilike.%${searchQuery}%`)
        }
        else if (category === 'recommendations') {
             if (!isFallback && originalCat) query = query.eq('category', originalCat)
             if (sourceId) query = query.neq('id', sourceId)
        }
        else if (category && category.toLowerCase() !== 'all' && category.toLowerCase() !== 'search') {
             let queryTerm = category
             if (category.toLowerCase().endsWith('s')) { queryTerm = category.slice(0, -1) }
             query = query.ilike('category', `%${queryTerm}%`)
        }
        
        const { data } = await query
        const fetchedProducts = data || []
        
        setProducts(fetchedProducts)
        
        const rawCart = JSON.parse(localStorage.getItem('cart') || '[]')
        setCart(rawCart)
        const storedWishlist = JSON.parse(localStorage.getItem('wishlist') || '[]')
        setWishlist(storedWishlist)
    }
    init()
  }, [category, searchQuery, sourceId])

  // 2. Filter Engine
  useEffect(() => {
      setIsFiltering(true)
      let result = [...products]; 

      // Apply Price
      if (priceRange === 'under-500') result = result.filter(p => p.price < 500);
      else if (priceRange === '500-1500') result = result.filter(p => p.price >= 500 && p.price <= 1500);
      else if (priceRange === 'over-1500') result = result.filter(p => p.price > 1500);

      // Apply Sort
      if (sortOrder === 'price-asc') result.sort((a, b) => a.price - b.price);
      else if (sortOrder === 'price-desc') result.sort((a, b) => b.price - a.price);
      else if (sortOrder === 'newest') {
          result.sort((a, b) => {
              if (b.created_at && a.created_at) return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
              return b.id - a.id 
          }); 
      }

      setTimeout(() => {
          setDisplayProducts(result);
          setIsFiltering(false)
      }, 50)

  }, [products, sortOrder, priceRange]);


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

  const handleLogin = async (e: React.FormEvent) => { 
      e.preventDefault(); 
      setLoadingLogin(true); 
      const { error } = await supabase.auth.signInWithOtp({ email }); 
      if (error) { setLoginMessage("Error: " + error.message) } 
      else { setLoginMessage("Magic Link sent! Check your email.") } 
      setLoadingLogin(false) 
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
    <div className="min-h-screen bg-[#1a0505] text-[#e5d5a3] font-sans flex flex-col relative overflow-hidden">
      
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes fadeUpStagger {
          0% { opacity: 0; transform: translateY(30px) scale(0.98); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }
        .animate-fade-up-stagger {
          animation: fadeUpStagger 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          opacity: 0;
        }
        @keyframes pulseGlow {
          0%, 100% { box-shadow: 0 0 0 0 rgba(197, 160, 89, 0); }
          50% { box-shadow: 0 0 15px 2px rgba(197, 160, 89, 0.2); }
        }
        .animate-pulse-glow:hover {
          animation: pulseGlow 2s infinite;
        }
      `}} />

      <header className="sticky top-0 z-40 border-b border-[#e5d5a3]/10 bg-[#1a0505]/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 lg:px-8">
          <Link href="/" className="flex items-center gap-2">
            <span className="font-serif text-2xl font-bold tracking-[0.2em] lg:text-3xl text-gradient bg-clip-text text-transparent bg-gradient-to-r from-[#e5d5a3] via-[#fbf5e6] to-[#c5a059] text-[#e5d5a3]">LOTUS</span>
          </Link>

          <div className="hidden flex-1 justify-center px-12 md:flex">
            <div className="relative w-full max-w-md group" ref={searchRef}>
              <SearchIcon className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#e5d5a3]/40 group-focus-within:text-[#c5a059] transition-colors" />
              <input 
                type="text" 
                placeholder="Search..." 
                className="w-full rounded-full border border-[#e5d5a3]/20 bg-[#2a0808]/50 py-2.5 pl-12 pr-4 text-sm text-[#e5d5a3] outline-none focus:border-[#c5a059] focus:bg-[#2a0808] transition-all shadow-inner"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={handleSearchKey}
                onFocus={() => { if(searchTerm.length >=2) setSuggestions(suggestions) }}
              />
              {suggestions.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-3 bg-[#1a0505]/95 backdrop-blur-md border border-[#e5d5a3]/20 rounded-xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] z-50 overflow-hidden divide-y divide-[#e5d5a3]/10">
                      {suggestions.map((item, idx) => (
                          <div key={idx}>
                              {item.type === 'category' ? (
                                  <Link href={`/shop/${item.slug}`} className="flex items-center gap-3 p-4 hover:bg-[#2a0808] transition-colors group/item" onClick={() => { setSuggestions([]); setSearchTerm("") }}>
                                      <div className="h-8 w-8 flex items-center justify-center text-[#c5a059]"><SearchIcon className="h-4 w-4" /></div>
                                      <div className="flex-1"><p className="text-sm font-bold text-[#e5d5a3] group-hover/item:text-white capitalize">{item.name}</p><p className="text-[10px] text-[#e5d5a3]/50">Search in Categories</p></div><ArrowUpRight className="h-3 w-3 text-[#e5d5a3]/30 group-hover/item:text-[#c5a059] transition-colors" />
                                  </Link>
                              ) : (
                                  <Link href={`/product/${item.id}`} className="flex items-center gap-4 p-4 hover:bg-[#2a0808] transition-colors group/item" onClick={() => { setSuggestions([]); setSearchTerm("") }}>
                                      <div className="h-12 w-12 bg-[#2a0808] rounded-md overflow-hidden flex-shrink-0 border border-[#e5d5a3]/10">{item.image_url && <img src={item.image_url} className="h-full w-full object-cover" />}</div>
                                      <div className="flex-1"><p className="text-sm text-[#e5d5a3] group-hover/item:text-white truncate font-medium">{item.name}</p></div>
                                  </Link>
                              )}
                          </div>
                      ))}
                      <div className="p-3 text-center bg-[#2a0808]/50 hover:bg-[#2a0808] transition-colors"><button onClick={() => { router.push(`/shop/search?q=${searchTerm}`); setSuggestions([]) }} className="text-xs text-[#e5d5a3]/80 hover:text-[#c5a059] font-bold uppercase tracking-wider w-full h-full">See all results</button></div>
                  </div>
              )}
            </div>
          </div>

          <nav className="flex items-center gap-5 text-[#e5d5a3]">
            <button className="hidden md:block hover:text-white relative group" onClick={() => setIsWishlistOpen(true)}>
                <HeartIcon className="h-5 w-5" />
                {wishlist.length > 0 && <span className="absolute -right-1.5 -top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-600 text-[10px] font-bold text-white group-hover:scale-110 transition-transform">{wishlist.length}</span>}
            </button>
            <button className="relative hover:text-white transition-colors group" onClick={() => setIsCartOpen(true)}>
                <ShoppingBagIcon className="h-5 w-5" />
                {cart.length > 0 && <span className="absolute -right-1.5 -top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-[#c5a059] text-[10px] font-bold text-[#1a0505] group-hover:scale-110 transition-transform">{cart.length}</span>}
            </button>
            {user ? (
                <Link href="/account" className="hidden md:block hover:text-white transition-colors">
                    <div className="h-6 w-6 rounded-full bg-[#e5d5a3] text-[#1a0505] flex items-center justify-center text-xs font-bold" title={user.email}>{user.email?.charAt(0).toUpperCase()}</div>
                </Link>
            ) : (
                <button className="hidden md:block hover:text-white transition-colors" onClick={() => setIsLoginOpen(true)}>
                    <UserIcon className="h-5 w-5" />
                </button>
            )}
            <button className="md:hidden" onClick={() => setIsMobileFilterOpen(!isMobileFilterOpen)}>
                {isMobileFilterOpen ? <XIcon className="h-5 w-5" /> : <FilterIcon className="h-5 w-5" />}
            </button>
          </nav>
        </div>
      </header>

      {isLoginOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
              <div className="bg-[#2a0808] border border-[#e5d5a3]/30 p-8 w-full max-w-md shadow-2xl relative">
                  <button onClick={() => setIsLoginOpen(false)} className="absolute top-4 right-4 text-[#e5d5a3]/50 hover:text-white"><XIcon className="h-5 w-5" /></button>
                  <h2 className="font-serif text-2xl text-[#f4e4bc] mb-2 text-center">Member Login</h2>
                  <p className="text-center text-[#e5d5a3]/50 text-xs mb-6 uppercase tracking-widest">We will send a magic link to your email</p>
                  {!loginMessage ? (
                      <form onSubmit={handleLogin} className="space-y-4">
                          <input required type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="name@example.com" className="w-full bg-[#1a0505] border border-[#e5d5a3]/20 p-3 text-[#e5d5a3] outline-none focus:border-[#e5d5a3]" />
                          <button disabled={loadingLogin} className="w-full bg-[#e5d5a3] text-[#1a0505] py-3 font-bold uppercase tracking-widest hover:bg-white disabled:opacity-50">{loadingLogin ? "Sending..." : "Send Login Link"}</button>
                      </form>
                  ) : (
                      <div className="text-center text-green-400 p-4 border border-green-500/20 bg-green-500/10">{loginMessage}</div>
                  )}
              </div>
          </div>
      )}

      {/* 🌟 FULLY RESTORED WISHLIST SIDEBAR FROM HOMEPAGE 🌟 */}
      <div className={`fixed inset-0 z-50 bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${isWishlistOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} onClick={() => setIsWishlistOpen(false)} />
      <div className={`fixed top-0 right-0 z-50 h-full w-full max-w-sm bg-[#1a0505] border-l border-[#e5d5a3]/20 shadow-2xl transition-transform duration-300 transform ${isWishlistOpen ? 'translate-x-0' : 'translate-x-full'} flex flex-col`}>
          <div className="flex items-center justify-between p-6 border-b border-[#e5d5a3]/10 pb-4"><h2 className="font-serif text-xl font-bold tracking-wide text-[#f4e4bc]">Your Favorites</h2><button onClick={() => setIsWishlistOpen(false)} className="text-[#e5d5a3]/60 hover:text-white"><XIcon className="w-6 h-6" /></button></div>
          <div className="flex-1 overflow-y-auto space-y-4 p-6 [&::-webkit-scrollbar]:w-3.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-[#c5a059] [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:border-[3px] [&::-webkit-scrollbar-thumb]:border-solid [&::-webkit-scrollbar-thumb]:border-transparent [&::-webkit-scrollbar-thumb]:[background-clip:padding-box] hover:[&::-webkit-scrollbar-thumb]:bg-[#e5d5a3]">{wishlist.length === 0 ? <p className="text-center text-[#e5d5a3]/40 italic mt-10">No favorites yet.</p> : wishlist.reverse().slice(0, 5).map((item) => ( <div key={item.id} className="flex gap-4 p-2 border-b border-[#e5d5a3]/10 items-center"><div className="h-14 w-14 bg-[#2a0808] rounded overflow-hidden"><img src={item.image_url} className="h-full w-full object-cover" /></div><div className="flex-1"><p className="text-sm text-[#e5d5a3] font-serif">{item.name}</p><p className="text-xs text-[#e5d5a3]/60">₹{item.price.toLocaleString("en-IN")}</p></div><div className="flex gap-2 items-center"><button onClick={() => addToCart(item)} className="text-[10px] bg-[#e5d5a3] text-black px-2 py-1 font-bold uppercase hover:bg-white rounded tracking-wider">Add</button><button onClick={() => toggleWishlist(item)} className="text-[#e5d5a3]/40 hover:text-red-400 transition-colors p-1" title="Remove"><XIcon className="h-4 w-4" /></button></div></div>))}</div>
          <div className="mt-auto p-6 border-t border-[#e5d5a3]/10">
              <Link href="/wishlist" className="block w-full text-center bg-[#e5d5a3] py-3 font-sans text-xs font-bold uppercase tracking-widest text-[#1a0505] hover:bg-white transition-colors shadow-lg rounded">View Full Wishlist</Link>
          </div>
      </div>

      {/* 🌟 FULLY RESTORED CART SIDEBAR FROM HOMEPAGE 🌟 */}
      <div className={`fixed inset-0 z-50 bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${isCartOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} onClick={() => setIsCartOpen(false)} />
      <div className={`fixed top-0 right-0 z-50 h-full w-full max-w-sm bg-[#2a0808] border-l border-[#e5d5a3]/20 shadow-2xl transition-transform duration-300 transform ${isCartOpen ? 'translate-x-0' : 'translate-x-full'} flex flex-col`}>
          <div className="flex items-center justify-between p-6 border-b border-[#e5d5a3]/10 pb-4"><h2 className="font-serif text-xl font-bold tracking-wide text-[#f4e4bc]">Your Bag ({cart.length})</h2><button onClick={() => setIsCartOpen(false)} className="text-[#e5d5a3]/60 hover:text-white"><XIcon className="w-6 h-6" /></button></div>
          <div className="flex-1 overflow-y-auto space-y-4 p-6 [&::-webkit-scrollbar]:w-3.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-[#c5a059] [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:border-[3px] [&::-webkit-scrollbar-thumb]:border-solid [&::-webkit-scrollbar-thumb]:border-transparent [&::-webkit-scrollbar-thumb]:[background-clip:padding-box] hover:[&::-webkit-scrollbar-thumb]:bg-[#e5d5a3]">
              {cart.length === 0 ? <div className="text-center py-10 text-[#e5d5a3]/40 font-sans italic">Your royal bag is empty.</div> : cart.map((item, idx) => (<div key={idx} className="flex gap-4 bg-[#1a0505]/50 p-3 rounded border border-[#e5d5a3]/10"><div className="h-16 w-16 bg-[#1a0505] flex-shrink-0 overflow-hidden rounded-sm border border-[#e5d5a3]/10">{item.image_url && <img src={item.image_url} className="h-full w-full object-cover" />}</div><div className="flex-1 flex flex-col justify-between"><div><h4 className="font-serif text-sm text-[#e5d5a3] leading-tight">{item.name}</h4><p className="text-xs text-[#c5a059] mt-1 font-bold">₹{item.price.toLocaleString("en-IN")}</p></div><div className="flex items-center gap-3 bg-[#2a0808] border border-[#e5d5a3]/20 w-fit px-2 py-0.5 rounded mt-2"><button onClick={() => updateQuantity(idx, -1)} className="text-[#e5d5a3] hover:text-white text-xs px-1">-</button><span className="text-xs font-bold text-[#f4e4bc]">{item.quantity !== undefined ? item.quantity : 1}</span><button onClick={() => updateQuantity(idx, 1)} className="text-[#e5d5a3] hover:text-white text-xs px-1">+</button></div></div><button onClick={() => removeFromCart(idx)} className="self-start text-[#e5d5a3]/40 hover:text-red-400 transition-colors"><TrashIcon /></button></div>))}
          </div>
          <div className="mt-auto p-6 bg-[#2a0808] border-t border-[#e5d5a3]/20">
              <div className="flex justify-between mb-4 text-[#f4e4bc] font-bold"><span>Total</span><span>₹{cartTotal.toLocaleString("en-IN")}</span></div>
              <Link href="/cart" className="block w-full text-center bg-[#e5d5a3] py-3 font-sans text-xs font-bold uppercase tracking-widest text-[#1a0505] hover:bg-white transition-colors shadow-lg rounded">View Shopping Cart</Link>
          </div>
      </div>

      {/* 🌟 MAIN CONTENT AREA 🌟 */}
      <div className="flex-1 w-full px-4 py-8 md:px-8 lg:px-12 relative flex flex-col lg:flex-row gap-10 lg:gap-16">
        
        <div className="lg:hidden flex justify-between items-center w-full mb-2">
            <button onClick={() => router.back()} className="text-[#e5d5a3]/60 hover:text-white text-sm transition-colors flex items-center gap-1 font-medium">← Back</button>
            <button onClick={() => setIsMobileFilterOpen(!isMobileFilterOpen)} className="flex items-center gap-2 border border-[#e5d5a3]/30 px-5 py-2.5 rounded-full text-xs font-bold uppercase tracking-widest text-[#e5d5a3] hover:bg-[#2a0808] transition-all active:scale-95 shadow-lg">
                <FilterIcon /> Filters
            </button>
        </div>

        <aside className={`w-full lg:w-[260px] flex-shrink-0 lg:flex lg:flex-col gap-8 transition-all duration-300 ${isMobileFilterOpen ? 'block' : 'hidden lg:block'}`}>
            <div className="bg-[#2a0808]/30 border border-[#e5d5a3]/10 rounded-2xl p-6 lg:sticky lg:top-32 backdrop-blur-sm">
                
                <div className="flex justify-between items-center mb-8 border-b border-[#e5d5a3]/10 pb-4">
                    <h3 className="font-serif text-xl text-[#f4e4bc] tracking-wide">Filters</h3>
                    {(priceRange !== 'all' || sortOrder !== 'newest') && (
                        <button onClick={() => {setPriceRange('all'); setSortOrder('newest')}} className="text-[10px] text-[#c5a059] hover:text-white transition-colors uppercase tracking-widest font-bold">Clear All</button>
                    )}
                </div>

                <div className="mb-10 group">
                    <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#e5d5a3]/50 mb-4 flex items-center gap-2">
                        Sort By <span className="h-px bg-[#e5d5a3]/10 flex-1"></span>
                    </h4>
                    <div className="relative">
                        <select 
                            value={sortOrder} 
                            onChange={(e) => setSortOrder(e.target.value)}
                            className="w-full bg-[#1a0505] border border-[#e5d5a3]/20 p-3.5 rounded-lg text-sm text-[#e5d5a3] outline-none focus:border-[#c5a059] focus:shadow-[0_0_10px_rgba(197,160,89,0.2)] cursor-pointer appearance-none transition-all"
                        >
                            <option value="newest">Newest Arrivals</option>
                            <option value="price-asc">Price: Low to High</option>
                            <option value="price-desc">Price: High to Low</option>
                        </select>
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-[#e5d5a3]/50">▼</div>
                    </div>
                </div>

                <div>
                    <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#e5d5a3]/50 mb-5 flex items-center gap-2">
                        Price Range <span className="h-px bg-[#e5d5a3]/10 flex-1"></span>
                    </h4>
                    <div className="flex flex-col gap-4">
                        {[
                            { id: 'all', label: 'All Prices' },
                            { id: 'under-500', label: 'Under ₹500' },
                            { id: '500-1500', label: '₹500 - ₹1,500' },
                            { id: 'over-1500', label: 'Over ₹1,500' }
                        ].map((range) => (
                            <label 
                                key={range.id} 
                                className="flex items-center gap-4 cursor-pointer group"
                                onClick={() => setPriceRange(range.id)} 
                            >
                                <div className={`w-4 h-4 rounded-full border flex items-center justify-center transition-all duration-300 ${priceRange === range.id ? 'border-[#c5a059] shadow-[0_0_8px_rgba(197,160,89,0.4)]' : 'border-[#e5d5a3]/30 group-hover:border-[#e5d5a3]/80'}`}>
                                    <div className={`w-2 h-2 rounded-full bg-[#c5a059] transition-transform duration-300 cubic-bezier(0.34, 1.56, 0.64, 1) ${priceRange === range.id ? 'scale-100' : 'scale-0'}`}></div>
                                </div>
                                <span className={`text-sm transition-colors duration-300 ${priceRange === range.id ? 'text-[#f4e4bc] font-medium' : 'text-[#e5d5a3]/70 group-hover:text-[#e5d5a3]'}`}>{range.label}</span>
                            </label>
                        ))}
                    </div>
                </div>

            </div>
        </aside>

        <div className="flex-1 w-full min-w-0">
            <button onClick={() => router.back()} className="hidden lg:flex text-[#e5d5a3]/50 hover:text-white text-sm transition-colors mb-8 items-center gap-2 font-medium">
                <span className="text-lg leading-none mb-0.5">←</span> Back
            </button>

            <div className="mb-10 lg:mb-12">
                <span className="mb-3 inline-block font-sans text-[10px] font-bold uppercase tracking-[0.3em] text-[#e5d5a3]/40">Handpicked Treasures</span>
                
                <h1 className="font-serif text-3xl md:text-4xl font-medium tracking-wide text-[#f4e4bc] mb-6">{title}</h1>
                
                <div className="flex flex-wrap gap-3 items-center">
                    <span className="bg-[#2a0808] border border-[#e5d5a3]/20 px-4 py-1.5 rounded-full text-xs font-medium text-[#e5d5a3]/70 shadow-inner">
                        {displayProducts.length} Results
                    </span>
                    
                    {priceRange !== 'all' && (
                        <div className="bg-[#c5a059]/10 border border-[#c5a059]/40 pl-4 pr-1.5 py-1 rounded-full text-xs text-[#c5a059] flex items-center gap-2 animate-fade-in shadow-[0_0_15px_rgba(197,160,89,0.05)]">
                            <span className="font-medium tracking-wide">
                                {priceRange === 'under-500' ? 'Under ₹500' : priceRange === '500-1500' ? '₹500 - ₹1,500' : 'Over ₹1,500'}
                            </span>
                            <button 
                                onClick={(e) => { e.stopPropagation(); setPriceRange('all'); }} 
                                className="hover:bg-[#c5a059]/20 p-1.5 rounded-full transition-all duration-300 hover:rotate-90 cursor-pointer active:scale-90"
                                aria-label="Remove filter"
                            >
                                <XIcon className="h-3 w-3" />
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {!isFiltering && (
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {displayProducts.length === 0 ? (
                    <div className="col-span-full py-32 text-center border border-dashed border-[#e5d5a3]/20 rounded-2xl bg-[#2a0808]/30 flex flex-col items-center gap-6 animate-fade-in">
                        <div className="h-16 w-16 rounded-full bg-[#1a0505] border border-[#e5d5a3]/10 flex items-center justify-center text-[#e5d5a3]/30 mb-2">
                            <SearchIcon className="h-8 w-8" />
                        </div>
                        <p className="text-[#e5d5a3]/60 font-serif text-xl max-w-md">No royal treasures found matching your refined taste.</p>
                        <button onClick={() => {setPriceRange('all'); setSortOrder('newest')}} className="bg-[#e5d5a3] px-8 py-3.5 font-sans text-xs font-bold uppercase tracking-widest text-[#1a0505] hover:bg-white transition-all rounded shadow-lg hover:shadow-[0_0_20px_rgba(229,213,163,0.3)] animate-pulse-glow mt-4">
                            Clear Filters
                        </button>
                    </div>
                    ) : (
                    displayProducts.map((product, index) => (
                        <ProductCard key={product.id} index={index} product={product} onAddToCart={addToCart} isWishlisted={wishlist.some(item => item.id === product.id)} onToggleWishlist={toggleWishlist} />
                    ))
                    )}
                </div>
            )}
        </div>

      </div>

      <footer className="bg-[#0f0303] text-[#e5d5a3] border-t border-[#e5d5a3]/10 py-12 text-center text-xs mt-auto">
        <p className="text-[#e5d5a3]/30 tracking-widest uppercase">© 2026 LOTUS Jewelry. All Rights Reserved.</p>
      </footer>
    </div>
  )
}