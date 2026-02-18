'use client'

import { useState, useEffect, useRef } from "react"
import { createClient } from '@supabase/supabase-js'
import Script from 'next/script' 
import Link from 'next/link'
import { useRouter } from 'next/navigation'

// 1. CONFIGURATION
const supabaseUrl = "https://fwyliqsazdyprlkemavu.supabase.co"
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ3eWxpcXNhemR5cHJsa2VtYXZ1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAzOTg2MzIsImV4cCI6MjA4NTk3NDYzMn0.dXkx1pEtiZ5uwcQJgisJs14ZyUJTuz-SomMCeZv-jbE"
const supabase = createClient(supabaseUrl, supabaseKey)

// 🌟 MEGA MENU DATA STRUCTURE (Based on Mom's List)
const MEGA_MENU = [
    {
        name: "Neckwear",
        slug: "necklaces",
        items: [
            { name: "Necklaces", searchQuery: "Necklace", types: "Matte • Premium • Micro Plated" },
            { name: "Long Haram", searchQuery: "Haram", types: "Matte • Premium" },
            { name: "Chokers", searchQuery: "Choker", types: "Matte • Premium" },
            { name: "Attigai", searchQuery: "Attigai", types: "Micro Plated" },
            { name: "Chains", searchQuery: "Chain", types: "With/Without Pendant" }
        ]
    },
    {
        name: "Earrings",
        slug: "earrings",
        items: [
            { name: "Jhumkas & Studs", searchQuery: "Jhumka", types: "Matte • Premium" },
            { name: "Mattal", searchQuery: "Mattal", types: "Matte • Premium • Micro Plated" },
            { name: "Micro Plated Earrings", searchQuery: "Earring", types: "Gold Look" }
        ]
    },
    {
        name: "Bangles & Rings",
        slug: "bangles",
        items: [
            { name: "Bangles", searchQuery: "Bangle", types: "Matte • Premium • Micro Plated" },
            { name: "Finger Rings", searchQuery: "Ring", types: "Matte • Premium • Micro Plated" },
            { name: "Bracelets", searchQuery: "Bracelet", types: "Micro Plated" },
            { name: "Anklets", searchQuery: "Anklet", types: "Micro Plated" }
        ]
    },
    {
        name: "Bridal Collection",
        slug: "bridal",
        items: [
            { name: "Full Bridal Sets", searchQuery: "Bridal", types: "Matte • Premium" },
            { name: "Semi Bridal Sets", searchQuery: "Semi Bridal", types: "Matte • Premium" },
            { name: "Combo Sets", searchQuery: "Combo", types: "Matte • Premium" }
        ]
    },
    {
        name: "Accessories",
        slug: "accessories",
        items: [
            { name: "Hair Accessories", searchQuery: "Hair", types: "Matte • Premium" },
            { name: "Nethi Chutti", searchQuery: "Nethi", types: "Matte • Premium • Micro Plated" },
            { name: "Hip Chains", searchQuery: "Hip Chain", types: "Micro Plated" }
        ]
    }
]

// STATIC CATEGORIES (For Search Suggestions)
const PREDICTED_CATEGORIES = [
    { name: "Necklaces", slug: "necklaces" },
    { name: "Earrings", slug: "earrings" },
    { name: "Bangles", slug: "bangles" },
    { name: "Bridal Sets", slug: "bridal" },
    { name: "Rings", slug: "rings" }
]

// 2. ICONS
function SearchIcon({ className = "h-5 w-5" }: { className?: string }) { return <svg suppressHydrationWarning className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M11 19a8 8 0 100-16 8 8 0 000 16z" /></svg> }
function HeartIcon({ className = "h-5 w-5", filled = false }: { className?: string; filled?: boolean }) { return <svg suppressHydrationWarning className={className} fill={filled ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" /></svg> }
function ShoppingBagIcon({ className = "h-5 w-5" }: { className?: string }) { return <svg suppressHydrationWarning className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4zM3 6h18M16 10a4 4 0 01-8 0" /></svg> }
function CheckIcon({ className = "h-5 w-5" }: { className?: string }) { return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg> }
function UserIcon({ className = "h-5 w-5" }: { className?: string }) { return <svg suppressHydrationWarning className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2M12 3a4 4 0 100 8 4 4 0 000-8z" /></svg> }
function MenuIcon({ className = "h-5 w-5" }: { className?: string }) { return <svg suppressHydrationWarning className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" /></svg> }
function XIcon({ className = "h-5 w-5" }: { className?: string }) { return <svg suppressHydrationWarning className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M18 6L6 18M6 6l12 12" /></svg> }
function TrashIcon({ className = "h-4 w-4" }: { className?: string }) { return <svg suppressHydrationWarning className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg> }
function ArrowUpRight({ className = "h-3 w-3" }: { className?: string }) { return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 19.5l15-15m0 0H8.25m11.25 0v11.25" /></svg> }

// 3. COMPONENTS
function SubscribeForm() {
  const [email, setEmail] = useState("")
  const [status, setStatus] = useState("idle") 

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault()
    setStatus("loading")
    if (!email.includes("@")) { setStatus("error"); return }
    const { error } = await supabase.from('subscribers').insert({ email })
    if (error) { console.error(error); setStatus("error") } 
    else { setStatus("success"); setEmail("") }
  }

  if (status === "success") {
    return <div className="p-4 border border-[#c5a059] bg-[#c5a059]/10 rounded text-center animate-pulse"><p className="text-[#f4e4bc] font-serif text-lg">Welcome to the Royal Family.</p></div>
  }

  return (
    <form onSubmit={handleSubscribe} className="flex w-full max-w-md gap-0 relative">
      <input type="email" required placeholder="Your email address" value={email} onChange={(e) => setEmail(e.target.value)} disabled={status === "loading"} className="flex-1 border border-[#e5d5a3]/20 bg-[#2a0808] px-4 py-3 font-sans text-sm text-[#e5d5a3] placeholder-[#e5d5a3]/30 outline-none focus:border-[#e5d5a3]/60 disabled:opacity-50 rounded-l" />
      <button disabled={status === "loading"} className="bg-[#e5d5a3] px-6 py-3 font-sans text-sm font-bold uppercase tracking-wider text-[#1a0505] hover:bg-white disabled:opacity-70 transition-colors rounded-r">{status === "loading" ? "Joining..." : "Subscribe"}</button>
    </form>
  )
}

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
            {product.image_url ? 
                <img 
                    src={product.image_url} 
                    alt={product.name} 
                    onLoad={() => setImgLoaded(true)}
                    className={`h-full w-full object-cover transition-transform duration-500 group-hover:scale-105 ${imgLoaded ? 'image-loaded' : 'image-loading'}`} 
                /> 
            : 
                <div className="flex flex-col items-center justify-center text-[#e5d5a3]/30 h-full"><span className="font-serif text-lg tracking-widest">IMAGE</span></div>
            }
        </Link>
        {product.id === 1 && <span className="absolute left-3 top-3 bg-[#e5d5a3] px-3 py-1 font-sans text-[10px] font-bold uppercase text-[#1a0505] rounded-sm z-10">BESTSELLER</span>}
        
        <button onClick={handleWishlistClick} className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-[#1a0505]/60 backdrop-blur-sm hover:bg-[#e5d5a3] hover:text-[#1a0505] text-[#e5d5a3] border border-[#e5d5a3]/30 z-20 transition-colors">
            {isGlittering && (
                <>
                    <span className="heart-particle p-1 animate-heart-burst hp-red">♥</span><span className="heart-particle p-2 animate-heart-burst hp-gold">♥</span><span className="heart-particle p-3 animate-heart-burst hp-red">♥</span><span className="heart-particle p-4 animate-heart-burst hp-gold">♥</span>
                    <span className="heart-particle p-5 animate-heart-burst hp-red">♥</span><span className="heart-particle p-6 animate-heart-burst hp-gold">♥</span><span className="heart-particle p-7 animate-heart-burst hp-red">♥</span><span className="heart-particle p-8 animate-heart-burst hp-gold">♥</span>
                    <span className="heart-particle p-9 animate-heart-burst hp-gold">♥</span><span className="heart-particle p-10 animate-heart-burst hp-red">♥</span><span className="heart-particle p-11 animate-heart-burst hp-gold">♥</span><span className="heart-particle p-12 animate-heart-burst hp-red">♥</span>
                </>
            )}
            <HeartIcon className={`h-4 w-4 relative z-10 ${isWishlisted ? "fill-red-600 text-red-600" : ""}`} filled={isWishlisted} />
        </button>

        <div className="absolute inset-x-0 bottom-0 z-20 translate-y-full transition-transform duration-300 group-hover:translate-y-0">
            <button 
                onClick={(e) => { e.preventDefault(); onAddToCart(product); setAddedEffect(true); setTimeout(() => setAddedEffect(false), 2000); }} 
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
        <Link href={`/product/${product.id}`} className="hover:text-white transition-colors"><h3 className="font-serif text-lg font-medium tracking-wide text-[#e5d5a3]">{product.name}</h3></Link>
        <p className="font-sans text-base font-bold text-white/80">₹{product.price.toLocaleString("en-IN")}</p>
      </div>
    </article>
  )
}

// 4. MAIN PAGE
export default function Page() {
  const router = useRouter()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [products, setProducts] = useState<any[]>([])
  
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

  // 🌟 MEGA MENU STATE 🌟
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null)

  // CINEMATIC SCROLL LOGIC
  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible')
        }
      })
    }, { threshold: 0.1 }) 

    const elements = document.querySelectorAll('.reveal-on-scroll')
    elements.forEach(el => observer.observe(el))

    return () => elements.forEach(el => observer.unobserve(el))
  }, [products]) 

  // SEARCH LOGIC
  useEffect(() => {
    const fetchSuggestions = async () => {
        if (searchTerm.length < 2) { setSuggestions([]); return }
        try {
            const res = await fetch(`/api/search?q=${encodeURIComponent(searchTerm)}`)
            const productMatches = await res.json()
            const termLower = searchTerm.toLowerCase()
            const categoryMatches = PREDICTED_CATEGORIES
                .filter(cat => cat.name.toLowerCase().includes(termLower))
                .map(cat => ({ type: 'category', ...cat }))
            setSuggestions([...categoryMatches, ...productMatches.map((p: any) => ({ type: 'product', ...p }))])
        } catch (e) {
            console.error("Search failed", e)
        }
    }
    const timeoutId = setTimeout(fetchSuggestions, 150) 
    return () => clearTimeout(timeoutId)
  }, [searchTerm])

  const handleSearchKey = (e: React.KeyboardEvent<HTMLInputElement>) => { if (e.key === 'Enter' && searchTerm.trim()) { router.push(`/shop/search?q=${encodeURIComponent(searchTerm.trim())}`); setSuggestions([]) } }

  useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => { if (searchRef.current && !searchRef.current.contains(event.target as Node)) { setSuggestions([]) } }
      document.addEventListener("mousedown", handleClickOutside); return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  useEffect(() => {
    async function init() {
        const { data } = await supabase.from('products').select('*'); if (data) setProducts(data)
        const { data: { session } } = await supabase.auth.getSession(); if (session) setUser(session.user)
        
        const rawCart = JSON.parse(localStorage.getItem('cart') || '[]')
        const cleanCart: any[] = []
        rawCart.forEach((item: any) => {
            const existing = cleanCart.find(i => i.id === item.id)
            const qty = (item.quantity !== undefined && !isNaN(item.quantity)) ? item.quantity : 1
            if (existing) { existing.quantity += qty } else { cleanCart.push({ ...item, quantity: qty }) }
        })
        localStorage.setItem('cart', JSON.stringify(cleanCart)); setCart(cleanCart)
        
        const storedWishlist = JSON.parse(localStorage.getItem('wishlist') || '[]'); setWishlist(storedWishlist)
    }
    init()
  }, [])

  const handleLogin = async (e: React.FormEvent) => { e.preventDefault(); setLoadingLogin(true); const { error } = await supabase.auth.signInWithOtp({ email }); if (error) { setLoginMessage("Error: " + error.message) } else { setLoginMessage("Magic Link sent! Check your email.") } setLoadingLogin(false) }
  
  const addToCart = (product: any) => { 
      const existingItemIndex = cart.findIndex(item => item.id === product.id)
      let newCart;
      if (existingItemIndex > -1) {
          newCart = [...cart]
          newCart[existingItemIndex].quantity = (newCart[existingItemIndex].quantity || 1) + 1
      } else {
          newCart = [...cart, { ...product, quantity: 1 }]
      }
      setCart(newCart); 
      localStorage.setItem('cart', JSON.stringify(newCart)) 
  }

  const toggleWishlist = (product: any) => { const exists = wishlist.find(i => i.id === product.id); let newW; if(exists) newW = wishlist.filter(i=>i.id!==product.id); else newW=[...wishlist, product]; setWishlist(newW); localStorage.setItem('wishlist', JSON.stringify(newW)) }
  const cartTotal = cart.reduce((t, i) => t + (i.price * (i.quantity || 1)), 0)
  const scrollTo = (id: string) => { document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' }); setMobileMenuOpen(false) }
  const updateQuantity = (i: number, c: number) => { const n = [...cart]; n[i].quantity = (n[i].quantity||1)+c; if(n[i].quantity<0)return; setCart(n); localStorage.setItem('cart', JSON.stringify(n)) }
  const removeFromCart = (i: number) => { const n = cart.filter((_, idx) => idx !== i); setCart(n); localStorage.setItem('cart', JSON.stringify(n)) }

  return (
    <main className="min-h-screen bg-[#1a0505] text-[#e5d5a3] relative font-sans">
      <Script src="https://checkout.razorpay.com/v1/checkout.js" />
      
      {/* 🌟 HEADER START 🌟 */}
      <header className="sticky top-0 z-40 bg-[#1a0505]/95 backdrop-blur-md transition-all duration-500 shadow-lg" onMouseLeave={() => setHoveredCategory(null)}>
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 lg:px-8 gap-8 relative z-50">
          
          <button onClick={() => scrollTo('hero')} className="flex items-center gap-2">
            <span className="font-serif text-2xl font-bold tracking-[0.2em] lg:text-3xl text-gradient bg-clip-text text-transparent bg-gradient-to-r from-[#e5d5a3] via-[#fbf5e6] to-[#c5a059] text-[#e5d5a3]">LOTUS</span>
          </button>

          <div className="hidden flex-1 justify-center max-w-lg md:flex">
            <div className="relative w-full group" ref={searchRef}>
              <SearchIcon className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#c5a059]/60 group-focus-within:text-[#c5a059] transition-colors" />
              <input 
                type="text" 
                placeholder="Search treasures..." 
                className="w-full rounded-full border border-[#e5d5a3]/20 bg-[#2a0808]/50 py-2.5 pl-12 pr-4 text-sm text-[#e5d5a3] placeholder-[#e5d5a3]/30 outline-none focus:border-[#c5a059] focus:bg-[#2a0808] transition-all shadow-inner"
                value={searchTerm} 
                onChange={(e) => setSearchTerm(e.target.value)} 
                onKeyDown={handleSearchKey} 
                onFocus={() => { if(searchTerm.length >=2) setSuggestions(suggestions) }} 
              />
              
              {suggestions.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-[#1a0505] border border-[#e5d5a3]/20 rounded-lg shadow-2xl z-50 overflow-hidden divide-y divide-[#e5d5a3]/10">
                      {suggestions.map((item, idx) => (
                          <div key={idx}>
                              {item.type === 'category' ? (
                                  <Link href={`/shop/${item.slug}`} className="flex items-center gap-3 p-3 hover:bg-[#2a0808] transition-colors group/item" onClick={() => { setSuggestions([]); setSearchTerm("") }}>
                                      <div className="h-8 w-8 flex items-center justify-center text-[#c5a059]"><SearchIcon className="h-4 w-4" /></div><div className="flex-1"><p className="text-sm font-bold text-[#e5d5a3] group-hover/item:text-white capitalize">{item.name}</p><p className="text-[10px] text-[#e5d5a3]/50">Search in Categories</p></div><ArrowUpRight className="h-3 w-3 text-[#e5d5a3]/30" />
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
            <button className="hidden md:block hover:text-white relative group" onClick={() => setIsWishlistOpen(true)}>
                <HeartIcon />
                {wishlist.length > 0 && <span className="absolute -right-1.5 -top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-600 text-[10px] font-bold text-white group-hover:scale-110 transition-transform">{wishlist.length}</span>}
            </button>
            <button className="relative hover:text-white transition-colors group" onClick={() => setIsCartOpen(true)}>
                <ShoppingBagIcon />
                {cart.length > 0 && <span className="absolute -right-1.5 -top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-[#c5a059] text-[10px] font-bold text-[#1a0505] group-hover:scale-110 transition-transform">{cart.length}</span>}
            </button>
            {user ? (<Link href="/account" className="hidden md:block hover:text-white transition-colors"><div className="h-6 w-6 rounded-full bg-[#e5d5a3] text-[#1a0505] flex items-center justify-center text-xs font-bold" title={user.email}>{user.email?.charAt(0).toUpperCase()}</div></Link>) : (<button className="hidden md:block hover:text-white transition-colors" onClick={() => setIsLoginOpen(true)}><UserIcon /></button>)}
            <button className="md:hidden" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>{mobileMenuOpen ? <XIcon /> : <MenuIcon />}</button>
          </nav>
        </div>

        {/* 🌟 MEGA MENU NAVIGATION BAR 🌟 */}
        <div className="border-t border-[#e5d5a3]/5 bg-[#2a0808]/30 backdrop-blur-sm relative">
            <div className="mx-auto max-w-7xl px-4 flex justify-center gap-8 md:gap-16">
                {MEGA_MENU.map((category) => (
                    <div 
                        key={category.name}
                        onMouseEnter={() => setHoveredCategory(category.name)}
                        className="py-4"
                    >
                        <Link 
                            href={`/shop/${category.slug}`}
                            className={`text-xs md:text-sm uppercase tracking-[0.15em] hover:text-[#c5a059] hover:font-bold transition-all relative block ${hoveredCategory === category.name ? 'text-[#c5a059] font-bold' : 'text-[#e5d5a3]/70'}`}
                        >
                            {category.name}
                            {/* Gold Underline Animation */}
                            <span className={`absolute bottom-[-17px] left-1/2 -translate-x-1/2 h-0.5 bg-[#c5a059] transition-all duration-300 ease-out ${hoveredCategory === category.name ? 'w-full' : 'w-0'}`}></span>
                        </Link>
                    </div>
                ))}
            </div>

            {/* 🌟 THE MEGA MENU DROPDOWN PANEL 🌟 */}
            <div className={`absolute top-full left-0 w-full bg-[#1a0505]/95 backdrop-blur-xl border-t border-[#e5d5a3]/10 shadow-2xl transition-all duration-300 overflow-hidden ${hoveredCategory ? 'max-h-[500px] opacity-100 visible' : 'max-h-0 opacity-0 invisible'}`}>
                <div className="mx-auto max-w-7xl px-8 py-10">
                    {MEGA_MENU.map((category) => (
                        <div key={category.name} className={`${hoveredCategory === category.name ? 'block' : 'hidden'} animate-fade-in`}>
                            <h3 className="font-serif text-2xl text-[#c5a059] mb-6 tracking-wide border-b border-[#e5d5a3]/10 pb-2">{category.name} Collection</h3>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-x-8 gap-y-8">
                                {category.items.map((item, idx) => (
                                    // 🌟 SMART LINK: Uses 'searchQuery' to guarantee results
                                    <Link key={idx} href={`/shop/search?q=${encodeURIComponent(item.searchQuery)}`} className="group/item block p-4 rounded hover:bg-[#2a0808] transition-colors border border-transparent hover:border-[#e5d5a3]/10">
                                        <div className="font-bold text-[#e5d5a3] group-hover/item:text-white text-base mb-1">{item.name}</div>
                                        {/* The Finish Types */}
                                        <div className="text-[10px] text-[#e5d5a3]/50 uppercase tracking-wider group-hover/item:text-[#c5a059] transition-colors">{item.types}</div>
                                    </Link>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
      </header>
      {/* 🌟 HEADER END 🌟 */}

      {/* REST OF PAGE (Login, Sidebars, Hero, Featured, Footer) */}
      {isLoginOpen && (<div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"><div className="bg-[#2a0808] border border-[#e5d5a3]/30 p-8 w-full max-w-md shadow-2xl relative"><button onClick={() => setIsLoginOpen(false)} className="absolute top-4 right-4 text-[#e5d5a3]/50 hover:text-white"><XIcon /></button><h2 className="font-serif text-2xl text-[#f4e4bc] mb-2 text-center">Member Login</h2><p className="text-center text-[#e5d5a3]/50 text-xs mb-6 uppercase tracking-widest">We will send a magic link to your email</p>{!loginMessage ? (<form onSubmit={handleLogin} className="space-y-4"><input required type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="name@example.com" className="w-full bg-[#1a0505] border border-[#e5d5a3]/20 p-3 text-[#e5d5a3] outline-none focus:border-[#e5d5a3]" /><button disabled={loadingLogin} className="w-full bg-[#e5d5a3] text-[#1a0505] py-3 font-bold uppercase tracking-widest hover:bg-white disabled:opacity-50">{loadingLogin ? "Sending..." : "Send Login Link"}</button></form>) : (<div className="text-center text-green-400 p-4 border border-green-500/20 bg-green-500/10">{loginMessage}</div>)}</div></div>)}
      
      <div className={`fixed inset-0 z-50 bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${mobileMenuOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} onClick={() => setMobileMenuOpen(false)} />
      <div className={`fixed top-0 left-0 z-50 h-full w-3/4 max-w-xs bg-[#1a0505] border-r border-[#e5d5a3]/20 shadow-2xl transition-transform duration-300 transform ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} flex flex-col p-6`}>
          <div className="flex justify-between items-center mb-8"><span className="font-serif text-2xl text-[#e5d5a3] font-bold">LOTUS</span><button onClick={() => setMobileMenuOpen(false)} className="text-[#e5d5a3]"><XIcon /></button></div>
          <nav className="flex flex-col gap-6">
              {MEGA_MENU.map(cat => (
                  <Link key={cat.name} href={`/shop/${cat.slug}`} className="text-[#f4e4bc] font-serif text-lg hover:text-[#c5a059]" onClick={() => setMobileMenuOpen(false)}>{cat.name}</Link>
              ))}
              <div className="h-px bg-[#e5d5a3]/20 my-2"></div>
              <Link href="/about" className="text-[#e5d5a3]/70 hover:text-white" onClick={() => setMobileMenuOpen(false)}>About Us</Link>
              <Link href="/contact" className="text-[#e5d5a3]/70 hover:text-white" onClick={() => setMobileMenuOpen(false)}>Contact</Link>
              <Link href="/track" className="text-[#e5d5a3]/70 hover:text-white" onClick={() => setMobileMenuOpen(false)}>Track Order</Link>
          </nav>
      </div>

      <div className={`fixed inset-0 z-50 bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${isWishlistOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} onClick={() => setIsWishlistOpen(false)} />
      <div className={`fixed top-0 right-0 z-50 h-full w-full max-w-sm bg-[#1a0505] border-l border-[#e5d5a3]/20 shadow-2xl transition-transform duration-300 transform ${isWishlistOpen ? 'translate-x-0' : 'translate-x-full'} flex flex-col`}>
          <div className="flex items-center justify-between p-6 border-b border-[#e5d5a3]/10 pb-4"><h2 className="font-serif text-xl font-bold tracking-wide text-[#f4e4bc]">Your Favorites</h2><button onClick={() => setIsWishlistOpen(false)} className="text-[#e5d5a3]/60 hover:text-white"><XIcon className="w-6 h-6" /></button></div>
          <div className="flex-1 overflow-y-auto space-y-4 p-6">{wishlist.length === 0 ? <p className="text-center text-[#e5d5a3]/40 italic mt-10">No favorites yet.</p> : wishlist.reverse().slice(0, 5).map((item) => ( <div key={item.id} className="flex gap-4 p-2 border-b border-[#e5d5a3]/10 items-center"><div className="h-14 w-14 bg-[#2a0808] rounded overflow-hidden"><img src={item.image_url} className="h-full w-full object-cover" /></div><div className="flex-1"><p className="text-sm text-[#e5d5a3] font-serif">{item.name}</p><p className="text-xs text-[#e5d5a3]/60">₹{item.price.toLocaleString("en-IN")}</p></div><div className="flex gap-2 items-center"><button onClick={() => addToCart(item)} className="text-[10px] bg-[#e5d5a3] text-black px-2 py-1 font-bold uppercase hover:bg-white rounded tracking-wider">Add</button><button onClick={() => toggleWishlist(item)} className="text-[#e5d5a3]/40 hover:text-red-400 transition-colors p-1" title="Remove"><XIcon className="h-4 w-4" /></button></div></div>))}</div>
          <div className="mt-auto p-6 border-t border-[#e5d5a3]/10">
              <Link href="/wishlist" className="block w-full text-center bg-[#e5d5a3] py-3 font-sans text-xs font-bold uppercase tracking-widest text-[#1a0505] hover:bg-white transition-colors shadow-lg rounded">View Full Wishlist</Link>
          </div>
      </div>
      
      <div className={`fixed inset-0 z-50 bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${isCartOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} onClick={() => setIsCartOpen(false)} />
      <div className={`fixed top-0 right-0 z-50 h-full w-full max-w-sm bg-[#2a0808] border-l border-[#e5d5a3]/20 shadow-2xl transition-transform duration-300 transform ${isCartOpen ? 'translate-x-0' : 'translate-x-full'} flex flex-col`}>
          <div className="flex items-center justify-between p-6 border-b border-[#e5d5a3]/10 pb-4"><h2 className="font-serif text-xl font-bold tracking-wide text-[#f4e4bc]">Your Bag ({cart.length})</h2><button onClick={() => setIsCartOpen(false)} className="text-[#e5d5a3]/60 hover:text-white"><XIcon className="w-6 h-6" /></button></div>
          <div className="flex-1 overflow-y-auto space-y-4 p-6 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-[#c5a059] [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-[#e5d5a3]">
              {cart.length === 0 ? <div className="text-center py-10 text-[#e5d5a3]/40 font-sans italic">Your royal bag is empty.</div> : cart.map((item, idx) => (<div key={idx} className="flex gap-4 bg-[#1a0505]/50 p-3 rounded border border-[#e5d5a3]/10"><div className="h-16 w-16 bg-[#1a0505] flex-shrink-0 overflow-hidden rounded-sm border border-[#e5d5a3]/10">{item.image_url && <img src={item.image_url} className="h-full w-full object-cover" />}</div><div className="flex-1 flex flex-col justify-between"><div><h4 className="font-serif text-sm text-[#e5d5a3] leading-tight">{item.name}</h4><p className="text-xs text-[#c5a059] mt-1 font-bold">₹{item.price.toLocaleString("en-IN")}</p></div><div className="flex items-center gap-3 bg-[#2a0808] border border-[#e5d5a3]/20 w-fit px-2 py-0.5 rounded mt-2"><button onClick={() => updateQuantity(idx, -1)} className="text-[#e5d5a3] hover:text-white text-xs px-1">-</button><span className="text-xs font-bold text-[#f4e4bc]">{item.quantity !== undefined ? item.quantity : 1}</span><button onClick={() => updateQuantity(idx, 1)} className="text-[#e5d5a3] hover:text-white text-xs px-1">+</button></div></div><button onClick={() => removeFromCart(idx)} className="self-start text-[#e5d5a3]/40 hover:text-red-400 transition-colors"><TrashIcon /></button></div>))}
          </div>
          <div className="mt-auto p-6 bg-[#2a0808] border-t border-[#e5d5a3]/20">
              <div className="flex justify-between mb-4 text-[#f4e4bc] font-bold"><span>Total</span><span>₹{cartTotal.toLocaleString("en-IN")}</span></div>
              <Link href="/cart" className="block w-full text-center bg-[#e5d5a3] py-3 font-sans text-xs font-bold uppercase tracking-widest text-[#1a0505] hover:bg-white transition-colors shadow-lg rounded">View Shopping Cart</Link>
          </div>
      </div>

      <section id="hero" className="relative overflow-hidden bg-[#1a0505] py-24 lg:py-40 border-b border-[#e5d5a3]/10">
        <div className="absolute inset-0 z-0"><img src="https://fwyliqsazdyprlkemavu.supabase.co/storage/v1/object/public/jewelry-images/banner.jpg" alt="Royal Jewelry Background" className="h-full w-full object-cover opacity-40" /><div className="absolute inset-0 bg-gradient-to-t from-[#1a0505] via-[#2a0808]/60 to-[#1a0505]/30" /></div>
        <div className="relative mx-auto flex max-w-7xl flex-col items-center text-center px-6 lg:px-8 z-10">
          <span className="mb-6 inline-block border border-[#e5d5a3]/60 px-6 py-2 font-sans text-xs font-bold uppercase tracking-[0.3em] text-[#e5d5a3] drop-shadow-md rounded animate-hero-1">Handcrafted Luxury</span>
          <h1 className="max-w-4xl font-serif text-5xl font-medium leading-tight tracking-wide text-[#f4e4bc] md:text-7xl drop-shadow-lg animate-hero-2">Real Gold Look, <br /><span className="text-[#c5a059] italic">Affordable</span> Elegance</h1>
          <p className="mt-8 max-w-xl font-sans text-sm leading-relaxed text-[#e5d5a3]/90 md:text-base drop-shadow-md animate-hero-3">Discover our exquisite collection of imitation jewelry that mirrors the grandeur of real gold.</p>
          <div className="mt-12 flex flex-col sm:flex-row gap-4 animate-hero-btn"><button onClick={() => scrollTo('featured')} className="inline-flex items-center justify-center gap-2 bg-[#e5d5a3] px-10 py-4 font-sans text-xs font-bold uppercase tracking-widest text-[#1a0505] transition-all hover:bg-white hover:shadow-[0_0_20px_rgba(229,213,163,0.3)] cursor-pointer rounded">Shop Collection</button></div>
        </div>
      </section>

      <section id="featured" className="py-24 px-4 max-w-7xl mx-auto reveal-on-scroll">
        <div className="mb-20 text-center"><span className="mb-3 inline-block font-sans text-xs font-bold uppercase tracking-[0.3em] text-[#e5d5a3]/40">Curated for You</span><h2 className="font-serif text-4xl font-medium tracking-wide text-[#f4e4bc]">Featured Treasures</h2><div className="mx-auto mt-6 h-px w-24 bg-gradient-to-r from-transparent via-[#c5a059] to-transparent" /></div>
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">{products.length === 0 ? (<div className="col-span-4 py-20 text-center border border-dashed border-[#e5d5a3]/20 rounded bg-[#2a0808]/50"><p className="text-[#e5d5a3]/50 font-serif text-lg">Loading your collection...</p></div>) : (products.map((product) => (<ProductCard key={product.id} product={product} onAddToCart={addToCart} isWishlisted={wishlist.some(item => item.id === product.id)} onToggleWishlist={toggleWishlist} />)))}</div>
        <div className="mt-20 text-center"><button onClick={() => scrollTo('featured')} className="text-[#e5d5a3] border-b border-[#e5d5a3]/30 pb-1 hover:text-white hover:border-[#e5d5a3] transition-all text-sm uppercase tracking-widest">View All Products</button></div>
      </section>

      <footer id="footer" className="bg-[#0f0303] text-[#e5d5a3] border-t border-[#e5d5a3]/10">
        <div className="border-b border-[#e5d5a3]/10"><div className="mx-auto flex max-w-7xl flex-col items-center gap-6 px-4 py-16 text-center"><h3 className="font-serif text-3xl font-medium tracking-wide text-[#f4e4bc]">Join the Royal Family</h3><p className="max-w-md font-sans text-sm text-[#e5d5a3]/50">Subscribe to receive exclusive updates on new arrivals.</p><SubscribeForm /></div></div>
        <div className="mx-auto grid max-w-7xl grid-cols-1 gap-12 px-4 py-16 sm:grid-cols-2 lg:grid-cols-4 lg:px-8 text-left">
          <div><span className="font-serif text-xl font-bold tracking-widest text-[#e5d5a3]">LOTUS</span><p className="mt-4 font-sans text-sm leading-relaxed text-[#e5d5a3]/50">Premium imitation jewelry.</p></div>
          
          {/* 🌟 DYNAMIC SHOP FOOTER LINK GENERATION 🌟 */}
          <div>
            <h4 className="mb-6 font-sans text-xs font-bold uppercase tracking-[0.2em] text-[#e5d5a3]/70">Shop</h4>
            <ul className="flex flex-col gap-3">
              {MEGA_MENU.map((category) => (
                category.items.map((item) => (
                  <li key={item.name}>
                    <Link 
                      // Uses the same smart search query for consistent results
                      href={`/shop/search?q=${encodeURIComponent(item.searchQuery)}`} 
                      className="font-sans text-sm text-[#e5d5a3]/50 hover:text-[#e5d5a3] transition-colors"
                    >
                      {item.name}
                    </Link>
                  </li>
                ))
              ))}
            </ul>
          </div>

          <div><h4 className="mb-6 font-sans text-xs font-bold uppercase tracking-[0.2em] text-[#e5d5a3]/70">Company</h4><ul className="flex flex-col gap-3"><li><Link href="/about" className="font-sans text-sm text-[#e5d5a3]/50 hover:text-[#e5d5a3] transition-colors">About Us</Link></li><li><Link href="/contact" className="font-sans text-sm text-[#e5d5a3]/50 hover:text-[#e5d5a3] transition-colors">Contact</Link></li></ul></div>
          <div><h4 className="mb-6 font-sans text-xs font-bold uppercase tracking-[0.2em] text-[#e5d5a3]/70">Support</h4><ul className="flex flex-col gap-3"><li><Link href="/shipping" className="font-sans text-sm text-[#e5d5a3]/50 hover:text-[#e5d5a3] transition-colors">Shipping & Returns</Link></li><li><Link href="/track" className="font-sans text-sm text-[#e5d5a3]/50 hover:text-[#e5d5a3] transition-colors">Track Order</Link></li></ul></div>
        </div>
        <div className="border-t border-[#e5d5a3]/10 py-6 text-center"><p className="font-sans text-xs text-[#e5d5a3]/30">© 2026 LOTUS Jewelry.</p></div>
      </footer>
    </main>
  )
}