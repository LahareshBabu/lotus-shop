import { createClient } from '@supabase/supabase-js'
import { GoogleGenerativeAI } from "@google/generative-ai"
import { NextResponse } from 'next/server'

// Force dynamic execution so it runs every time you reload
export const dynamic = 'force-dynamic'

// 🌟 FIX: Hardcoded Supabase keys so the Docker build doesn't crash
const supabaseUrl = "https://fwyliqsazdyprlkemavu.supabase.co"
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ3eWxpcXNhemR5cHJsa2VtYXZ1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAzOTg2MzIsImV4cCI6MjA4NTk3NDYzMn0.dXkx1pEtiZ5uwcQJgisJs14ZyUJTuz-SomMCeZv-jbE"

// 🌟 FIX: Added a fallback string for Gemini so the Robot doesn't crash here either
const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY || "dummy_build_key"

const supabase = createClient(supabaseUrl, supabaseKey)
const genAI = new GoogleGenerativeAI(apiKey)

export async function GET() {
  console.log("--- STARTING SERVER-SIDE TRAINING ---")
  
  try {
    // 1. Get Products
    const { data: products, error: fetchError } = await supabase.from('products').select('*')
    
    if (fetchError) {
        console.error("❌ Error fetching products:", fetchError)
        return NextResponse.json({ error: fetchError.message }, { status: 500 })
    }

    if (!products || products.length === 0) {
        console.log("❌ No products found in 'products' table.")
        return NextResponse.json({ message: "No products found." })
    }

    console.log(`✅ Found ${products.length} products. Processing...`)

    // 2. Initialize Gemini
    const model = genAI.getGenerativeModel({ model: "models/gemini-embedding-001" })

    // 3. Loop and Embed
    let successCount = 0
    
    for (const product of products) {
        console.log(`🔹 Processing: ${product.name} (ID: ${product.id})`)
        
        const content = `Product: ${product.name}. Category: ${product.category}. Price: ${product.price}. Description: ${product.name} is a high-quality ${product.category}.`
        
        // Generate Vector
        const embeddingResult = await model.embedContent(content)
        const embedding = embeddingResult.embedding.values

        // SAVE TO DB (The moment of truth)
        const { error: insertError } = await supabase.from('product_embeddings').upsert({
            id: product.id,
            content: content,
            embedding: embedding
        })

        if (insertError) {
            console.error(`❌ FAILED to save ${product.name}:`, insertError)
        } else {
            console.log(`✅ SAVED ${product.name} successfully.`)
            successCount++
        }
    }

    return NextResponse.json({ 
        message: "Training Complete", 
        successCount: successCount, 
        total: products.length 
    })

  } catch (error: any) {
    console.error("❌ CRITICAL SERVER ERROR:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}