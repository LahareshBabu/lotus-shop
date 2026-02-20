import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { redis } from '@/lib/redis';

// Connect to your existing Supabase
const supabaseUrl = "https://fwyliqsazdyprlkemavu.supabase.co"
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ3eWxpcXNhemR5cHJsa2VtYXZ1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAzOTg2MzIsImV4cCI6MjA4NTk3NDYzMn0.dXkx1pEtiZ5uwcQJgisJs14ZyUJTuz-SomMCeZv-jbE"
const supabase = createClient(supabaseUrl, supabaseKey)

export async function GET() {
    try {
        // 1. CHECK THE CACHE FIRST
        const cachedProducts = await redis.get('lotus_all_products');

        if (cachedProducts) {
            // CACHE HIT! Return blazing fast data from RAM.
            return NextResponse.json({ products: cachedProducts, source: 'cache' });
        }

        // 2. CACHE MISS! Fetch from Supabase Hard Drive
        const { data: products, error } = await supabase.from('products').select('*');

        if (error) throw error;

        // 3. SAVE TO CACHE FOR NEXT TIME (Expires in 3600 seconds = 1 hour)
        await redis.set('lotus_all_products', products, { ex: 3600 });

        return NextResponse.json({ products, source: 'database' });

    } catch (error) {
        console.error("API Error:", error);
        return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 });
    }
}