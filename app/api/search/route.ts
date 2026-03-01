import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

import { supabase } from '@/app/supabase'

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