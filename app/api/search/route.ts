import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

// 🌟 FIX: Hardcoded Supabase keys so the Docker build doesn't crash
const supabaseUrl = "https://fwyliqsazdyprlkemavu.supabase.co"
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ3eWxpcXNhemR5cHJsa2VtYXZ1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAzOTg2MzIsImV4cCI6MjA4NTk3NDYzMn0.dXkx1pEtiZ5uwcQJgisJs14ZyUJTuz-SomMCeZv-jbE"

const supabase = createClient(supabaseUrl, supabaseKey)

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const query = searchParams.get('q') || ""
    
    if (!query || query.trim().length < 2) return NextResponse.json([])

    // ─────────────────────────────────────────────────────────────
    // STEP 1: DIRECT TEXT SEARCH (Fastest & 100% in your control)
    // ─────────────────────────────────────────────────────────────
    // If user types "Bangles", "Gold", "Necklace", it pulls directly from DB.
    const { data: directMatches } = await supabase
        .from('products')
        .select('*')
        .or(`name.ilike.%${query}%,category.ilike.%${query}%`)
        .limit(8)

    // Return the database matches, or an empty array if nothing is found.
    return NextResponse.json(directMatches || [])

  } catch (error: any) {
    console.error("Search Error:", error)
    return NextResponse.json([], { status: 500 })
  }
}