'use client'
import { useState, useEffect, useRef } from 'react'
import { createClient } from '@supabase/supabase-js'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

// CONFIGURATION
const supabaseUrl = "https://fwyliqsazdyprlkemavu.supabase.co"
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ3eWxpcXNhemR5cHJsa2VtYXZ1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAzOTg2MzIsImV4cCI6MjA4NTk3NDYzMn0.dXkx1pEtiZ5uwcQJgisJs14ZyUJTuz-SomMCeZv-jbE"
const supabase = createClient(supabaseUrl, supabaseKey)

// STATIC CATEGORIES (For Search)
const PREDICTED_CATEGORIES = [
    { name: "Necklaces", slug: "necklaces" },
    { name: "Earrings", slug: "earrings" },
    { name: "Bangles", slug: "bangles" },
    { name: "Bridal Sets", slug: "bridal" },
    { name: "Rings", slug: "rings" }
]

// ICONS
function SearchIcon({ className = "h-5 w-5" }: { className?: string }) { return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M11 19a8 8 0 100-16 8 8 0 000 16z" /></svg> }
function ArrowUpRight({ className = "h-3 w-3" }: { className?: string }) { return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 19.5l15-15m0 0H8.25m11.25 0v11.25" /></svg> }
function ShoppingBagIcon({ className = "h-5 w-5" }: { className?: string }) { return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4zM3 6h18M16 10a4 4 0 01-8 0" /></svg> }
function UserIcon({ className = "h-5 w-5" }: { className?: string }) { return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2M12 3a4 4 0 100 8 4 4 0 000-8z" /></svg> }
function HeartIcon({ className = "h-5 w-5" }: { className?: string }) { return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" /></svg> }

export default function ShippingPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [cartCount, setCartCount] = useState(0)
  const [wishlistCount, setWishlistCount] = useState(0)

  // 🌟 SEARCH LOGIC 🌟
  const [searchTerm, setSearchTerm] = useState("")
  const [suggestions, setSuggestions] = useState<any[]>([])
  const searchRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    async function init() {
        const { data: { session } } = await supabase.auth.getSession()
        if (session) setUser(session.user)
        
        // Sync Counts
        const cart = JSON.parse(localStorage.getItem('cart') || '[]')
        setCartCount(cart.length)
        const wishlist = JSON.parse(localStorage.getItem('wishlist') || '[]')
        setWishlistCount(wishlist.length)
    }
    init()
  }, [])

  // SEARCH EFFECT
  useEffect(() => {
    const fetchSuggestions = async () => {
        if (searchTerm.length < 2) { setSuggestions([]); return }
        const termLower = searchTerm.toLowerCase()
        const categoryMatches = PREDICTED_CATEGORIES.filter(cat => cat.name.toLowerCase().includes(termLower)).map(cat => ({ type: 'category', ...cat }))
        const { data: productMatches } = await supabase.from('products').select('id, name, category, image_url').or(`name.ilike.%${searchTerm}%,category.ilike.%${searchTerm}%`).limit(4)
        setSuggestions([...categoryMatches, ...(productMatches || []).map(p => ({ type: 'product', ...p }))])
    }
    const timeoutId = setTimeout(fetchSuggestions, 200)
    return () => clearTimeout(timeoutId)
  }, [searchTerm])

  const handleSearchKey = (e: React.KeyboardEvent<HTMLInputElement>) => { 
      if (e.key === 'Enter' && searchTerm.trim()) { 
          router.push(`/search?q=${encodeURIComponent(searchTerm.trim())}`)
          setSuggestions([]) 
      } 
  }

  // CLOSE SEARCH ON CLICK OUTSIDE
  useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => { if (searchRef.current && !searchRef.current.contains(event.target as Node)) { setSuggestions([]) } }
      document.addEventListener("mousedown", handleClickOutside); return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  return (
    <main className="min-h-screen bg-[#1a0505] text-[#e5d5a3] font-sans">
      
      {/* HEADER (With Functional Search) */}
      <header className="sticky top-0 z-40 border-b border-[#e5d5a3]/10 bg-[#1a0505]/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 lg:px-8">
          <Link href="/" className="font-serif text-2xl font-bold tracking-[0.2em] lg:text-3xl text-[#e5d5a3]">LOTUS</Link>
          
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
              
              {/* SEARCH DROPDOWN */}
              {suggestions.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-[#1a0505] border border-[#e5d5a3]/20 rounded shadow-2xl z-50 overflow-hidden divide-y divide-[#e5d5a3]/10">
                      {suggestions.map((item, idx) => (
                          <div key={idx}>
                              {item.type === 'category' ? (
                                  <Link href={`/shop/${item.slug}`} className="flex items-center gap-3 p-3 hover:bg-[#2a0808] transition-colors group/item" onClick={() => { setSuggestions([]); setSearchTerm("") }}>
                                      <div className="h-8 w-8 flex items-center justify-center text-[#c5a059]"><SearchIcon className="h-4 w-4" /></div>
                                      <div className="flex-1"><p className="text-sm font-bold text-[#e5d5a3] group-hover/item:text-white capitalize">{item.name}</p><p className="text-[10px] text-[#e5d5a3]/50">Search in Categories</p></div>
                                      <ArrowUpRight className="h-3 w-3 text-[#e5d5a3]/30" />
                                  </Link>
                              ) : (
                                  <Link href={`/product/${item.id}`} className="flex items-center gap-3 p-3 hover:bg-[#2a0808] transition-colors group/item" onClick={() => { setSuggestions([]); setSearchTerm("") }}>
                                      <div className="h-10 w-10 bg-[#2a0808] rounded overflow-hidden flex-shrink-0 border border-[#e5d5a3]/10">{item.image_url && <img src={item.image_url} className="h-full w-full object-cover" />}</div>
                                      <div className="flex-1"><p className="text-sm text-[#e5d5a3] group-hover/item:text-white truncate">{item.name}</p><p className="text-[10px] text-[#c5a059] uppercase tracking-wide">Best Seller</p></div>
                                  </Link>
                              )}
                          </div>
                      ))}
                  </div>
              )}
            </div>
          </div>

          <nav className="flex items-center gap-5 text-[#e5d5a3]">
            <Link href="/" className="relative hover:text-white"><HeartIcon />{wishlistCount > 0 && <span className="absolute -right-1.5 -top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-600 text-[10px] font-bold text-white">{wishlistCount}</span>}</Link>
            <Link href="/cart" className="relative hover:text-white transition-colors"><ShoppingBagIcon />{cartCount > 0 && <span className="absolute -right-1.5 -top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-[#c5a059] text-[10px] font-bold text-[#1a0505]">{cartCount}</span>}</Link>
            {user ? (<Link href="/account" className="hidden md:block hover:text-white transition-colors"><div className="h-6 w-6 rounded-full bg-[#e5d5a3] text-[#1a0505] flex items-center justify-center text-xs font-bold" title={user.email}>{user.email?.charAt(0).toUpperCase()}</div></Link>) : (<div className="w-6"></div>)}
          </nav>
        </div>
      </header>

      {/* CONTENT */}
      <div className="max-w-4xl mx-auto px-6 py-16">
        <h1 className="font-serif text-4xl text-[#f4e4bc] mb-4 text-center">Shipping & Returns</h1>
        <p className="text-[#e5d5a3]/60 text-center mb-16 uppercase tracking-widest text-xs">Our commitment to your satisfaction</p>

        <div className="space-y-12">
            
            {/* POLICY 1 */}
            <div className="bg-[#2a0808] p-8 rounded border border-[#e5d5a3]/10">
                <div className="flex items-center gap-4 mb-6">
                    <div className="h-10 w-10 rounded-full border border-[#c5a059] flex items-center justify-center text-[#c5a059]">
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" /></svg>
                    </div>
                    <h2 className="font-serif text-2xl text-[#f4e4bc]">Royal Shipping Policy</h2>
                </div>
                <div className="space-y-4 text-[#e5d5a3]/70 text-sm leading-relaxed">
                    <p><strong className="text-[#c5a059]">1. Insured Delivery:</strong> Every piece of jewelry is fully insured during transit. We use premium logistics partners to ensure your treasure arrives safely.</p>
                    <p><strong className="text-[#c5a059]">2. Processing Time:</strong> Orders are processed within 24 hours. Customized or bridal sets may take 2-3 days for final polish and inspection.</p>
                    <p><strong className="text-[#c5a059]">3. Free Shipping:</strong> We offer complimentary expedited shipping on all orders above ₹999.</p>
                </div>
            </div>

            {/* POLICY 2 */}
            <div className="bg-[#2a0808] p-8 rounded border border-[#e5d5a3]/10">
                <div className="flex items-center gap-4 mb-6">
                    <div className="h-10 w-10 rounded-full border border-[#c5a059] flex items-center justify-center text-[#c5a059]">
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" /></svg>
                    </div>
                    <h2 className="font-serif text-2xl text-[#f4e4bc]">No-Questions Return</h2>
                </div>
                <div className="space-y-4 text-[#e5d5a3]/70 text-sm leading-relaxed">
                    <p>We want you to love your jewelry. If for any reason you are not completely satisfied, you may return it within <strong className="text-white">7 days</strong> of delivery.</p>
                    <ul className="list-disc pl-5 space-y-2">
                        <li>Item must be unused and in original packaging with tags intact.</li>
                        <li>Return shipping is free for all domestic orders.</li>
                        <li>Refunds are processed to the original payment method within 48 hours of receipt.</li>
                    </ul>
                </div>
            </div>

        </div>
      </div>
    </main>
  )
}