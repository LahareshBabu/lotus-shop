'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import Script from 'next/script'

// CONFIGURATION
const supabaseUrl = "https://fwyliqsazdyprlkemavu.supabase.co"
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ3eWxpcXNhemR5cHJsa2VtYXZ1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAzOTg2MzIsImV4cCI6MjA4NTk3NDYzMn0.dXkx1pEtiZ5uwcQJgisJs14ZyUJTuz-SomMCeZv-jbE"
const supabase = createClient(supabaseUrl, supabaseKey)
const RAZORPAY_KEY_ID = "rzp_test_YourKeyHere" 

// 🌟 ICONS
function HeartIcon({ filled, className }: { filled: boolean, className?: string }) { return <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth={2} className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" /></svg> }
function StarIcon({ filled, className = "h-4 w-4" }: { filled: boolean, className?: string }) { return <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg> }
function CheckIcon({ className = "h-5 w-5" }: { className?: string }) { return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg> }
function ShoppingBagIcon({ className = "h-5 w-5" }: { className?: string }) { return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4zM3 6h18M16 10a4 4 0 01-8 0" /></svg> }

function StarRatingDisplay({ rating }: { rating: number }) { return <div className="flex text-[#c5a059]">{[1, 2, 3, 4, 5].map((star) => (<StarIcon key={star} filled={star <= Math.round(rating)} />))}</div> }
function StarRatingInput({ rating, setRating }: { rating: number, setRating: (r: number) => void }) { const [hover, setHover] = useState(0); return <div className="flex gap-1">{[1, 2, 3, 4, 5].map((star) => { const isFilled = star <= (hover || rating); return <button key={star} type="button" className={`focus:outline-none transition-colors duration-200 ${isFilled ? 'text-[#c5a059]' : 'text-[#e5d5a3]/30'}`} onClick={() => setRating(star)} onMouseEnter={() => setHover(star)} onMouseLeave={() => setHover(rating)}><StarIcon filled={true} className="h-6 w-6" /></button> })}</div> }

// 🌟 PRODUCT CARD (Keep unchanged)
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
                <img src={product.image_url} alt={product.name} onLoad={() => setImgLoaded(true)} className={`h-full w-full object-cover transition-transform duration-500 group-hover:scale-110 ${imgLoaded ? 'image-loaded' : 'image-loading'}`} /> 
            : 
                <div className="flex flex-col items-center justify-center text-[#e5d5a3]/30 h-full"><span className="font-serif text-lg tracking-widest">IMAGE</span></div>
            }
        </Link>
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
            <button onClick={(e) => { e.preventDefault(); onAddToCart(product); setAddedEffect(true); setTimeout(() => setAddedEffect(false), 2000); }} className={`w-full py-3 font-sans text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2 transition-all duration-300 ${addedEffect ? "bg-green-700 text-white" : "bg-[#e5d5a3] text-[#1a0505] hover:bg-white"}`}>
                {addedEffect ? (<div className="flex items-center gap-2"><CheckIcon className="h-5 w-5 animate-check" /> <span className="animate-pulse">Added</span></div>) : (<><ShoppingBagIcon className="h-4 w-4" /> Add to Cart</>)}
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

export default function ProductPage() {
  const params: any = useParams()
  const router = useRouter()
  const [product, setProduct] = useState<any>(null)
  const [relatedProducts, setRelatedProducts] = useState<any[]>([])
  const [isFallback, setIsFallback] = useState(false) 
  const [loading, setLoading] = useState(true)
  const [buying, setBuying] = useState(false)
  const [isWishlisted, setIsWishlisted] = useState(false)
  const [addedToCart, setAddedToCart] = useState(false)
  const [reviews, setReviews] = useState<any[]>([])
  const [user, setUser] = useState<any>(null)
  const [avgRating, setAvgRating] = useState(0)
  const [reviewForm, setReviewForm] = useState({ rating: 0, comment: '' })
  const [submitting, setSubmitting] = useState(false)
  const [wishlist, setWishlist] = useState<any[]>([])
  
  const [activeImage, setActiveImage] = useState<string>("")
  const [animKey, setAnimKey] = useState(0)

  const fetchReviews = async (productId: string) => {
      const { data } = await supabase.from('reviews').select('*').eq('product_id', productId).order('created_at', { ascending: false })
      if (data) {
          setReviews(data)
          if (data.length > 0) { const total = data.reduce((acc, r) => acc + r.rating, 0); setAvgRating(total / data.length) } else { setAvgRating(0) }
      }
  }

  useEffect(() => {
    async function fetchData() {
      const { data: { session } } = await supabase.auth.getSession(); if (session) setUser(session.user)
      const { data: mainProduct } = await supabase.from('products').select('*').eq('id', params.id).single()
      setProduct(mainProduct)

      if (mainProduct) {
        setActiveImage(mainProduct.image_url)
        let { data: relatedItems } = await supabase.from('products').select('*').eq('category', mainProduct.category).neq('id', mainProduct.id).limit(4)
        if (!relatedItems || relatedItems.length === 0) {
             const { data: fallbackItems } = await supabase.from('products').select('*').neq('id', mainProduct.id).limit(4)
             relatedItems = fallbackItems;
             setIsFallback(true) 
        } else {
             setIsFallback(false)
        }
        setRelatedProducts(relatedItems || [])
        const currentWishlist = JSON.parse(localStorage.getItem('wishlist') || '[]'); setWishlist(currentWishlist)
        setIsWishlisted(currentWishlist.some((item: any) => item.id === mainProduct.id))
        await fetchReviews(mainProduct.id)
        const viewed = JSON.parse(localStorage.getItem('recentlyViewed') || '[]'); const newViewed = [mainProduct, ...viewed.filter((p: any) => p.id !== mainProduct.id)].slice(0, 10); localStorage.setItem('recentlyViewed', JSON.stringify(newViewed))
      }
      setLoading(false)
    }
    if (params.id) fetchData()
  }, [params.id])

  const switchImage = (url: string) => {
      if (url === activeImage) return;
      setActiveImage(url)
      setAnimKey(prev => prev + 1)
  }

  const handleBuyNow = () => {
    if (!user) return alert("Please log in to purchase.")
    setBuying(true)
    const amount = product.price * 100 
    const options = {
        key: RAZORPAY_KEY_ID,
        amount: amount,
        currency: "INR",
        name: "LOTUS Jewelry",
        description: `Purchase: ${product.name}`,
        image: "https://fwyliqsazdyprlkemavu.supabase.co/storage/v1/object/public/jewelry-images/banner.jpg",
        handler: async function (response: any) { 
            const orderId = `ORD-${Date.now()}`
            const { error } = await supabase.from('orders').insert({ id: orderId, user_id: user.id, items: [product], total: product.price, status: 'Processing' })
            if (error) { console.error(error); alert("Order error.") } else { alert("Success!"); router.push('/account') }
            setBuying(false); 
        },
        theme: { color: "#c5a059" }
    };
    if (!RAZORPAY_KEY_ID || RAZORPAY_KEY_ID === "rzp_test_YourKeyHere") {
        // @ts-ignore
        options.handler({}) 
        return
    }
    const rzp1 = new (window as any).Razorpay(options);
    rzp1.open();
  }

  const handleAddToCart = (itemToAdd = product) => {
    const existing = JSON.parse(localStorage.getItem('cart') || '[]'); const existingIndex = existing.findIndex((i: any) => i.id === itemToAdd.id)
    let newCart; if (existingIndex > -1) { newCart = [...existing]; newCart[existingIndex].quantity = (newCart[existingIndex].quantity || 1) + 1 } else { newCart = [...existing, { ...itemToAdd, quantity: 1 }] }
    localStorage.setItem('cart', JSON.stringify(newCart)); if (itemToAdd.id === product.id) { setAddedToCart(true); setTimeout(() => setAddedToCart(false), 2000) }
  }

  const toggleWishlist = () => { const existing = JSON.parse(localStorage.getItem('wishlist') || '[]'); let updated; if (isWishlisted) { updated = existing.filter((p: any) => p.id !== product.id); setIsWishlisted(false) } else { updated = [...existing, product]; setIsWishlisted(true) } setWishlist(updated); localStorage.setItem('wishlist', JSON.stringify(updated)) }
  const toggleWishlistRecommendation = (item: any) => { const exists = wishlist.find(i => i.id === item.id); let newW; if(exists) newW = wishlist.filter(i => i.id !== item.id); else newW = [...wishlist, item]; setWishlist(newW); localStorage.setItem('wishlist', JSON.stringify(newW)) }
  const handleSubmitReview = async (e: React.FormEvent) => { e.preventDefault(); if (!user) return alert("Please log in first."); if (reviewForm.rating === 0) return alert("Please give a star rating."); setSubmitting(true); const { error } = await supabase.from('reviews').insert({ product_id: product.id, user_id: user.id, user_email: user.email, rating: reviewForm.rating, comment: reviewForm.comment }); if (error) { alert("Error: " + error.message) } else { setReviewForm({ rating: 0, comment: '' }); await fetchReviews(product.id) } setSubmitting(false) }

  if (loading) return <div className="min-h-screen bg-[#1a0505] flex items-center justify-center text-[#e5d5a3] animate-pulse font-serif">Loading royal treasure...</div>
  if (!product) return <div className="min-h-screen bg-[#1a0505] flex items-center justify-center text-[#e5d5a3] font-serif">Product not found.</div>

  const getCategorySlug = () => { const params = new URLSearchParams(); params.set('sourceId', product.id); params.set('fallback', isFallback.toString()); params.set('cat', product.category); return `shop/recommendations?${params.toString()}` }

  return (
    <div className="min-h-screen bg-[#1a0505] text-[#e5d5a3] font-sans pb-20">
      <Script src="https://checkout.razorpay.com/v1/checkout.js" />
      <div className="p-6 border-b border-[#e5d5a3]/10 flex justify-between items-center sticky top-0 bg-[#1a0505]/95 backdrop-blur z-50">
         <Link href="/" className="font-serif text-2xl font-bold tracking-widest text-[#e5d5a3]">LOTUS</Link>
         <Link href="/" className="text-sm hover:text-white border-b border-transparent hover:border-[#e5d5a3] transition-all">← Back Home</Link>
      </div>

      <div className="max-w-7xl mx-auto p-4 md:p-12 grid grid-cols-1 lg:grid-cols-2 gap-12">
        
        {/* 🌟 LEFT SIDE: GALLERY 🌟 */}
        <div className="self-start sticky top-24">
            <div className="bg-[#2a0808] border border-[#e5d5a3]/20 p-2 relative shadow-2xl rounded group overflow-hidden">
                <div className="aspect-[3/4] bg-[#1a0505] flex items-center justify-center overflow-hidden relative rounded-sm">
                    {/* 🌟 MAIN IMAGE (No Zoom) */}
                    {activeImage ? 
                        <img 
                            key={animKey}
                            src={activeImage} 
                            // 🌟 ZOOM REMOVED (No group-hover:scale-110)
                            className="w-full h-full object-cover rounded-sm animate-fade-in" 
                        /> 
                    : <span className="text-[#e5d5a3]/30 tracking-widest">IMAGE</span>}
                </div>
                <button onClick={toggleWishlist} className={`md:hidden absolute top-4 right-4 h-10 w-10 bg-[#1a0505]/80 backdrop-blur rounded-full flex items-center justify-center border transition-colors z-10 ${isWishlisted ? 'border-[#c5a059] text-red-600' : 'border-[#e5d5a3]/30 text-[#e5d5a3]'}`}><HeartIcon filled={isWishlisted} className="h-5 w-5" /></button>
            </div>

            {/* 🌟 THUMBNAIL STRIP (Apple Style) 🌟 */}
            {product.gallery && product.gallery.length > 1 && (
                // 🌟 SCROLLBAR HIDDEN
                <div className="flex gap-4 mt-6 overflow-x-auto pb-4 px-1 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']">
                    {product.gallery.map((img: string, idx: number) => (
                        <button key={idx} className="relative group/thumb cursor-pointer pb-2" onClick={() => switchImage(img)}>
                            {/* THUMBNAIL */}
                            <div className={`w-20 h-20 rounded-lg border overflow-hidden transition-all duration-300 ${activeImage === img ? 'border-[#e5d5a3]/50 opacity-100' : 'border-transparent opacity-50 hover:opacity-100'}`}>
                                <img src={img} className="w-full h-full object-cover" />
                            </div>
                            
                            {/* 🌟 INTERACTIVE LINE LOGIC */}
                            {/* 1. Active: Solid Gold Line (w-8) */}
                            {/* 2. Hover (Inactive): Cream Line (w-8) appears */}
                            <div className={`absolute bottom-0 left-1/2 -translate-x-1/2 h-0.5 rounded-full transition-all duration-300 ease-out 
                                ${activeImage === img 
                                    ? 'w-8 bg-[#c5a059] opacity-100' // Selected
                                    : 'w-0 opacity-0 group-hover/thumb:w-8 group-hover/thumb:bg-[#e5d5a3] group-hover/thumb:opacity-70' // Hover Effect
                                }`}>
                            </div>
                        </button>
                    ))}
                </div>
            )}
        </div>

        {/* RIGHT SIDE: INFO (Unchanged) */}
        <div className="flex flex-col">
            <h1 className="text-3xl md:text-5xl font-serif text-[#f4e4bc] mb-2 leading-tight">{product.name}</h1>
            <div className="flex items-center gap-2 mb-6 text-sm"><StarRatingDisplay rating={avgRating} /><span className="text-[#e5d5a3]/50 hover:text-[#e5d5a3] cursor-pointer border-b border-[#e5d5a3]/30">{reviews.length} ratings</span></div>
            <div className="h-px w-full bg-[#e5d5a3]/10 mb-6"></div>
            <p className="text-4xl text-[#c5a059] mb-2 font-serif">₹{product.price.toLocaleString("en-IN")}</p>
            <p className="text-[#e5d5a3]/50 text-xs uppercase tracking-wider mb-8">Inclusive of all taxes</p>
            
            <div className="space-y-3 mb-8">
                <button onClick={handleBuyNow} disabled={buying} className="w-full bg-[#c5a059] text-[#1a0505] py-4 font-bold uppercase tracking-widest hover:bg-[#e5d5a3] transition-all shadow-lg text-sm md:text-base disabled:opacity-50 rounded">{buying ? "Processing..." : "Buy Now"}</button>
                <div className="flex gap-3">
                    <button onClick={() => handleAddToCart(product)} className={`flex-1 border py-4 font-bold uppercase tracking-widest transition-all text-sm md:text-base rounded flex items-center justify-center gap-2 ${addedToCart ? "bg-green-800 border-green-800 text-white" : "bg-[#2a0808] border-[#c5a059] text-[#c5a059] hover:bg-[#c5a059]/10"}`}>{addedToCart ? (<><CheckIcon className="h-5 w-5 animate-check" /> Added</>) : ("Add to Cart")}</button>
                    <button onClick={toggleWishlist} className={`px-6 border transition-all flex items-center justify-center rounded ${isWishlisted ? 'border-[#c5a059] text-red-600 bg-[#c5a059]/10' : 'border-[#e5d5a3]/30 text-[#e5d5a3] hover:border-[#c5a059] hover:text-[#c5a059]'}`}><HeartIcon filled={isWishlisted} className="h-6 w-6" /></button>
                </div>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center text-[10px] text-[#e5d5a3]/60 mb-8"><div className="bg-[#2a0808] p-3 rounded flex flex-col items-center gap-2"><span className="text-xl">✨</span><span>Premium Polish</span></div><div className="bg-[#2a0808] p-3 rounded flex flex-col items-center gap-2"><span className="text-xl">🚚</span><span>Fast Delivery</span></div><div className="bg-[#2a0808] p-3 rounded flex flex-col items-center gap-2"><span className="text-xl">🔒</span><span>Secure Pay</span></div></div>
            
            <div className="mb-8">
                <h3 className="font-bold text-[#f4e4bc] mb-4 text-lg">About this item</h3>
                <div className="text-[#e5d5a3]/80 text-sm leading-relaxed whitespace-pre-line">{product.description || "Inspired by the heritage jewelry of ancient Indian royalty. Perfect for weddings and special occasions."}</div>
            </div>
        </div>
      </div>

      {relatedProducts.length > 0 && (
          <section className="max-w-7xl mx-auto px-4 md:px-12 py-16 border-t border-[#e5d5a3]/10">
              <div className="flex justify-between items-end mb-8"><h2 className="font-serif text-2xl text-[#f4e4bc] tracking-wide">You Might Also Like</h2><Link href={`/${getCategorySlug()}`} className="text-xs text-[#c5a059] border-b border-[#c5a059] pb-1 hover:text-white hover:border-white transition-all uppercase tracking-widest">View Full Collection</Link></div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">{relatedProducts.map((item) => (<ProductCard key={item.id} product={item} onAddToCart={() => handleAddToCart(item)} isWishlisted={wishlist.some(w => w.id === item.id)} onToggleWishlist={toggleWishlistRecommendation} />))}</div>
          </section>
      )}

      <div className="max-w-7xl mx-auto px-4 md:px-12 pt-8 border-t border-[#e5d5a3]/10">
        <h2 className="font-serif text-2xl text-[#f4e4bc] mb-8">Customer Reviews</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <div className="bg-[#2a0808]/50 p-6 border border-[#e5d5a3]/10 rounded h-fit">
                <h3 className="text-[#f4e4bc] font-bold mb-4">Write a Review</h3>
                {user ? (<form onSubmit={handleSubmitReview} className="space-y-4"><div><label className="text-xs text-[#e5d5a3]/50 uppercase tracking-wider mb-2 block">Rating</label><StarRatingInput rating={reviewForm.rating} setRating={(r) => setReviewForm({...reviewForm, rating: r})} /></div><div><label className="text-xs text-[#e5d5a3]/50 uppercase tracking-wider mb-2 block">Comment</label><textarea rows={3} required placeholder="Share your thoughts..." value={reviewForm.comment} onChange={(e) => setReviewForm({...reviewForm, comment: e.target.value})} className="w-full bg-[#1a0505] border border-[#e5d5a3]/20 p-3 text-[#e5d5a3] outline-none focus:border-[#c5a059] rounded text-sm resize-none"></textarea></div><button disabled={submitting} className="w-full bg-[#c5a059] text-[#1a0505] py-3 text-xs font-bold uppercase tracking-widest hover:bg-[#e5d5a3] rounded disabled:opacity-50">{submitting ? "Submitting..." : "Submit Review"}</button></form>) : (<div className="text-center py-6"><p className="text-[#e5d5a3]/60 text-sm mb-4">Please log in to share your experience.</p><div className="inline-block px-4 py-2 border border-[#e5d5a3]/30 text-[#e5d5a3] text-xs font-bold uppercase tracking-widest rounded opacity-50">Login Required</div></div>)}
            </div>
            <div className="space-y-6">
                {reviews.length === 0 ? <p className="text-[#e5d5a3]/40 italic text-sm">No reviews yet.</p> : reviews.map((review) => (
                        <div key={review.id} className="bg-[#2a0808]/30 p-6 border border-[#e5d5a3]/10 rounded"><div className="flex items-center gap-2 mb-2"><div className="h-8 w-8 rounded-full bg-[#e5d5a3] text-[#1a0505] flex items-center justify-center font-bold text-xs uppercase">{review.user_email ? review.user_email.charAt(0) : 'U'}</div><span className="text-[#f4e4bc] font-bold text-sm">{review.user_email ? review.user_email.split('@')[0] : 'Customer'}</span></div><div className="flex gap-2 items-center mb-2"><StarRatingDisplay rating={review.rating} /></div><p className="text-[#e5d5a3]/50 text-xs mb-4">Reviewed on {new Date(review.created_at).toLocaleDateString()}</p><p className="text-[#e5d5a3]/80 text-sm leading-relaxed">{review.comment}</p></div>
                    ))}
            </div>
        </div>
      </div>
    </div>
  )
}