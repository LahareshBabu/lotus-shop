'use client'
import { useState, useEffect, Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { supabase } from '@/app/supabase'

function HeatmapContent() {
    const [loading, setLoading] = useState(true)
    const [heatmapData, setHeatmapData] = useState<any[]>([])
    const [categories, setCategories] = useState<string[]>([])
    const [activeCategory, setActiveCategory] = useState("All Items")
    const [displayTitle, setDisplayTitle] = useState("Full Inventory Heatmap (All-Time)")

    // 🚀 THE CONTEXT BRIDGE
    const searchParams = useSearchParams()
    const historyCycleId = searchParams.get('cycle')
    const historyMonth = searchParams.get('month') 

    useEffect(() => {
        async function fetchHeatmapData() {
            let startFilter: string | null = null;
            let endFilter: string | null = null;

            // 🚀 DYNAMIC DATE RESOLUTION BASED ON CONTEXT
            if (historyCycleId) {
                const { data: cycle } = await supabase.from('cycles').select('*').eq('id', historyCycleId).single();
                if (cycle) {
                    startFilter = cycle.start_date;
                    endFilter = cycle.end_date;
                    setDisplayTitle(`Cycle Heatmap: ${new Date(cycle.start_date).toLocaleDateString('en-GB')} - ${new Date(cycle.end_date).toLocaleDateString('en-GB')}`);
                }
            } else if (historyMonth) {
                const [year, month] = historyMonth.split('-').map(Number);
                const startDate = new Date(year, month - 1, 1);
                const endDate = new Date(year, month, 1); 
                startFilter = startDate.toISOString();
                endFilter = new Date(endDate.getTime() - 1).toISOString();
                setDisplayTitle(`Monthly Heatmap: ${startDate.toLocaleString('default', { month: 'long', year: 'numeric' })}`);
            }

            // Base Queries
            let viewsQuery = supabase.from('interactions').select('product_id').eq('event_type', 'view');
            let ordersQuery = supabase.from('orders').select('items');

            // Apply Filters if Time Traveling
            if (startFilter && endFilter) {
                viewsQuery = viewsQuery.gte('timestamp', startFilter).lte('timestamp', endFilter);
                ordersQuery = ordersQuery.gte('created_at', startFilter).lte('created_at', endFilter);
            }

            const [ { data: views }, { data: products }, { data: orders } ] = await Promise.all([
                viewsQuery,
                supabase.from('products').select('id, name, category, image_url, price'),
                ordersQuery
            ]);

            if (!products) {
                setLoading(false);
                return;
            }

            // Extract unique categories for the sidebar
            const uniqueCategories = Array.from(new Set(products.map(p => p.category).filter(Boolean)));
            setCategories(["All Items", ...uniqueCategories]);

            // Build the Stats Dictionary
            const productStats: Record<string, any> = {};
            products.forEach(p => { 
                productStats[p.id] = { ...p, views: 0, sales: 0 }; 
            });
            
            // Count Views
            if (views) {
                views.forEach(v => { if (productStats[v.product_id]) productStats[v.product_id].views++; });
            }

            // Count Sales
            if (orders) {
                orders.forEach(order => {
                    if (!order.items) return;
                    let itemsArray = [];
                    if (Array.isArray(order.items)) itemsArray = order.items;
                    else if (typeof order.items === 'object') itemsArray = Object.values(order.items).flat();
                    else if (typeof order.items === 'string') {
                        try { const parsed = JSON.parse(order.items); itemsArray = Array.isArray(parsed) ? parsed : Object.values(parsed).flat(); } catch(e){}
                    }
                    itemsArray.forEach((item: any) => {
                        if (item.id && productStats[item.id]) productStats[item.id].sales++;
                    });
                });
            }

            // Calculate Conversion Rate and sort
            const finalData = Object.values(productStats).map(p => ({
                ...p,
                conversion: p.views > 0 ? ((p.sales / p.views) * 100).toFixed(1) : "0.0"
            })).sort((a, b) => b.views - a.views); 

            setHeatmapData(finalData);
            setLoading(false);
        }

        fetchHeatmapData();
    }, [historyCycleId, historyMonth]);

    const displayedItems = activeCategory === "All Items" 
        ? heatmapData 
        : heatmapData.filter(item => item.category === activeCategory);

    if (loading) return <div className="min-h-screen bg-[#1a0505] flex items-center justify-center text-[#c5a059]">Analyzing Store Traffic...</div>

    return (
        <div className="min-h-screen bg-[#1a0505] text-[#e5d5a3] font-sans pb-20">
            <header className="bg-[#2a0808] border-b border-[#e5d5a3]/10 p-6 flex justify-between items-center sticky top-0 z-50">
                <div>
                    <h1 className="font-serif text-2xl text-[#f4e4bc] mb-1">Store Conversion Matrix</h1>
                    <p className="text-xs text-[#e5d5a3]/50 uppercase tracking-widest">{displayTitle}</p>
                </div>
                {/* 🚀 SMART BACK BUTTON: Returns them exactly where they came from! */}
                <Link href={historyCycleId ? `/admin?cycle=${historyCycleId}` : historyMonth ? `/admin?month=${historyMonth}` : "/admin"} className="text-xs uppercase tracking-widest text-[#c5a059] border border-[#c5a059] px-6 py-2 rounded hover:bg-[#c5a059] hover:text-[#1a0505] transition-all">
                    ← Back to Dashboard
                </Link>
            </header>

            <div className="flex flex-col md:flex-row max-w-7xl mx-auto mt-8 px-4 gap-8">
                <aside className="w-full md:w-64 shrink-0">
                    <div className="bg-[#2a0808] p-6 rounded border border-[#e5d5a3]/10 sticky top-32">
                        <h3 className="font-serif text-[#f4e4bc] mb-4 text-lg border-b border-[#e5d5a3]/10 pb-2">Filter by Category</h3>
                        <div className="flex flex-col gap-2">
                            {categories.map(cat => (
                                <button 
                                    key={cat}
                                    onClick={() => setActiveCategory(cat)}
                                    className={`text-left px-4 py-2 rounded text-sm uppercase tracking-widest transition-all ${activeCategory === cat ? 'bg-[#c5a059] text-[#1a0505] font-bold shadow-lg' : 'text-[#e5d5a3]/70 hover:bg-[#e5d5a3]/5'}`}
                                >
                                    {cat}
                                </button>
                            ))}
                        </div>
                    </div>
                </aside>

                <div className="flex-1 bg-[#2a0808] rounded border border-[#e5d5a3]/10 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-[#1a0505] text-[#e5d5a3]/50 uppercase text-[10px] tracking-widest border-b border-[#e5d5a3]/10">
                                <tr>
                                    <th className="p-4 font-normal">Product</th>
                                    <th className="p-4 font-normal text-center">Price</th>
                                    <th className="p-4 font-normal text-center">Total Views</th>
                                    <th className="p-4 font-normal text-center">Total Sales</th>
                                    <th className="p-4 font-normal text-right">Conversion Rate</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[#e5d5a3]/5">
                                {displayedItems.map(item => {
                                    const isWarning = item.views > 0 && parseFloat(item.conversion) === 0;
                                    const isPerforming = parseFloat(item.conversion) > 5.0;

                                    return (
                                        <tr key={item.id} className="hover:bg-[#e5d5a3]/5 transition-colors">
                                            <td className="p-4 flex items-center gap-4">
                                                <div className="h-12 w-12 bg-[#1a0505] rounded border border-[#e5d5a3]/10 overflow-hidden shrink-0">
                                                    {item.image_url ? <img src={item.image_url} className="h-full w-full object-cover" /> : null}
                                                </div>
                                                <div>
                                                    <p className="text-[#e5d5a3] font-bold line-clamp-1">{item.name}</p>
                                                    <p className="text-[10px] text-[#e5d5a3]/40 uppercase tracking-widest">{item.category}</p>
                                                </div>
                                            </td>
                                            <td className="p-4 text-center font-serif text-[#c5a059]">₹{item.price.toLocaleString('en-IN')}</td>
                                            <td className="p-4 text-center">{item.views}</td>
                                            <td className="p-4 text-center font-bold text-white">{item.sales}</td>
                                            <td className="p-4 text-right">
                                                <div className={`inline-flex flex-col items-end px-3 py-1 rounded ${isWarning ? 'bg-red-500/10 border border-red-500/20' : isPerforming ? 'bg-green-500/10 border border-green-500/20' : 'bg-[#1a0505]'}`}>
                                                    <span className={`font-bold ${isWarning ? 'text-red-400' : isPerforming ? 'text-green-400' : 'text-[#e5d5a3]'}`}>{item.conversion}%</span>
                                                    {isWarning && <span className="text-[8px] text-red-500 uppercase tracking-widest">High Bounce</span>}
                                                </div>
                                            </td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>
                        {displayedItems.length === 0 && <div className="p-12 text-center text-[#e5d5a3]/30 italic">No products found in this category.</div>}
                    </div>
                </div>
            </div>
        </div>
    )
}

export default function HeatmapPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-[#1a0505] flex items-center justify-center text-[#c5a059]">Analyzing Traffic...</div>}>
            <HeatmapContent />
        </Suspense>
    )
}