'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/app/supabase'

function ArrowLeft({ className="h-5 w-5" }) { return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg> }
function TrashIcon({ className="h-4 w-4" }) { return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg> }
function UploadIcon({ className="h-6 w-6" }) { return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg> }
function SparklesIcon({ className="h-4 w-4" }) { return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" /></svg> }

export default function ManageBannersPage() {
    const router = useRouter()
    const [banners, setBanners] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [uploading, setUploading] = useState(false)

    // 🌟 THE FIX: Start empty. Optional fields for inheritance. 🌟
    const [tag, setTag] = useState("")
    const [titlePrefix, setTitlePrefix] = useState("")
    const [titleHighlight, setTitleHighlight] = useState("")
    const [titleSuffix, setTitleSuffix] = useState("")
    const [descText, setDescText] = useState("")
    const [btnText, setBtnText] = useState("")
    const [imageFile, setImageFile] = useState<File | null>(null)
    const [previewUrl, setPreviewUrl] = useState<string | null>(null)

    useEffect(() => {
        fetchBanners()
    }, [])

    const fetchBanners = async () => {
        const { data, error } = await supabase.from('hero_banners').select('*').order('created_at', { ascending: true })
        if (!error && data) setBanners(data)
        setLoading(false)
    }

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0]
            setImageFile(file)
            setPreviewUrl(URL.createObjectURL(file))
        }
    }

    const handlePublish = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!imageFile) return alert("Please select a banner image.")
        setUploading(true)

        try {
            const fileName = `banner-${Date.now()}-${imageFile.name.replace(/[^a-zA-Z0-9]/g, '')}`
            const { error: uploadError } = await supabase.storage.from('jewelry-images').upload(fileName, imageFile)
            if (uploadError) throw uploadError

            const { data: { publicUrl } } = supabase.storage.from('jewelry-images').getPublicUrl(fileName)

            const { error: dbError } = await supabase.from('hero_banners').insert({
                tag, title_prefix: titlePrefix, title_highlight: titleHighlight, 
                title_suffix: titleSuffix, desc_text: descText, btn_text: btnText, image_url: publicUrl
            })
            if (dbError) throw dbError

            // Reset form and refresh
            setTag(""); setTitlePrefix(""); setTitleHighlight(""); setTitleSuffix(""); setDescText(""); setBtnText("");
            setImageFile(null); setPreviewUrl(null);
            fetchBanners()
        } catch (error: any) {
            alert("Error publishing banner: " + error.message)
        } finally {
            setUploading(false)
        }
    }

    const deleteBanner = async (id: number) => {
        if (!confirm("Remove this banner from the homepage?")) return
        await supabase.from('hero_banners').delete().eq('id', id)
        setBanners(prev => prev.filter(b => b.id !== id))
    }

    if (loading) return <div className="min-h-screen bg-[#1a0505] flex items-center justify-center text-[#c5a059]">Loading...</div>

    return (
        <div className="min-h-screen bg-[#1a0505] text-[#e5d5a3] font-sans p-8 pb-24 relative overflow-hidden">
            {/* Ambient Background Glow */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-[#c5a059]/10 blur-[150px] rounded-full pointer-events-none"></div>

            <div className="max-w-7xl mx-auto mb-10 relative z-10">
                {/* 🌟 RESTORED BACK BUTTON 🌟 */}
                <Link href="/admin" className="inline-flex items-center gap-2 text-[#e5d5a3]/50 hover:text-[#c5a059] transition-colors mb-6">
                    <ArrowLeft className="h-4 w-4" />
                    <span className="text-[10px] font-bold uppercase tracking-widest">Back to Dashboard</span>
                </Link>
                <h1 className="font-serif text-3xl md:text-4xl text-[#f4e4bc] tracking-wide drop-shadow-md">Manage Banners</h1>
            </div>

            <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-12 relative z-10">
                
                {/* ACTIVE BANNERS LIST */}
                <div className="flex flex-col gap-6">
                    <div className="flex justify-between items-end border-b border-[#c5a059]/30 pb-4">
                        <h2 className="font-serif text-2xl text-[#c5a059] flex items-center gap-2">
                            <SparklesIcon className="h-6 w-6" /> Active Banners
                        </h2>
                        <span className="text-xs uppercase tracking-widest text-[#1a0505] font-bold bg-[#c5a059] px-4 py-1.5 rounded shadow-lg">{banners.length} Live</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        {banners.length === 0 ? <div className="col-span-full p-12 border border-dashed border-[#e5d5a3]/20 bg-[#2a0808]/30 rounded-xl text-center text-[#e5d5a3]/50 text-sm">The hero sequence is empty. The storefront relies on these visuals!</div> : null}
                        
                        {banners.map((banner, idx) => {
                            const hasCustomText = banner.title_prefix || banner.title_highlight || banner.title_suffix;
                            
                            return (
                                <div key={banner.id} className="bg-[#1a0505] border border-[#c5a059]/20 rounded-xl overflow-hidden shadow-[0_10px_30px_rgba(0,0,0,0.8)] relative group hover:border-[#c5a059] transition-all duration-300 hover:-translate-y-1">
                                    <div className="h-56 w-full overflow-hidden relative">
                                        <img src={banner.image_url} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                                        <div className="absolute inset-0 bg-gradient-to-t from-[#1a0505] via-[#1a0505]/70 to-transparent opacity-90"></div>
                                        
                                        {/* 🌟 SLEEK LUXURY BADGES WITH SMOOTH CORNERS 🌟 */}
                                        <div className="absolute top-4 left-4 bg-[#1a0505]/90 backdrop-blur-md border border-[#c5a059]/40 px-3.5 py-1.5 rounded-lg text-[10px] uppercase tracking-[0.15em] text-[#c5a059] font-bold shadow-xl">
                                            {idx === 0 ? 'Primary Banner' : `Slide 0${idx + 1}`}
                                        </div>
                                        
                                        {/* Preview Text Overlay */}
                                        <div className="absolute bottom-5 left-5 right-5 text-left">
                                            {hasCustomText ? (
                                                <>
                                                    {banner.tag && <p className="text-[9px] uppercase tracking-widest text-[#c5a059] mb-1.5 font-bold">{banner.tag}</p>}
                                                    <p className="font-serif text-base text-[#f4e4bc] leading-snug truncate drop-shadow-lg">{banner.title_prefix} <i className="text-[#c5a059]">{banner.title_highlight}</i> {banner.title_suffix}</p>
                                                </>
                                            ) : (
                                                <p className="font-serif text-sm text-[#e5d5a3]/60 italic truncate">Inherits Primary Text</p>
                                            )}
                                        </div>
                                    </div>
                                    <button onClick={() => deleteBanner(banner.id)} className="absolute top-4 right-4 bg-red-600 text-white p-2.5 rounded-lg hover:bg-red-500 transition-all opacity-0 group-hover:opacity-100 shadow-xl border border-red-400/50 hover:scale-110">
                                        <TrashIcon className="h-4 w-4" />
                                    </button>
                                </div>
                            )
                        })}
                    </div>
                </div>

                {/* ADD NEW BANNER FORM */}
                <div className="bg-[#1a0505] border border-[#c5a059]/40 p-8 rounded-xl shadow-[0_0_40px_rgba(197,160,89,0.15)] h-fit sticky top-24 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#c5a059] to-transparent"></div>

                    <h2 className="font-serif text-2xl text-[#f4e4bc] mb-2 drop-shadow-sm">Deploy New Visual</h2>
                    <p className="text-xs text-[#e5d5a3]/60 mb-8 leading-relaxed">Note: Upload an image. Leave text fields completely blank to automatically inherit the cinematic text from your Primary Banner.</p>
                    
                    <form onSubmit={handlePublish} className="space-y-6">
                        
                        {/* Elite Clean Image Upload Box */}
                        <div className="mb-6">
                            {previewUrl ? (
                                <div className="relative w-full h-48 rounded-xl border border-[#c5a059] overflow-hidden shadow-2xl">
                                    <img src={previewUrl} className="w-full h-full object-cover" />
                                    <button type="button" onClick={() => {setImageFile(null); setPreviewUrl(null)}} className="absolute top-3 right-3 bg-red-600/90 p-2 rounded text-white hover:bg-red-500 z-10 backdrop-blur transition-all shadow-lg border border-red-400/50"><TrashIcon className="h-4 w-4"/></button>
                                </div>
                            ) : (
                                <label className="w-full h-48 border-2 border-dashed border-[#c5a059]/40 flex flex-col items-center justify-center cursor-pointer hover:border-[#c5a059] transition-all rounded-xl bg-[#2a0808]/40 group shadow-inner">
                                    <div className="bg-[#1a0505] p-5 rounded-full group-hover:bg-[#c5a059]/20 transition-colors border border-[#c5a059]/20 group-hover:scale-110">
                                        <UploadIcon className="text-[#c5a059] h-10 w-10" />
                                    </div>
                                    <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} required />
                                </label>
                            )}
                        </div>

                        <div>
                            <label className="block text-xs uppercase tracking-widest text-[#c5a059] mb-2 font-bold">Small Top Tag</label>
                            <input value={tag} onChange={e=>setTag(e.target.value)} className="w-full bg-[#2a0808]/50 border border-[#e5d5a3]/20 p-3.5 text-sm text-[#f4e4bc] focus:border-[#c5a059] focus:ring-1 focus:ring-[#c5a059]/50 outline-none rounded shadow-inner transition-all" placeholder="e.g. Bridal Exclusives (Optional)" />
                        </div>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-[10px] md:text-xs uppercase tracking-widest text-[#c5a059] mb-2 font-bold">Title Prefix</label>
                                <input value={titlePrefix} onChange={e=>setTitlePrefix(e.target.value)} className="w-full bg-[#2a0808]/50 border border-[#e5d5a3]/20 p-3.5 text-sm text-[#f4e4bc] focus:border-[#c5a059] focus:ring-1 focus:ring-[#c5a059]/50 outline-none rounded shadow-inner transition-all" placeholder="The Royal" />
                            </div>
                            <div>
                                <label className="block text-[10px] md:text-xs uppercase tracking-widest text-[#d4af37] mb-2 font-black">Gold Highlight</label>
                                <input value={titleHighlight} onChange={e=>setTitleHighlight(e.target.value)} className="w-full bg-[#2a0808]/50 border border-[#c5a059]/50 p-3.5 text-sm text-[#d4af37] focus:border-[#c5a059] focus:ring-1 focus:ring-[#c5a059]/50 outline-none rounded shadow-inner transition-all font-semibold" placeholder="Wedding" />
                            </div>
                            <div>
                                <label className="block text-[10px] md:text-xs uppercase tracking-widest text-[#c5a059] mb-2 font-bold">Title Suffix</label>
                                <input value={titleSuffix} onChange={e=>setTitleSuffix(e.target.value)} className="w-full bg-[#2a0808]/50 border border-[#e5d5a3]/20 p-3.5 text-sm text-[#f4e4bc] focus:border-[#c5a059] focus:ring-1 focus:ring-[#c5a059]/50 outline-none rounded shadow-inner transition-all" placeholder="Edit." />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs uppercase tracking-widest text-[#c5a059] mb-2 font-bold">Main Description</label>
                            <textarea value={descText} onChange={e=>setDescText(e.target.value)} rows={2} className="w-full bg-[#2a0808]/50 border border-[#e5d5a3]/20 p-3.5 text-sm text-[#f4e4bc] focus:border-[#c5a059] focus:ring-1 focus:ring-[#c5a059]/50 outline-none rounded resize-none shadow-inner transition-all" placeholder="Optional description..." />
                        </div>

                        <div>
                            <label className="block text-xs uppercase tracking-widest text-[#c5a059] mb-2 font-bold">Button Text</label>
                            <input value={btnText} onChange={e=>setBtnText(e.target.value)} className="w-full bg-[#2a0808]/50 border border-[#e5d5a3]/20 p-3.5 text-sm text-[#f4e4bc] focus:border-[#c5a059] focus:ring-1 focus:ring-[#c5a059]/50 outline-none rounded shadow-inner transition-all" placeholder="Shop Now" />
                        </div>

                        <button disabled={uploading} className="w-full bg-gradient-to-r from-[#c5a059] to-[#d4af37] text-[#1a0505] py-4 font-black uppercase tracking-[0.2em] hover:brightness-110 transition-all shadow-[0_0_20px_rgba(197,160,89,0.4)] mt-8 disabled:opacity-50 rounded text-xs md:text-sm">
                            {uploading ? "Processing Upload..." : "Publish to Storefront"}
                        </button>
                    </form>
                </div>

            </div>
        </div>
    )
}