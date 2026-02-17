import { createClient } from '@supabase/supabase-js'
import { GoogleGenerativeAI } from "@google/generative-ai"
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY!

const supabase = createClient(supabaseUrl, supabaseKey)
const genAI = new GoogleGenerativeAI(apiKey)

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const query = searchParams.get('q') || ""
    
    if (!query || query.trim().length < 2) return NextResponse.json([])

    // ─────────────────────────────────────────────────────────────
    // STEP 1: DIRECT TEXT SEARCH (Fastest & Most Accurate)
    // ─────────────────────────────────────────────────────────────
    // If user types "Bang", "Gold", "Neck", we trust they know what they want.
    const { data: directMatches } = await supabase
        .from('products')
        .select('*')
        .or(`name.ilike.%${query}%,category.ilike.%${query}%`)
        .limit(8)

    // If we find exact keyword matches (e.g. "Bangles"), return IMMEDIATELY.
    // This solves the "Bang -> Necklace" issue.
    if (directMatches && directMatches.length > 0) {
        return NextResponse.json(directMatches)
    }

    // ─────────────────────────────────────────────────────────────
    // STEP 2: QUERY EXPANSION (The "Translator")
    // ─────────────────────────────────────────────────────────────
    // If text search failed (e.g. "Wrist", "Thriat", "Leg"), we ask the AI to translate.
    
    const model = genAI.getGenerativeModel({ model: "gemini-pro" })
    
    const prompt = `
    You are a search query translator for a Jewelry Store called "Lotus".
    User Input: "${query}"
    
    Task: Convert the input into a single specific jewelry category that exists in our store.
    
    Our Store Categories: [Necklace, Earrings, Bangles, Bridal Set, Rings]
    
    Rules:
    1. If input is "wrist" or "hand", output "Bangles".
    2. If input is "neck", output "Necklace".
    3. If input is "ear", output "Earrings".
    4. If input is irrelevant (e.g., "leg", "shoe", "thriat", "food"), output "NULL".
    5. Output ONLY the category name. No sentences.
    `

    try {
        const result = await model.generateContent(prompt)
        const translatedCategory = result.response.text().trim()

        // If AI says NULL (irrelevant), return empty. (Fixes "Thriat", "Leg")
        if (translatedCategory === "NULL" || translatedCategory.includes("NULL")) {
            return NextResponse.json([])
        }

        // ─────────────────────────────────────────────────────────────
        // STEP 3: SEARCH WITH TRANSLATED TERM
        // ─────────────────────────────────────────────────────────────
        // Search for the *translated* category (e.g., "Bangles")
        const { data: expandedMatches } = await supabase
            .from('products')
            .select('*')
            .ilike('category', `%${translatedCategory}%`)
            .limit(8)

        return NextResponse.json(expandedMatches || [])

    } catch (aiError) {
        console.error("AI Expansion Failed:", aiError)
        return NextResponse.json([])
    }

  } catch (error: any) {
    console.error("Search Error:", error)
    return NextResponse.json([], { status: 500 })
  }
}