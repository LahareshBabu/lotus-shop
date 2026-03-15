'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/app/supabase'

// INLINE SVGS FOR GUARANTEED RENDERING
function AlertIcon({ className="w-5 h-5" }) { return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg> }
function CheckIcon({ className="w-5 h-5" }) { return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> }
function TrashIcon({ className="w-5 h-5" }) { return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg> }
function ArrowRightIcon({ className="w-4 h-4" }) { return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg> }
function SearchIcon({ className="w-5 h-5" }) { return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg> }
function ArrowLeftIcon({ className="w-6 h-6" }) { return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg> }
function ChevronDownIcon({ className="w-4 h-4" }) { return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg> }

interface Product {
  id: string
  name: string
  price: number
  category: string
  is_sold_out: boolean
  image_url: string
}

// All 18 Categories explicitly defined
const CATEGORY_LIST = [
  "All Items",
  "Necklaces", "Long Haram", "Chokers", "Attigai", "Chains",
  "Jhumkas & Studs", "Mattal", "Micro Plated Earrings",
  "Bangles", "Finger Rings", "Bracelets", "Anklets",
  "Full Bridal Sets", "Semi Bridal Sets", "Combo Sets",
  "Hair Accessories", "Nethi Chutti", "Hip Chains"
]

export default function AllProductsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [products, setProducts] = useState<Product[]>([])
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('All Items')
  const [isCategoryOpen, setIsCategoryOpen] = useState(false)

  // Custom Modals State
  const [deleteTarget, setDeleteTarget] = useState<{id: string, name: string} | null>(null)
  const [statusTarget, setStatusTarget] = useState<{id: string, name: string, currentStatus: boolean} | null>(null)

  useEffect(() => {
    async function checkAndFetch() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) router.push('/login')

      const { data, error } = await supabase
        .from('products')
        .select('id, name, price, category, is_sold_out, image_url')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Fetch Error:', error)
        alert('Error loading inventory. Please refresh.')
      } else {
        setProducts(data || [])
      }
      setLoading(false)
    }
    checkAndFetch()
  }, [router])

  // 🌟 LUXURY STATUS TOGGLE FUNCTION 🌟
  const confirmStatusToggle = async () => {
    if (!statusTarget) return

    try {
      const { error } = await supabase
        .from('products')
        .update({ is_sold_out: !statusTarget.currentStatus })
        .eq('id', statusTarget.id)

      if (error) throw error

      setProducts(prev => 
        prev.map(p => p.id === statusTarget.id ? { ...p, is_sold_out: !statusTarget.currentStatus } : p)
      )
      setStatusTarget(null) // Close modal
    } catch (error: any) {
      console.error(error)
      alert('Failed to update status: ' + error.message)
      setStatusTarget(null)
    }
  }

  // 🌟 LUXURY DELETE FUNCTION 🌟
  const confirmDelete = async () => {
    if (!deleteTarget) return

    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', deleteTarget.id)

      if (error) throw error

      setProducts(prev => prev.filter(p => p.id !== deleteTarget.id))
      setDeleteTarget(null) // Close modal
    } catch (error: any) {
      console.error(error)
      alert('Failed to delete product: ' + error.message)
      setDeleteTarget(null)
    }
  }

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) || product.category.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory === 'All Items' || product.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  if (loading) {
    return (
      <div className="min-h-screen bg-[#1a0505] text-[#e5d5a3] flex flex-col items-center justify-center p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#c5a059]"></div>
        <p className="mt-6 text-[#e5d5a3]/50 text-xs font-bold uppercase tracking-widest">Loading Vault...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#1a0505] text-[#e5d5a3] font-sans p-8 pb-24 relative">
      
      {/* 🌟 ELITE STATUS TOGGLE MODAL 🌟 */}
      {statusTarget && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm animate-fade-in px-4">
              <div className="bg-[#2a0808] border border-[#c5a059]/30 p-8 rounded-lg shadow-[0_0_40px_rgba(197,160,89,0.1)] max-w-md w-full text-center">
                  <div className="flex justify-center mb-4 text-[#c5a059]">
                    <CheckIcon className="w-10 h-10" />
                  </div>
                  <h3 className="font-serif text-2xl text-[#f4e4bc] mb-2">Update Availability</h3>
                  <p className="text-[#e5d5a3]/70 text-sm mb-8 leading-relaxed">
                      Are you sure you want to mark <br/><strong className="text-white">"{statusTarget.name}"</strong><br/> as <strong className="text-[#c5a059]">{statusTarget.currentStatus ? 'AVAILABLE' : 'SOLD OUT'}</strong>?
                  </p>
                  <div className="flex gap-4 justify-center">
                      <button onClick={() => setStatusTarget(null)} className="w-full px-6 py-3 border border-[#e5d5a3]/30 rounded text-[#e5d5a3] text-xs font-bold uppercase tracking-widest hover:border-[#e5d5a3] transition-all">Cancel</button>
                      <button onClick={confirmStatusToggle} className="w-full px-6 py-3 bg-[#c5a059] text-[#1a0505] rounded text-xs font-bold uppercase tracking-widest hover:bg-white transition-all shadow-lg flex items-center justify-center gap-2">
                        Confirm
                      </button>
                  </div>
              </div>
          </div>
      )}

      {/* 🌟 ELITE DELETE MODAL 🌟 */}
      {deleteTarget && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm animate-fade-in px-4">
              <div className="bg-[#2a0808] border border-[#c5a059]/30 p-8 rounded-lg shadow-[0_0_40px_rgba(197,160,89,0.1)] max-w-md w-full text-center">
                  <div className="flex justify-center mb-4 text-[#c5a059]">
                    <AlertIcon className="w-10 h-10" />
                  </div>
                  <h3 className="font-serif text-2xl text-[#f4e4bc] mb-2">Remove Item</h3>
                  <p className="text-[#e5d5a3]/70 text-sm mb-8 leading-relaxed">
                      Are you sure you want to permanently remove <br/><strong className="text-white">"{deleteTarget.name}"</strong> from your inventory?
                  </p>
                  <div className="flex gap-4 justify-center">
                      <button onClick={() => setDeleteTarget(null)} className="w-full px-6 py-3 border border-[#e5d5a3]/30 rounded text-[#e5d5a3] text-xs font-bold uppercase tracking-widest hover:border-[#e5d5a3] transition-all">Cancel</button>
                      <button onClick={confirmDelete} className="w-full px-6 py-3 bg-red-900/50 border border-red-500/50 text-red-200 rounded text-xs font-bold uppercase tracking-widest hover:bg-red-800 hover:text-white transition-all shadow-lg flex items-center justify-center gap-2">
                        <TrashIcon className="w-4 h-4" /> Remove
                      </button>
                  </div>
              </div>
          </div>
      )}

      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between mb-10 gap-6">
        
        {/* Sleek Back Button & Title */}
        <div className="flex items-center gap-4">
          <Link href="/admin" className="text-[#e5d5a3]/50 hover:text-white transition-colors p-2 -ml-2 rounded-full hover:bg-[#e5d5a3]/10">
            <ArrowLeftIcon className="w-6 h-6" />
          </Link>
          <div>
            <h1 className="font-serif text-3xl text-[#f4e4bc] mb-1">Master Inventory</h1>
            <p className="text-xs text-[#e5d5a3]/50 uppercase tracking-widest">{products.length} Treasures in Vault</p>
          </div>
        </div>
        
        <div className="flex flex-col md:flex-row w-full md:w-auto gap-4">
          
          {/* Custom Headless Dropdown for Category Filter */}
          <div className="relative w-full md:w-48 z-20">
            <div 
                onClick={() => setIsCategoryOpen(!isCategoryOpen)}
                className="w-full bg-[#2a0808] border border-[#e5d5a3]/20 py-3 px-4 text-[#e5d5a3] hover:border-[#c5a059]/50 outline-none rounded transition-all cursor-pointer flex justify-between items-center text-xs font-bold uppercase tracking-widest"
            >
                <span className="truncate">{selectedCategory}</span>
                <ChevronDownIcon className={`w-4 h-4 text-[#c5a059] transition-transform duration-300 ${isCategoryOpen ? 'rotate-180' : ''}`} />
            </div>

            {isCategoryOpen && (
                <>
                    <div className="fixed inset-0 z-10" onClick={() => setIsCategoryOpen(false)}></div>
                    <div className="absolute z-20 w-full mt-2 bg-[#1a0505] border border-[#c5a059]/30 rounded max-h-[300px] overflow-y-auto shadow-[0_10px_40px_rgba(0,0,0,0.8)] custom-scrollbar py-2">
                        {CATEGORY_LIST.map((cat, idx) => (
                            <div 
                                key={idx}
                                onClick={() => { setSelectedCategory(cat); setIsCategoryOpen(false); }}
                                className={`px-4 py-2.5 text-[10px] uppercase tracking-widest cursor-pointer transition-all duration-200 border-l-2 ${
                                    selectedCategory === cat 
                                    ? 'bg-[#c5a059]/10 text-[#c5a059] border-[#c5a059] font-bold' 
                                    : 'text-[#e5d5a3]/60 hover:bg-[#c5a059]/5 hover:text-[#e5d5a3] border-transparent'
                                }`}
                            >
                                {cat}
                            </div>
                        ))}
                    </div>
                </>
            )}
          </div>

          {/* Search Bar */}
          <div className="relative w-full md:w-72">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#e5d5a3]/40" />
            <input 
              type="text" 
              placeholder="Search by name..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-[#2a0808] border border-[#e5d5a3]/20 py-3 pl-10 pr-4 text-[#e5d5a3] focus:border-[#c5a059] outline-none rounded transition-all text-sm"
            />
          </div>

        </div>
      </div>

      <div className="max-w-7xl mx-auto bg-[#2a0808] border border-[#c5a059]/20 rounded-xl shadow-2xl overflow-hidden">
        {filteredProducts.length > 0 ? (
          <div className="divide-y divide-[#e5d5a3]/10">
            {filteredProducts.map((product) => (
              <div key={product.id} className="grid grid-cols-1 md:grid-cols-[100px_1fr_auto_auto_auto] gap-6 items-center p-6 hover:bg-[#c5a059]/5 transition-colors">
                
                {/* Image */}
                <div className="h-[100px] w-[100px] rounded-md border border-[#e5d5a3]/10 overflow-hidden shrink-0">
                  <img src={product.image_url} alt={product.name} className="h-full w-full object-cover" />
                </div>
                
                {/* Details */}
                <div>
                  <p className="text-[#f4e4bc] font-bold text-lg mb-1">{product.name}</p>
                  <p className="text-[10px] text-[#e5d5a3]/50 uppercase tracking-widest mb-2">
                    {product.category}
                  </p>
                  <p className="font-serif text-[#c5a059]">₹{product.price.toLocaleString("en-IN")}</p>
                </div>

                {/* Status Badge */}
                <div className="flex justify-start md:justify-center w-full md:w-32">
                  {product.is_sold_out ? (
                    <div className="bg-red-900/20 border border-red-500/30 text-red-400 text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded flex items-center gap-2">
                      <AlertIcon className="h-3 w-3" /> Sold Out
                    </div>
                  ) : (
                    <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded flex items-center gap-2">
                      <CheckIcon className="h-3 w-3" /> Available
                    </div>
                  )}
                </div>

                {/* Toggle Status Button */}
                <div className="w-full md:w-40">
                  {product.is_sold_out ? (
                    <button 
                      onClick={() => setStatusTarget({ id: product.id, name: product.name, currentStatus: true })} 
                      className="w-full border border-[#c5a059] text-[#c5a059] py-2.5 rounded text-[10px] font-bold uppercase tracking-widest hover:bg-[#c5a059] hover:text-[#1a0505] transition-all flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(197,160,89,0.1)]"
                    >
                      Make Available
                    </button>
                  ) : (
                    <button 
                      onClick={() => setStatusTarget({ id: product.id, name: product.name, currentStatus: false })} 
                      className="w-full border border-red-500/50 text-red-400 py-2.5 rounded text-[10px] font-bold uppercase tracking-widest hover:bg-red-900/50 hover:border-red-500 transition-all flex items-center justify-center gap-2"
                    >
                      Mark Sold Out
                    </button>
                  )}
                </div>

                {/* View & Delete Buttons */}
                <div className="flex gap-2 w-full md:w-auto">
                  <Link 
                    href={`/product/${product.id}`} 
                    target="_blank" 
                    className="flex-1 md:flex-none border border-[#e5d5a3]/20 text-[#e5d5a3] px-4 py-2.5 rounded text-[10px] font-bold uppercase tracking-widest hover:bg-[#e5d5a3] hover:text-[#1a0505] transition-all flex items-center justify-center gap-1.5"
                  >
                    View <ArrowRightIcon className="h-3 w-3" />
                  </Link>
                  <button 
                    onClick={() => setDeleteTarget({ id: product.id, name: product.name })} 
                    className="px-4 py-2.5 border border-red-900 bg-red-950/50 text-red-500 rounded hover:bg-red-600 hover:text-white transition-colors"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                </div>

              </div>
            ))}
          </div>
        ) : (
          <div className="p-20 text-center flex flex-col items-center gap-4">
            <AlertIcon className="h-12 w-12 text-[#e5d5a3]/20" />
            <p className="font-serif text-2xl text-[#f4e4bc]">No Treasures Found</p>
            {products.length === 0 ? (
              <p className="text-[#e5d5a3]/50 text-sm">The vault is currently empty.</p>
            ) : (
              <p className="text-[#e5d5a3]/50 text-sm">No items match your search term or category filter.</p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}