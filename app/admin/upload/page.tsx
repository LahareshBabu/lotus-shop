'use client'
import { useState, useEffect, Suspense } from 'react'
import { createClient } from '@supabase/supabase-js'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'

import { supabase } from '@/app/supabase'

function ArrowLeft({ className="h-5 w-5" }) { return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg> }
function UploadIcon({ className="h-8 w-8" }) { return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg> }
function CheckCircle({ className="h-16 w-16" }) { return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> }
function XIcon({ className="h-4 w-4" }) { return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg> }
function PlusIcon({ className="h-5 w-5" }) { return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg> }
function ChevronDown({ className="h-4 w-4" }) { return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg> }

// 🌟 PHASE 2.2: RENAME TO CONTENT COMPONENT FOR SUSPENSE BOUNDARY 🌟
function UploadContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const editId = searchParams.get('id') // Detect Edit Mode

  const [loading, setLoading] = useState(false)
  const [fetchingData, setFetchingData] = useState(!!editId)
  const [success, setSuccess] = useState(false)
  
  // Form State
  const [name, setName] = useState("")
  const [price, setPrice] = useState("")
  const [discount, setDiscount] = useState("0") // 🌟 NEW: Discount State
  const [category, setCategory] = useState("Necklaces")
  const [description, setDescription] = useState("")
  
  // 🌟 FIX: Array can hold null for existing DB images, and File for new uploads 🌟
  const [imageFiles, setImageFiles] = useState<(File | null)[]>([])
  const [previewUrls, setPreviewUrls] = useState<string[]>([])
  
  // Custom Dropdown State
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)

  const categoryGroups = [
    { name: "Neckwear", items: ["Necklaces", "Long Haram", "Chokers", "Attigai", "Chains"] },
    { name: "Earrings", items: ["Jhumkas & Studs", "Mattal", "Micro Plated Earrings"] },
    { name: "Bangles & Rings", items: ["Bangles", "Finger Rings", "Bracelets", "Anklets"] },
    { name: "Bridal Collection", items: ["Full Bridal Sets", "Semi Bridal Sets", "Combo Sets"] },
    { name: "Accessories", items: ["Hair Accessories", "Nethi Chutti", "Hip Chains"] },
  ]

  useEffect(() => {
    async function checkUser() {
        const { data: { session } } = await supabase.auth.getSession()
        if (!session) router.push('/login')
    }
    checkUser()
  }, [router])

  // 🌟 NEW: FETCH EXISTING DATA FOR EDIT MODE 🌟
  useEffect(() => {
    async function loadEditData() {
        if (!editId) return
        
        try {
            const { data, error } = await supabase.from('products').select('*').eq('id', editId).single()
            if (error) throw error
            
            if (data) {
                setName(data.name)
                setPrice(data.price.toString())
                setDiscount((data.discount_percentage || 0).toString()) // 🌟 NEW: Hydrate Discount
                setCategory(data.category)
                setDescription(data.description || '')
                
                const existingImages = data.gallery && data.gallery.length > 0 ? data.gallery : [data.image_url]
                const validImages = existingImages.filter(Boolean)
                
                setPreviewUrls(validImages)
                // Fill imageFiles with 'null' to represent existing URLs
                setImageFiles(new Array(validImages.length).fill(null))
            }
        } catch (error) {
            console.error("Error loading product:", error)
            alert("Could not load product details.")
        } finally {
            setFetchingData(false)
        }
    }
    loadEditData()
  }, [editId])

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files) {
          const filesArray = Array.from(e.target.files)
          const combinedFiles = [...imageFiles, ...filesArray].slice(0, 5)
          setImageFiles(combinedFiles)
          const newPreviews = [...previewUrls, ...filesArray.map(f => URL.createObjectURL(f))].slice(0, 5)
          setPreviewUrls(newPreviews)
      }
  }

  const removeImage = (index: number) => {
      const newFiles = [...imageFiles]
      newFiles.splice(index, 1)
      setImageFiles(newFiles)
      
      const newPreviews = [...previewUrls]
      newPreviews.splice(index, 1)
      setPreviewUrls(newPreviews)
  }

  const resetForm = () => {
      setName("")
      setPrice("")
      setDiscount("0")
      setDescription("")
      setImageFiles([])
      setPreviewUrls([])
      setSuccess(false)
      setLoading(false)
  }

  const handlePublish = async (e: React.FormEvent) => {
      e.preventDefault()
      // Use previewUrls length since imageFiles contains nulls for existing images
      if (previewUrls.length === 0) { alert("Please upload at least one image."); return }
      setLoading(true)

      try {
          const finalImageUrls: string[] = []
          
          for (let i = 0; i < previewUrls.length; i++) {
              if (imageFiles[i]) {
                  // It's a new file, upload it
                  const file = imageFiles[i] as File
                  const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}-${file.name.replace(/[^a-zA-Z0-9]/g, '')}`
                  const { error } = await supabase.storage.from('jewelry-images').upload(fileName, file)
                  if (error) throw error
                  const { data: { publicUrl } } = supabase.storage.from('jewelry-images').getPublicUrl(fileName)
                  finalImageUrls.push(publicUrl)
              } else {
                  // It's an existing URL from the DB, keep it
                  finalImageUrls.push(previewUrls[i])
              }
          }

          const payload = {
              name,
              price: parseFloat(price),
              discount_percentage: parseInt(discount) || 0, // 🌟 NEW: Add discount to payload
              category,
              description,
              image_url: finalImageUrls[0],
              gallery: finalImageUrls,
              // Only insert these defaults on Creation, NOT on Update
              ...(editId ? {} : { rating: 5, reviews: 0 })
          }

          if (editId) {
              // 🌟 EDIT MODE: UPDATE 🌟
              const { error: dbError } = await supabase.from('products').update(payload).eq('id', editId)
              if (dbError) throw dbError
          } else {
              // 🌟 CREATE MODE: INSERT 🌟
              const { error: dbError } = await supabase.from('products').insert(payload)
              if (dbError) throw dbError
          }
          
          setSuccess(true)

      } catch (error: any) {
          console.error(error)
          alert("Error saving: " + error.message)
          setLoading(false)
      }
  }

  if (fetchingData) {
      return <div className="min-h-screen bg-[#1a0505] flex items-center justify-center text-[#c5a059] font-serif">Loading Treasure Data...</div>
  }

  if (success) {
      return (
          <div className="min-h-screen bg-[#1a0505] flex flex-col items-center justify-center text-[#e5d5a3] animate-fade-in relative p-4">
              <button onClick={() => router.push('/admin/products')} className="absolute top-8 right-8 text-[#e5d5a3]/50 hover:text-white"><XIcon className="h-8 w-8" /></button>
              
              <div className="bg-[#2a0808] border border-[#c5a059] p-12 rounded-lg shadow-[0_0_40px_rgba(197,160,89,0.15)] text-center max-w-md w-full">
                  <div className="flex justify-center mb-6">
                      <div className="bg-[#c5a059]/10 p-4 rounded-full border border-[#c5a059]">
                          <CheckCircle className="text-[#c5a059] h-10 w-10" /> 
                      </div>
                  </div>
                  <h1 className="font-serif text-3xl text-[#f4e4bc] mb-2 tracking-wide">{editId ? 'Updated!' : 'Published!'}</h1>
                  <p className="text-[#e5d5a3]/60 mb-8 font-sans text-sm">"{name}" {editId ? 'has been successfully updated.' : 'is now live in the store.'}</p>
                  
                  <div className="flex flex-col gap-3">
                      {!editId && (
                          <button onClick={resetForm} className="w-full bg-[#c5a059] text-[#1a0505] py-4 rounded text-xs font-bold uppercase tracking-widest hover:bg-white transition-all flex items-center justify-center gap-2 shadow-lg">
                              <PlusIcon className="h-5 w-5" /> Add Another Treasure
                          </button>
                      )}
                      <button onClick={() => router.push('/admin/products')} className={`w-full ${editId ? 'bg-[#c5a059] text-[#1a0505] hover:bg-white shadow-lg' : 'border border-[#e5d5a3]/20 text-[#e5d5a3] hover:bg-[#e5d5a3] hover:text-[#1a0505]'} py-4 rounded text-xs font-bold uppercase tracking-widest transition-all`}>
                          Back to Vault
                      </button>
                  </div>
              </div>
          </div>
      )
  }

  return (
    <div className="min-h-screen bg-[#1a0505] text-[#e5d5a3] font-sans p-8">
      <div className="max-w-4xl mx-auto flex items-center gap-4 mb-10">
          <Link href="/admin/products" className="text-[#e5d5a3]/50 hover:text-white transition-colors"><ArrowLeft className="h-6 w-6" /></Link>
          <h1 className="font-serif text-2xl text-[#f4e4bc]">{editId ? 'Edit Treasure Details' : 'Add New Treasure'}</h1>
      </div>

      <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12">
          {/* LEFT: Image Gallery */}
          <div>
              <div className="grid grid-cols-2 gap-4 mb-4">
                  {previewUrls.length > 0 ? (
                      <div className="col-span-2 aspect-[3/4] rounded-lg border-2 border-[#c5a059] relative overflow-hidden group">
                          <img src={previewUrls[0]} className="absolute inset-0 w-full h-full object-cover" />
                          <div className="absolute top-2 left-2 bg-[#c5a059] text-[#1a0505] text-[10px] font-bold px-2 py-1 rounded">MAIN</div>
                          <button type="button" onClick={() => removeImage(0)} className="absolute top-2 right-2 bg-black/60 p-1 rounded-full text-white hover:bg-red-600 transition-colors z-20"><XIcon className="h-4 w-4" /></button>
                      </div>
                  ) : (
                      <label className="col-span-2 aspect-[3/4] rounded-lg border-2 border-dashed border-[#e5d5a3]/20 flex flex-col items-center justify-center bg-[#2a0808]/30 cursor-pointer hover:border-[#c5a059] hover:bg-[#2a0808]/60 transition-all group">
                          <UploadIcon className="h-10 w-10 text-[#e5d5a3]/50 group-hover:text-[#c5a059] mb-4 transition-colors" />
                          <p className="text-sm font-bold uppercase tracking-widest text-[#e5d5a3]">Click to Upload</p>
                          <p className="text-xs text-[#e5d5a3]/40 mt-2">Main Image + Gallery</p>
                          <input type="file" multiple accept="image/*" onChange={handleImageChange} className="hidden" />
                      </label>
                  )}
                  {[1, 2, 3, 4].map((i) => (
                      <div key={i} className="aspect-square rounded border border-[#e5d5a3]/10 bg-[#2a0808]/20 relative overflow-hidden flex items-center justify-center">
                          {previewUrls[i] ? (
                              <>
                                  <img src={previewUrls[i]} className="absolute inset-0 w-full h-full object-cover" />
                                  <button type="button" onClick={() => removeImage(i)} className="absolute top-1 right-1 bg-black/60 p-1 rounded-full text-white hover:bg-red-600 transition-colors z-20"><XIcon className="h-4 w-4" /></button>
                              </>
                          ) : (
                              <span className="text-[#e5d5a3]/20 text-xs font-mono">{i + 1}</span>
                          )}
                      </div>
                  ))}
              </div>
              {previewUrls.length < 5 && (
                  <label className="w-full bg-[#2a0808] border border-[#e5d5a3]/30 text-[#e5d5a3] py-3 rounded text-xs font-bold uppercase tracking-widest hover:bg-[#e5d5a3] hover:text-[#1a0505] transition-all cursor-pointer flex items-center justify-center gap-2">
                      <UploadIcon className="h-4 w-4" /> Add More Images
                      <input type="file" multiple accept="image/*" onChange={handleImageChange} className="hidden" />
                  </label>
              )}
              <p className="text-center text-[10px] text-[#e5d5a3]/30 mt-2 uppercase tracking-widest">Max 5 Images (JPG, PNG)</p>
          </div>

          {/* RIGHT: Form */}
          <form onSubmit={handlePublish} className="space-y-6 relative">
              <div>
                  <label className="block text-xs uppercase tracking-widest text-[#e5d5a3]/50 mb-2">Product Name</label>
                  <input required value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Royal Emerald Choker" className="w-full bg-[#2a0808] border border-[#e5d5a3]/20 p-4 text-[#e5d5a3] focus:border-[#c5a059] outline-none rounded transition-all" />
              </div>
              
              <div className="grid grid-cols-2 gap-6 relative">
                  <div>
                      <label className="block text-xs uppercase tracking-widest text-[#e5d5a3]/50 mb-2">Price (₹)</label>
                      <input required type="number" value={price} onChange={e => setPrice(e.target.value)} placeholder="1500" className="w-full bg-[#2a0808] border border-[#e5d5a3]/20 p-4 text-[#e5d5a3] focus:border-[#c5a059] outline-none rounded transition-all" />
                  </div>
                  <div>
                      <label className="block text-xs uppercase tracking-widest text-[#e5d5a3]/50 mb-2">Discount (%)</label>
                      <input type="number" min="0" max="100" value={discount} onChange={e => setDiscount(e.target.value)} placeholder="e.g. 20" className="w-full bg-[#2a0808] border border-[#e5d5a3]/20 p-4 text-[#e5d5a3] focus:border-[#c5a059] outline-none rounded transition-all" />
                  </div>
              </div>

              {/* 🌟 NEW: REAL-TIME DISCOUNT PREVIEW 🌟 */}
              {parseFloat(price) > 0 && parseFloat(discount) > 0 && (
                  <div className="bg-[#c5a059]/10 border border-[#c5a059]/30 p-4 rounded flex justify-between items-center shadow-inner animate-fade-in">
                      <span className="text-[#c5a059] text-[10px] font-bold uppercase tracking-widest flex items-center gap-2">
                          <CheckCircle className="h-4 w-4" /> Live Preview
                      </span>
                      <div className="flex gap-3 items-center font-sans">
                          <span className="text-[#e5d5a3]/40 line-through text-sm">₹{parseFloat(price).toLocaleString("en-IN")}</span>
                          <span className="text-[#c5a059] font-bold text-xl">₹{Math.round(parseFloat(price) - (parseFloat(price) * (parseFloat(discount) / 100))).toLocaleString("en-IN")}</span>
                      </div>
                  </div>
              )}
              
              {/* CUSTOM HEADLESS DROPDOWN */}
              <div className="relative">
                  <label className="block text-xs uppercase tracking-widest text-[#e5d5a3]/50 mb-2">Category</label>
                  <div 
                      onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                      className="w-full bg-[#2a0808] border border-[#e5d5a3]/20 p-4 text-[#e5d5a3] hover:border-[#c5a059] outline-none rounded transition-all cursor-pointer flex justify-between items-center"
                  >
                      <span>{category}</span>
                      <ChevronDown className={`h-4 w-4 text-[#c5a059] transition-transform duration-300 ${isDropdownOpen ? 'rotate-180' : ''}`} />
                  </div>

                  {isDropdownOpen && (
                      <>
                          <div className="fixed inset-0 z-10" onClick={() => setIsDropdownOpen(false)}></div>
                          
                          <div className="absolute z-20 w-full mt-2 bg-[#1a0505] border border-[#c5a059]/40 rounded max-h-[300px] overflow-y-auto shadow-[0_10px_40px_rgba(0,0,0,0.8)] custom-scrollbar">
                              {categoryGroups.map((group, gIdx) => (
                                  <div key={gIdx}>
                                      <div className="bg-[#2a0808] text-[#c5a059] font-bold tracking-widest text-[10px] p-3 uppercase sticky top-0 z-10 border-b border-t first:border-t-0 border-[#c5a059]/10 shadow-sm">
                                          {group.name}
                                      </div>
                                      {group.items.map((item, iIdx) => (
                                          <div 
                                              key={iIdx}
                                              onClick={() => { setCategory(item); setIsDropdownOpen(false); }}
                                              className={`p-3 text-sm cursor-pointer transition-all duration-200 pl-6 ${
                                                  category === item 
                                                  ? 'bg-[#c5a059] text-[#1a0505] font-bold' 
                                                  : 'text-[#e5d5a3] hover:bg-[#c5a059]/20 hover:text-white'
                                              }`}
                                          >
                                              {item}
                                          </div>
                                      ))}
                                  </div>
                              ))}
                          </div>
                      </>
                  )}
              </div>
              
              <div>
                  <label className="block text-xs uppercase tracking-widest text-[#e5d5a3]/50 mb-2">Description</label>
                  <textarea required value={description} onChange={e => setDescription(e.target.value)} rows={5} placeholder="Write something emotional..." className="w-full bg-[#2a0808] border border-[#e5d5a3]/20 p-4 text-[#e5d5a3] focus:border-[#c5a059] outline-none rounded transition-all resize-none" />
              </div>
              <button disabled={loading} className="w-full bg-[#c5a059] text-[#1a0505] py-4 font-bold uppercase tracking-widest hover:bg-white transition-all shadow-[0_0_20px_rgba(197,160,89,0.3)] mt-4 disabled:opacity-50 disabled:cursor-not-allowed rounded">
                  {loading ? (editId ? "Saving..." : "Publishing...") : (editId ? "Save Changes" : "Publish Treasure")}
              </button>
          </form>
      </div>
    </div>
  )
}

// 🌟 PHASE 2.2: SUSPENSE BOUNDARY WRAPPER 🌟
export default function UploadPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-[#1a0505] flex items-center justify-center text-[#c5a059] font-serif">Loading Vault Systems...</div>}>
            <UploadContent />
        </Suspense>
    )
}