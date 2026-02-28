import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { redis } from '@/lib/redis';

// Connect to your existing Supabase
import { supabase } from '@/app/supabase'

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