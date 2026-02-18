'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

const supabaseUrl = "https://fwyliqsazdyprlkemavu.supabase.co"
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ3eWxpcXNhemR5cHJsa2VtYXZ1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAzOTg2MzIsImV4cCI6MjA4NTk3NDYzMn0.dXkx1pEtiZ5uwcQJgisJs14ZyUJTuz-SomMCeZv-jbE"
const supabase = createClient(supabaseUrl, supabaseKey)

function ArrowLeft({ className="h-5 w-5" }) { return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg> }
function UploadIcon({ className="h-8 w-8" }) { return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg> }
function CheckCircle({ className="h-16 w-16" }) { return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> }
function XIcon({ className="h-4 w-4" }) { return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg> }
function PlusIcon({ className="h-5 w-5" }) { return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg> }

export default function UploadPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  
  // Form State
  const [name, setName] = useState("")
  const [price, setPrice] = useState("")
  const [category, setCategory] = useState("Necklaces")
  const [description, setDescription] = useState("")
  const [imageFiles, setImageFiles] = useState<File[]>([])
  const [previewUrls, setPreviewUrls] = useState<string[]>([])

  useEffect(() => {
    async function checkUser() {
        const { data: { session } } = await supabase.auth.getSession()
        if (!session) router.push('/login')
    }
    checkUser()
  }, [])

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files) {
          const filesArray = Array.from(e.target.files)
          const combinedFiles = [...imageFiles, ...filesArray].slice(0, 5)
          setImageFiles(combinedFiles)
          const newPreviews = combinedFiles.map(file => URL.createObjectURL(file))
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
      setDescription("")
      setImageFiles([])
      setPreviewUrls([])
      setSuccess(false)
      setLoading(false)
  }

  const handlePublish = async (e: React.FormEvent) => {
      e.preventDefault()
      if (imageFiles.length === 0) { alert("Please upload at least one image."); return }
      setLoading(true)

      try {
          const uploadedImageUrls: string[] = []
          for (const file of imageFiles) {
              const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}-${file.name.replace(/[^a-zA-Z0-9]/g, '')}`
              const { error } = await supabase.storage.from('jewelry-images').upload(fileName, file)
              if (error) throw error
              const { data: { publicUrl } } = supabase.storage.from('jewelry-images').getPublicUrl(fileName)
              uploadedImageUrls.push(publicUrl)
          }

          const { error: dbError } = await supabase.from('products').insert({
              name,
              price: parseFloat(price),
              category,
              description,
              image_url: uploadedImageUrls[0],
              gallery: uploadedImageUrls,
              rating: 5,
              reviews: 0
          })

          if (dbError) throw dbError
          setSuccess(true) // 🌟 Keeps the success screen open

      } catch (error: any) {
          console.error(error)
          alert("Error uploading: " + error.message)
          setLoading(false)
      }
  }

  // 🌟 NEW SUCCESS SCREEN (Doesn't disappear automatically)
  if (success) {
      return (
          <div className="min-h-screen bg-[#1a0505] flex flex-col items-center justify-center text-[#e5d5a3] animate-fade-in relative p-4">
              <button onClick={() => router.push('/admin')} className="absolute top-8 right-8 text-[#e5d5a3]/50 hover:text-white"><XIcon className="h-8 w-8" /></button>
              
              <div className="bg-[#2a0808] border border-[#c5a059] p-12 rounded-lg shadow-[0_0_40px_rgba(197,160,89,0.15)] text-center max-w-md w-full">
                  <div className="flex justify-center mb-6">
                      <div className="bg-[#c5a059]/10 p-4 rounded-full border border-[#c5a059]">
                          <CheckCircle className="text-[#c5a059] h-10 w-10" /> 
                      </div>
                  </div>
                  <h1 className="font-serif text-3xl text-[#f4e4bc] mb-2 tracking-wide">Published!</h1>
                  <p className="text-[#e5d5a3]/60 mb-8 font-sans text-sm">"{name}" is now live in the store.</p>
                  
                  <div className="flex flex-col gap-3">
                      <button onClick={resetForm} className="w-full bg-[#c5a059] text-[#1a0505] py-4 rounded text-xs font-bold uppercase tracking-widest hover:bg-white transition-all flex items-center justify-center gap-2 shadow-lg">
                          <PlusIcon /> Add Another Treasure
                      </button>
                      <button onClick={() => router.push('/admin')} className="w-full border border-[#e5d5a3]/20 text-[#e5d5a3] py-4 rounded text-xs font-bold uppercase tracking-widest hover:bg-[#e5d5a3] hover:text-[#1a0505] transition-all">
                          Back to Dashboard
                      </button>
                  </div>
              </div>
          </div>
      )
  }

  return (
    <div className="min-h-screen bg-[#1a0505] text-[#e5d5a3] font-sans p-8">
      <div className="max-w-4xl mx-auto flex items-center gap-4 mb-10">
          <Link href="/admin" className="text-[#e5d5a3]/50 hover:text-white transition-colors"><ArrowLeft /></Link>
          <h1 className="font-serif text-2xl text-[#f4e4bc]">Add New Treasure</h1>
      </div>

      <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12">
          {/* LEFT: Image Gallery */}
          <div>
              <div className="grid grid-cols-2 gap-4 mb-4">
                  {previewUrls.length > 0 ? (
                      <div className="col-span-2 aspect-[3/4] rounded-lg border-2 border-[#c5a059] relative overflow-hidden group">
                          <img src={previewUrls[0]} className="absolute inset-0 w-full h-full object-cover" />
                          <div className="absolute top-2 left-2 bg-[#c5a059] text-[#1a0505] text-[10px] font-bold px-2 py-1 rounded">MAIN</div>
                          <button type="button" onClick={() => removeImage(0)} className="absolute top-2 right-2 bg-black/60 p-1 rounded-full text-white hover:bg-red-600 transition-colors z-20"><XIcon /></button>
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
                                  <button type="button" onClick={() => removeImage(i)} className="absolute top-1 right-1 bg-black/60 p-1 rounded-full text-white hover:bg-red-600 transition-colors z-20"><XIcon /></button>
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
          <form onSubmit={handlePublish} className="space-y-6">
              <div>
                  <label className="block text-xs uppercase tracking-widest text-[#e5d5a3]/50 mb-2">Product Name</label>
                  <input required value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Royal Emerald Choker" className="w-full bg-[#2a0808] border border-[#e5d5a3]/20 p-4 text-[#e5d5a3] focus:border-[#c5a059] outline-none rounded transition-all" />
              </div>
              <div className="grid grid-cols-2 gap-6">
                  <div>
                      <label className="block text-xs uppercase tracking-widest text-[#e5d5a3]/50 mb-2">Price (₹)</label>
                      <input required type="number" value={price} onChange={e => setPrice(e.target.value)} placeholder="1500" className="w-full bg-[#2a0808] border border-[#e5d5a3]/20 p-4 text-[#e5d5a3] focus:border-[#c5a059] outline-none rounded transition-all" />
                  </div>
                  <div>
                      <label className="block text-xs uppercase tracking-widest text-[#e5d5a3]/50 mb-2">Category</label>
                      <select value={category} onChange={e => setCategory(e.target.value)} className="w-full bg-[#2a0808] border border-[#e5d5a3]/20 p-4 text-[#e5d5a3] focus:border-[#c5a059] outline-none rounded transition-all cursor-pointer">
                          <option value="Necklaces">Necklaces</option>
                          <option value="Earrings">Earrings</option>
                          <option value="Bangles">Bangles</option>
                          <option value="Bridal Sets">Bridal Sets</option>
                      </select>
                  </div>
              </div>
              <div>
                  <label className="block text-xs uppercase tracking-widest text-[#e5d5a3]/50 mb-2">Description</label>
                  <textarea required value={description} onChange={e => setDescription(e.target.value)} rows={5} placeholder="Write something emotional..." className="w-full bg-[#2a0808] border border-[#e5d5a3]/20 p-4 text-[#e5d5a3] focus:border-[#c5a059] outline-none rounded transition-all resize-none" />
              </div>
              <button disabled={loading} className="w-full bg-[#c5a059] text-[#1a0505] py-4 font-bold uppercase tracking-widest hover:bg-white transition-all shadow-[0_0_20px_rgba(197,160,89,0.3)] mt-4 disabled:opacity-50 disabled:cursor-not-allowed rounded">
                  {loading ? "Publishing..." : "Publish Treasure"}
              </button>
          </form>
      </div>
    </div>
  )
}