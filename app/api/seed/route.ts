import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

// Force dynamic execution so it runs every time you reload
export const dynamic = 'force-dynamic'

// 🌟 FIX: Hardcoded Supabase keys so the Docker build doesn't crash
const supabaseUrl = "https://fwyliqsazdyprlkemavu.supabase.co"
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ3eWxpcXNhemR5cHJsa2VtYXZ1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAzOTg2MzIsImV4cCI6MjA4NTk3NDYzMn0.dXkx1pEtiZ5uwcQJgisJs14ZyUJTuz-SomMCeZv-jbE"

const supabase = createClient(supabaseUrl, supabaseKey)

export async function GET() {
  console.log("--- STARTING DATABASE HEALTH CHECK ---")
  
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

    console.log(`✅ Found ${products.length} products. Pure database search is ready.`)

    // AI embedding loop has been permanently removed for 100% system independence.

    return NextResponse.json({ 
        message: "Database Health Check Complete. AI dependencies removed.", 
        productCount: products.length,
        status: "100% Independent"
    })

  } catch (error: any) {
    console.error("❌ CRITICAL SERVER ERROR:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}