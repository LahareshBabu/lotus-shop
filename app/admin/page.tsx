'use client'
import { useState, useEffect, Suspense } from 'react'
import { createClient } from '@supabase/supabase-js'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import RevenueChart from './chart/RevenueChart' 

export const dynamic = 'force-dynamic'

import { supabase } from '@/app/supabase'
const MY_ADMIN_EMAIL = "lahareshab@gmail.com" 

// ICONS
function WarningIcon({ className="h-12 w-12" }) { return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg> }
function CheckCircleIcon({ className="h-5 w-5" }) { return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> }
function PlusIcon({ className="h-4 w-4" }) { return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg> }
function StarIcon({ className="h-3 w-3 inline mr-1" }) { return <svg className={className} fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>}

function AdminContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const historyCycleId = searchParams.get('cycle')
  const historyMonth = searchParams.get('month') 
  
  const [orders, setOrders] = useState<any[]>([]) 
  const [loading, setLoading] = useState(true)
  const [currentUserEmail, setCurrentUserEmail] = useState<string | null>("Checking...")
  
  const [currentDate, setCurrentDate] = useState("")
  const [dashboardTitle, setDashboardTitle] = useState("") 
  const [showEndCycleModal, setShowEndCycleModal] = useState(false)
  const [liveCycleStartDate, setLiveCycleStartDate] = useState<Date | null>(null)

  const [vipCustomers, setVipCustomers] = useState<any[]>([])
  const [inventoryHeatmap, setInventoryHeatmap] = useState<any[]>([])

  useEffect(() => {
    async function init() {
      const today = new Date();
      const options: any = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
      setCurrentDate(today.toLocaleDateString("en-US", options));

      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
          setCurrentUserEmail("NO USER LOGGED IN")
          setLoading(false)
          return
      }
      setCurrentUserEmail(session.user.email || "No Email Found")
      
      await ensureMonthlyCyclesExist();

      // 🚀 SURGICAL ROUTING
      if (historyCycleId) await fetchManualCycleData(historyCycleId)
      else if (historyMonth) await fetchFullMonthData(historyMonth)
      else await fetchLiveOrders() 
    }
    init()
  }, [historyCycleId, historyMonth])

  const ensureMonthlyCyclesExist = async () => {
      const now = new Date();
      const currentMonthName = now.toLocaleString('default', { month: 'long', year: 'numeric' });

      const { data: allOrders } = await supabase.from('orders').select('*');
      if (!allOrders) return;

      const monthGroups: Record<string, any[]> = {};
      allOrders.forEach(o => {
          const d = new Date(o.created_at);
          const mName = d.toLocaleString('default', { month: 'long', year: 'numeric' });
          if (!monthGroups[mName]) monthGroups[mName] = [];
          monthGroups[mName].push(o);
      });

      const { data: cycles } = await supabase.from('cycles').select('cycle_name');
      const existingCycleNames = cycles ? cycles.map(c => c.cycle_name) : [];

      for (const [mName, mOrders] of Object.entries(monthGroups)) {
          const fullMonthCycleName = `${mName} (Full Month)`;

          if (mName !== currentMonthName && !existingCycleNames.includes(fullMonthCycleName)) {
              const revenue = mOrders.reduce((sum, order) => sum + (order.total || 0), 0);
              const startDate = new Date(Math.min(...mOrders.map(o => new Date(o.created_at).getTime()))).toISOString();
              const sampleDate = new Date(mOrders[0].created_at);
              const endDate = new Date(sampleDate.getFullYear(), sampleDate.getMonth() + 1, 0, 23, 59, 59).toISOString();

              await supabase.from('cycles').insert({
                  cycle_name: fullMonthCycleName, 
                  total_revenue: revenue,
                  total_orders: mOrders.length,
                  active_orders: mOrders.filter(o => o.status !== 'Delivered').length,
                  start_date: startDate,
                  end_date: endDate
              });
          }
      }
  }

  // 🚀 DYNAMIC LTV (Takes optional date range)
  const calculateLTV = async (start?: string, end?: string) => {
      let query = supabase.from('orders').select('user_id, total, items'); // 🔥 FIX: Removed .eq('status', 'Delivered')
      
      // If history mode, apply boundaries. Otherwise, ALL TIME!
      if (start && end) {
          query = query.gte('created_at', start).lte('created_at', end);
      }

      const { data: allOrders } = await query;
      if (!allOrders) return;

      const userSpendMap: Record<string, { total: number, name: string }> = {};
      allOrders.forEach(order => {
          if (!order.user_id) return;
          let name = "Guest User";
          try {
              if (order.items && order.items.shipping_details && order.items.shipping_details.firstName) {
                  name = `${order.items.shipping_details.firstName} ${order.items.shipping_details.lastName}`;
              }
          } catch(e) {}

          if (!userSpendMap[order.user_id]) userSpendMap[order.user_id] = { total: 0, name: name };
          userSpendMap[order.user_id].total += (order.total || 0);
      });

      const sortedVips = Object.entries(userSpendMap).map(([id, data]) => ({ id, ...data })).sort((a, b) => b.total - a.total).slice(0, 3);
      setVipCustomers(sortedVips);
  }

  // 🚀 DYNAMIC HEATMAP (Takes optional date range)
  const calculateHeatmap = async (start?: string, end?: string) => {
      let viewsQuery = supabase.from('interactions').select('product_id').eq('event_type', 'view');
      let ordersQuery = supabase.from('orders').select('items');

      // If history mode, apply boundaries. Otherwise, ALL TIME!
      if (start && end) {
          viewsQuery = viewsQuery.gte('timestamp', start).lte('timestamp', end);
          ordersQuery = ordersQuery.gte('created_at', start).lte('created_at', end);
      }

      const [ { data: views }, { data: products }, { data: orders } ] = await Promise.all([
          viewsQuery,
          supabase.from('products').select('id, name'),
          ordersQuery
      ]);

      if (!views || !products || !orders) return;

      const productStats: Record<string, { name: string, views: number, sales: number }> = {};
      products.forEach(p => { productStats[p.id] = { name: p.name, views: 0, sales: 0 }; });
      
      views.forEach(v => { if (productStats[v.product_id]) productStats[v.product_id].views++; });

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

      const heatmap = Object.values(productStats)
          .filter(p => p.views > 0) 
          .map(p => ({
              ...p,
              conversion: p.sales > 0 ? ((p.sales / p.views) * 100).toFixed(1) : "0.0"
          }))
          .sort((a, b) => parseFloat(a.conversion) - parseFloat(b.conversion)) 
          .slice(0, 3); 

      setInventoryHeatmap(heatmap);
  }

  const fetchLiveOrders = async () => {
      const { data: lastCycle } = await supabase.from('cycles').select('end_date').order('end_date', { ascending: false }).limit(1).single()
      let startOfPeriod = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
      if (lastCycle && new Date(lastCycle.end_date) > startOfPeriod) {
          startOfPeriod = new Date(lastCycle.end_date)
      }
      setLiveCycleStartDate(startOfPeriod)
      
      const { data } = await supabase.from('orders').select('*').gt('created_at', startOfPeriod.toISOString()).order('created_at', { ascending: false })
      if (data) {
          setOrders(data)
          setDashboardTitle(`ACTIVE: ${new Date().toLocaleString('default', { month: 'long', year: 'numeric' })}`)
      }
      
      // 🚀 NO ARGS = ALL TIME CALCULATION
      calculateLTV();
      calculateHeatmap();
      setLoading(false)
  }

  const fetchManualCycleData = async (id: string) => {
      const { data: cycle } = await supabase.from('cycles').select('*').eq('id', id).single()
      if (cycle) {
          setDashboardTitle(`${new Date(cycle.start_date).toLocaleDateString('en-GB')} - ${new Date(cycle.end_date).toLocaleDateString('en-GB')}`)
          const { data: oldOrders } = await supabase.from('orders').select('*').gte('created_at', cycle.start_date).lte('created_at', cycle.end_date).order('created_at', { ascending: false })
          setOrders(oldOrders || [])
          
          // 🚀 ARGS PASSED = CYCLE BOUND CALCULATION
          calculateLTV(cycle.start_date, cycle.end_date);
          calculateHeatmap(cycle.start_date, cycle.end_date);
      }
      setLoading(false)
  }

  const fetchFullMonthData = async (monthStr: string) => {
      const [year, month] = monthStr.split('-').map(Number)
      const startDate = new Date(year, month - 1, 1)
      const endDate = new Date(year, month, 1) // First day of next month
      const endIso = new Date(endDate.getTime() - 1).toISOString() // 23:59:59 of previous month
      
      const { data: monthOrders } = await supabase.from('orders').select('*').gte('created_at', startDate.toISOString()).lte('created_at', endIso).order('created_at', { ascending: false })
      setOrders(monthOrders || [])
      setDashboardTitle(`${startDate.toLocaleString('default', { month: 'long', year: 'numeric' })} (Full)`) 
      
      // 🚀 ARGS PASSED = CYCLE BOUND CALCULATION
      calculateLTV(startDate.toISOString(), endIso);
      calculateHeatmap(startDate.toISOString(), endIso);
      setLoading(false)
  }

  const updateStatus = async (orderId: string, newStatus: string) => {
      setOrders(orders.map(o => o.id === orderId ? { ...o, status: newStatus } : o))
      await supabase.from('orders').update({ status: newStatus }).eq('id', orderId)
  }

  const handleEndCycle = async () => {
      const stats = calculateStats(orders)
      const cycleName = `${new Date().toLocaleString('default', { month: 'long', year: 'numeric' })} (Manual End)`
      const startDateToSave = liveCycleStartDate ? liveCycleStartDate.toISOString() : new Date().toISOString()
      const { error } = await supabase.from('cycles').insert({
          cycle_name: cycleName,
          total_revenue: stats.totalRevenue,
          total_orders: stats.totalOrders,
          active_orders: stats.pendingOrders,
          start_date: startDateToSave,
          end_date: new Date().toISOString()
      })
      if(!error) { setShowEndCycleModal(false); window.location.reload() }
  }

  const calculateStats = (data: any[]) => {
      const revenue = data.reduce((sum, order) => sum + (order.total || 0), 0)
      const active = data.filter(o => o.status !== 'Delivered').length
      return { totalRevenue: revenue, totalOrders: data.length, pendingOrders: active }
  }

  const stats = calculateStats(orders)

  if (currentUserEmail !== MY_ADMIN_EMAIL && currentUserEmail !== "Checking...") return <div className="min-h-screen bg-[#1a0505] text-red-500 flex items-center justify-center">ACCESS DENIED</div>
  if (loading) return <div className="min-h-screen bg-[#1a0505] flex items-center justify-center text-[#c5a059]">Loading...</div>
  
  const isHistoryMode = !!historyCycleId || !!historyMonth;
  
  // 🚀 CONTEXT LINK GENERATOR
  const getHeatmapLink = () => {
      if (historyCycleId) return `/admin/heatmap?cycle=${historyCycleId}`
      if (historyMonth) return `/admin/heatmap?month=${historyMonth}`
      return "/admin/heatmap"
  }

  return (
    <div className="min-h-screen bg-[#1a0505] text-[#e5d5a3] font-sans relative pb-20">
      
      {showEndCycleModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm animate-fade-in">
              <div className="bg-[#2a0808] border border-[#c5a059] p-8 rounded-lg shadow-[0_0_30px_rgba(197,160,89,0.2)] max-w-sm w-full text-center">
                  <div className="flex justify-center mb-4 text-[#c5a059]"><WarningIcon /></div>
                  <h3 className="font-serif text-2xl text-[#f4e4bc] mb-2">End Current Cycle?</h3>
                  <p className="text-[#e5d5a3]/70 text-sm mb-8 leading-relaxed">This will save current data to History and <strong>reset the dashboard to 0</strong> for a fresh start.</p>
                  <div className="flex gap-4 justify-center">
                      <button onClick={() => setShowEndCycleModal(false)} className="px-6 py-3 border border-[#e5d5a3]/30 rounded text-[#e5d5a3] text-xs font-bold uppercase tracking-widest hover:border-[#e5d5a3] transition-all">Cancel</button>
                      <button onClick={handleEndCycle} className="px-6 py-3 bg-[#c5a059] text-[#1a0505] rounded text-xs font-bold uppercase tracking-widest hover:bg-white transition-all shadow-lg">Confirm End</button>
                  </div>
              </div>
          </div>
      )}

      <header className="bg-[#2a0808] border-b border-[#e5d5a3]/10 p-6 flex justify-between items-end">
          <div>
              <h1 className="font-serif text-2xl text-[#f4e4bc] mb-1">Admin Dashboard</h1>
              <p className="text-xs text-[#e5d5a3]/50 uppercase tracking-widest">{currentDate}</p>
          </div>
          <div className="flex gap-4">
              {!isHistoryMode && (
                  <Link href="/admin/upload" className="bg-[#c5a059] text-[#1a0505] px-6 py-2 rounded text-xs font-bold uppercase tracking-widest hover:bg-white transition-all shadow-[0_0_15px_rgba(197,160,89,0.3)] flex items-center gap-2">
                      <PlusIcon /> Add Product
                  </Link>
              )}
              {isHistoryMode && (
                  <Link href="/admin" className="text-xs uppercase tracking-widest text-[#c5a059] border border-[#c5a059] px-6 py-2 rounded hover:bg-[#c5a059] hover:text-[#1a0505] transition-all">
                      ← Back to Dashboard
                  </Link>
              )}
              <Link href="/admin/history" className="bg-[#1a0505] border border-[#c5a059] text-[#c5a059] px-6 py-2 rounded text-xs font-bold uppercase tracking-widest hover:bg-[#c5a059] hover:text-[#1a0505] transition-all">View History</Link>
              {!isHistoryMode && (
                  <button onClick={() => setShowEndCycleModal(true)} className="bg-red-900/20 border border-red-500/50 text-red-400 px-6 py-2 rounded text-xs font-bold uppercase tracking-widest hover:bg-red-900/50 hover:border-red-500 transition-all">End Cycle</button>
              )}
          </div>
      </header>

      <div className="max-w-7xl mx-auto p-8">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              
              <div className="bg-[#2a0808]/40 p-6 rounded border border-[#c5a059]/30 relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-4 opacity-10 text-4xl">💎</div>
                  <h3 className="font-serif text-[#f4e4bc] mb-4 text-lg border-b border-[#e5d5a3]/10 pb-2">Top VIP Customers {isHistoryMode ? '(Cycle)' : '(All-Time)'}</h3>
                  {vipCustomers.length === 0 ? <p className="text-[#e5d5a3]/30 text-xs">No historical sales data found.</p> : (
                      <div className="space-y-3">
                          {vipCustomers.map((vip, idx) => (
                              <div key={vip.id} className="flex justify-between items-center bg-[#1a0505] p-3 rounded border border-[#e5d5a3]/5">
                                  <div className="flex items-center gap-3">
                                      <div className={`h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-bold ${idx === 0 ? 'bg-yellow-500/20 text-yellow-500 border border-yellow-500/50' : 'bg-[#e5d5a3]/10 text-[#e5d5a3]'}`}>{idx + 1}</div>
                                      <div>
                                          <p className="text-sm text-[#e5d5a3] font-bold">{vip.name}</p>
                                          {idx === 0 && <p className="text-[9px] text-yellow-500 uppercase tracking-widest flex items-center"><StarIcon className="w-3 h-3"/> Whale Status</p>}
                                      </div>
                                  </div>
                                  <span className="font-serif text-[#c5a059]">₹{vip.total.toLocaleString("en-IN")}</span>
                              </div>
                          ))}
                      </div>
                  )}
              </div>

              {/* 🚀 SMART LINK TO HEATMAP */}
              <Link href={getHeatmapLink()} className="block bg-[#2a0808]/40 p-6 rounded border border-red-500/30 relative overflow-hidden group hover:scale-[1.02] hover:border-red-500/60 transition-all cursor-pointer shadow-lg hover:shadow-red-900/20">
                  <div className="absolute top-0 right-0 p-4 opacity-10 text-4xl group-hover:scale-110 transition-transform">🔥</div>
                  <div className="flex justify-between items-center mb-4 border-b border-[#e5d5a3]/10 pb-2">
                      <h3 className="font-serif text-[#f4e4bc] text-lg flex items-center gap-2">Conversion Heatmap {isHistoryMode && <span className="text-[9px] bg-[#c5a059]/20 text-[#c5a059] px-2 py-0.5 rounded uppercase tracking-widest border border-[#c5a059]/30">Cycle Data</span>}</h3>
                      <span className="text-xs text-red-400 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">View All <span className="text-lg">→</span></span>
                  </div>
                  
                  {inventoryHeatmap.length === 0 ? <p className="text-[#e5d5a3]/30 text-xs">Accumulating view data for this period...</p> : (
                      <div className="space-y-3">
                          {inventoryHeatmap.map(item => (
                              <div key={item.name} className="flex flex-col bg-[#1a0505] p-3 rounded border border-red-500/10 group-hover:border-red-500/30 transition-colors">
                                  <div className="flex justify-between items-center mb-1">
                                      <p className="text-sm text-[#e5d5a3] truncate pr-4">{item.name}</p>
                                      <span className="text-xs font-bold text-red-400">{item.conversion}%</span>
                                  </div>
                                  <div className="flex justify-between text-[10px] text-[#e5d5a3]/50">
                                      <span>Views: {item.views}</span>
                                      <span>Sales: {item.sales}</span>
                                  </div>
                                  {item.sales === 0 && <p className="text-[9px] text-red-500/80 uppercase tracking-widest mt-1 italic">High Bounce Rate - Consider Price Drop</p>}
                              </div>
                          ))}
                      </div>
                  )}
              </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-[#2a0808] p-6 rounded border border-[#e5d5a3]/10">
                  <p className="text-[#e5d5a3]/50 text-xs uppercase tracking-widest mb-1">Total Revenue</p>
                  <p className="text-3xl font-serif text-[#c5a059]">₹{stats.totalRevenue.toLocaleString("en-IN")}</p>
              </div>
              <div className="bg-[#2a0808] p-6 rounded border border-[#e5d5a3]/10">
                  <p className="text-[#e5d5a3]/50 text-xs uppercase tracking-widest mb-1">Total Orders</p>
                  <p className="text-3xl font-serif text-[#f4e4bc]">{stats.totalOrders}</p>
              </div>
              <div className="bg-[#2a0808] p-6 rounded border border-[#e5d5a3]/10">
                  <p className="text-[#e5d5a3]/50 text-xs uppercase tracking-widest mb-1">Active Orders</p>
                  <p className="text-3xl font-serif text-[#f4e4bc]">{stats.pendingOrders}</p>
              </div>
          </div>

          <div className="mb-12">
             <RevenueChart orders={orders} />
          </div>

          <div className="flex items-center gap-4 mb-6">
              <h2 className="font-serif text-xl text-[#f4e4bc]">Orders</h2>
              <span className="text-sm bg-[#c5a059] text-[#1a0505] font-bold px-3 py-1 rounded uppercase tracking-widest">{dashboardTitle}</span>
          </div>
          
          <div className="bg-[#2a0808] rounded border border-[#e5d5a3]/10 overflow-hidden">
              <div className="max-h-[400px] overflow-y-auto [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-[#1a0505] [&::-webkit-scrollbar-thumb]:bg-[#c5a059] [&::-webkit-scrollbar-thumb]:rounded-full">
                  <table className="w-full text-left text-sm relative">
                      <thead className="bg-[#1a0505] text-[#e5d5a3]/50 uppercase text-[10px] tracking-widest sticky top-0 z-10 shadow-lg">
                          <tr>
                              <th className="p-4 font-normal">Order ID</th>
                              <th className="p-4 font-normal">Customer Name</th>
                              <th className="p-4 font-normal">Amount</th>
                              <th className="p-4 font-normal">Details</th>
                              <th className="p-4 font-normal">Status Action</th>
                          </tr>
                      </thead>
                      <tbody className="divide-y divide-[#e5d5a3]/5">
                          {orders.map(order => {
                              const shipping = order.items?.shipping_details
                              const customerName = shipping && shipping.firstName ? `${shipping.firstName} ${shipping.lastName}` : "Guest / Old Order"
                              const isDelivered = order.status === 'Delivered'

                              return (
                                  <tr key={order.id} className="hover:bg-[#e5d5a3]/5 transition-colors">
                                      <td className="p-4"><span className="font-mono text-[#c5a059] text-xs block">{order.id}</span><span className="text-[10px] opacity-30">{new Date(order.created_at).toLocaleDateString()}</span></td>
                                      <td className="p-4"><div className="text-white font-bold capitalize">{customerName}</div><div className="text-[10px] opacity-50">{shipping?.phone || order.user_id.slice(0,8)}</div></td>
                                      <td className="p-4">₹{order.total.toLocaleString("en-IN")}</td>
                                      <td className="p-4"><Link href={`/admin/order/${order.id}`} className="text-[10px] border border-[#e5d5a3]/30 px-3 py-1 rounded hover:bg-[#e5d5a3] hover:text-[#1a0505] transition-all uppercase tracking-widest">View Items</Link></td>
                                      
                                      <td className="p-4 flex items-center">
                                          <select value={order.status === 'Processing' ? 'Order Placed' : order.status} onChange={(e) => updateStatus(order.id, e.target.value)} className="bg-[#1a0505] border border-[#e5d5a3]/20 text-[#e5d5a3] text-xs p-2 rounded outline-none focus:border-[#c5a059] cursor-pointer"><option value="Order Placed">Order Placed</option><option value="Shipped">Shipped</option><option value="Out for Delivery">Out for Delivery</option><option value="Delivered">Delivered</option></select>
                                          
                                          {isDelivered && (
                                              <div className="text-green-500 animate-fade-in ml-8" title="Order Completed">
                                                  <CheckCircleIcon />
                                              </div>
                                          )}
                                      </td>
                                  </tr>
                              )
                          })}
                      </tbody>
                  </table>
                  {orders.length === 0 && <div className="p-12 text-center text-[#e5d5a3]/30 italic">No orders found for this period.</div>}
              </div>
          </div>
      </div>
    </div>
  )
}

export default function AdminPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#1a0505] flex items-center justify-center text-[#c5a059]">Loading...</div>}>
      <AdminContent />
    </Suspense>
  )
}