'use client'
import { useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import { GoogleGenerativeAI } from "@google/generative-ai"

// CONFIGURATION
const supabaseUrl = "https://fwyliqsazdyprlkemavu.supabase.co"
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ3eWxpcXNhemR5cHJsa2VtYXZ1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAzOTg2MzIsImV4cCI6MjA4NTk3NDYzMn0.dXkx1pEtiZ5uwcQJgisJs14ZyUJTuz-SomMCeZv-jbE"
const supabase = createClient(supabaseUrl, supabaseKey)

export default function SeedPage() {
  const [status, setStatus] = useState("Ready to train AI.")
  const [loading, setLoading] = useState(false)

  const handleTrainAI = async () => {
    setLoading(true)
    setStatus("Connecting to Gemini...")

    try {
        const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY
        if (!apiKey) throw new Error("API Key not found.")
        
        const genAI = new GoogleGenerativeAI(apiKey)
        
        // 🌟 THE FIX: Using the exact model name found in your diagnostic
        const model = genAI.getGenerativeModel({ model: "models/gemini-embedding-001" })

        // 2. Fetch Products
        setStatus("Fetching products from DB...")
        const { data: products } = await supabase.from('products').select('*')
        if (!products || products.length === 0) throw new Error("No products found.")

        // 3. Loop and Embed
        let count = 0
        for (const product of products) {
            setStatus(`Training AI on: ${product.name}...`)
            
            // Create a rich description for the AI
            const contentToEmbed = `Product: ${product.name}. Category: ${product.category}. Price: ₹${product.price}. Description: ${product.name} is a high-quality ${product.category} suitable for weddings, parties, and daily wear. It has a royal gold look.`

            // Generate Vector
            const result = await model.embedContent(contentToEmbed)
            const embedding = result.embedding.values

            // Save to DB
            const { error } = await supabase.from('product_embeddings').upsert({
                id: product.id,
                content: contentToEmbed,
                embedding: embedding
            })

            if (error) console.error("Error saving:", error)
            count++
        }

        setStatus(`Success! AI trained on ${count} products.`)

    } catch (err: any) {
        setStatus(`Error: ${err.message}`)
        console.error(err)
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-[#1a0505] text-[#e5d5a3] flex items-center justify-center font-sans">
        <div className="text-center space-y-6 p-10 border border-[#e5d5a3]/20 rounded">
            <h1 className="text-2xl font-serif">AI Knowledge Injector</h1>
            <p className="text-[#e5d5a3]/50 text-sm max-w-md">
                Using Model: <span className="text-[#c5a059] font-mono">models/gemini-embedding-001</span>
            </p>
            
            <div className="p-4 bg-[#2a0808] rounded border border-[#e5d5a3]/10 font-mono text-xs text-[#c5a059]">
                {status}
            </div>

            <button 
                onClick={handleTrainAI}
                disabled={loading}
                className="bg-[#c5a059] text-[#1a0505] px-8 py-3 rounded font-bold uppercase tracking-widest hover:bg-white transition-all disabled:opacity-50"
            >
                {loading ? "Training..." : "Start Training"}
            </button>
        </div>
    </div>
  )
}