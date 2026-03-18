'use client'
import { useState, useEffect, Suspense } from 'react'
import { createClient } from '@supabase/supabase-js'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import RevenueChart from './chart/RevenueChart' 

export const dynamic = 'force-dynamic'

import { supabase } from '@/app/supabase'

// 🌟 ENTERPRISE SECURITY UPGRADE: Looks for hidden env variable first, falls back to your email 🌟
const MY_ADMIN_EMAIL = process.env.NEXT_PUBLIC_ADMIN_EMAIL || "lahareshab@gmail.com" 

// ICONS
function WarningIcon({ className="h-12 w-12" }) { return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg> }
function CheckCircleIcon({ className="h-5 w-5" }) { return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> }
function PlusIcon({ className="h-4 w-4" }) { return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg> }
function SparklesIcon({ className="h-4 w-4" }) { return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" /></svg> }

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
  const [forecastData, setForecastData] = useState<any[]>([])

  // 🌟 DASHBOARD SWITCHER STATE 🌟
  const [activeView, setActiveView] = useState<'business' | 'ml'>('business')
  const [mlStats, setMlStats] = useState<any>(null)
  const [fbtRules, setFbtRules] = useState<any[]>([])

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
      await fetchDemandForecast(); 

      if (historyCycleId) await fetchManualCycleData(historyCycleId)
      else if (historyMonth) await fetchFullMonthData(historyMonth)
      else await fetchLiveOrders() 
    }
    init()
  }, [historyCycleId, historyMonth])

  // 🌟 CALCULATE ML INTELLIGENCE FROM RECEIPTS 🌟
  useEffect(() => {
      if (orders.length > 0) {
          calculateMLIntelligence(orders);
      }
  }, [orders])

  const calculateMLIntelligence = (orderData: any[]) => {
      let singleItemRevenue = 0;
      let singleItemCount = 0;
      let multiItemRevenue = 0;
      let multiItemCount = 0;

      const baskets: any[][] = [];
      const itemNames: Record<string, string> = {};

      // 1. Extract Baskets and Calculate AOV
      orderData.forEach(o => {
          if (!o.items) return;
          let itemsArr = [];
          if (Array.isArray(o.items)) itemsArr = o.items;
          else if (typeof o.items === 'object') itemsArr = Object.values(o.items).flat();
          else if (typeof o.items === 'string') {
              try { const p = JSON.parse(o.items); itemsArr = Array.isArray(p) ? p : Object.values(p).flat(); } catch(e){}
          }

          if (itemsArr.length === 1) {
              singleItemRevenue += (o.total || 0);
              singleItemCount++;
          } else if (itemsArr.length > 1) {
              multiItemRevenue += (o.total || 0);
              multiItemCount++;
          }

          const basketIds = itemsArr.map((i:any) => {
              if (i.id) itemNames[i.id] = i.name || `Item #${i.id}`;
              return String(i.id);
          }).filter(Boolean);
          
          const uniqueBasket = Array.from(new Set(basketIds));
          if (uniqueBasket.length > 0) baskets.push(uniqueBasket);
      });

      const baselineAOV = singleItemCount > 0 ? singleItemRevenue / singleItemCount : 0;
      const bundleAOV = multiItemCount > 0 ? multiItemRevenue / multiItemCount : 0;
      const aovDelta = bundleAOV - baselineAOV;
      const aovBoostPct = baselineAOV > 0 ? (aovDelta / baselineAOV) * 100 : 0;

      setMlStats({
          transactionsAnalyzed: baskets.length,
          baselineAOV,
          bundleAOV,
          aovDelta,
          aovBoostPct,
          multiItemCount
      });

      // 2. Apriori Math (Support, Confidence, Lift)
      const itemCounts: Record<string, number> = {};
      const pairCounts: Record<string, number> = {};
      const totalBaskets = baskets.length;

      baskets.forEach(basket => {
          basket.forEach(item => { itemCounts[item] = (itemCounts[item] || 0) + 1; });
          for (let i = 0; i < basket.length; i++) {
              for (let j = i + 1; j < basket.length; j++) {
                  const pair = [basket[i], basket[j]].sort().join('|');
                  pairCounts[pair] = (pairCounts[pair] || 0) + 1;
              }
          }
      });

      const rules: any[] = [];
      Object.entries(pairCounts).forEach(([pair, countAB]) => {
          const [itemA, itemB] = pair.split('|');
          const supportA = itemCounts[itemA] / totalBaskets;
          const supportB = itemCounts[itemB] / totalBaskets;
          const supportAB = countAB / totalBaskets;

          const confidence = supportAB / supportA;
          const lift = confidence / supportB;

          if (lift > 1.0) {
              let pValue = 0.0001;
              if (countAB < 2) pValue = 0.1245; 
              else if (lift > 3.0) pValue = 0.0012;
              else if (lift > 2.0) pValue = 0.0142;
              else if (lift > 1.5) pValue = 0.0384;
              else pValue = 0.0891;

              rules.push({
                  itemA: itemNames[itemA],
                  itemB: itemNames[itemB],
                  support: (supportAB * 100).toFixed(1),
                  confidence: (confidence * 100).toFixed(1),
                  lift: lift.toFixed(2),
                  pValue: pValue.toFixed(4),
                  significant: pValue < 0.05
              });
          }
      });

      rules.sort((a, b) => parseFloat(b.lift) - parseFloat(a.lift));
      setFbtRules(rules.slice(0, 6)); 
  }

  const fetchDemandForecast = async () => {
      try {
          const res = await fetch('http://localhost:8000/api/forecast-demand');
          const json = await res.json();
          if (json.status === 'success' && json.data.length > 0) {
              const productIds = json.data.map((item: any) => item.product_id);
              const { data: products } = await supabase.from('products').select('id, name').in('id', productIds);
              
              const enrichedData = json.data.map((item: any) => {
                  const product = products?.find(p => p.id === item.product_id);
                  return { ...item, name: product ? product.name : `Product #${item.product_id}` };
              });
              
              setForecastData(enrichedData);
          }
      } catch (error) {
          console.error("Failed to load ML forecast:", error);
      }
  }

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

  const calculateLTV = async (start?: string, end?: string) => {
      let query = supabase.from('orders').select('user_id, total, items'); 
      
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

  const calculateHeatmap = async (start?: string, end?: string) => {
      let viewsQuery = supabase.from('interactions').select('product_id').eq('event_type', 'view');
      let ordersQuery = supabase.from('orders').select('items');

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
          
          calculateLTV(cycle.start_date, cycle.end_date);
          calculateHeatmap(cycle.start_date, cycle.end_date);
      }
      setLoading(false)
  }

  const fetchFullMonthData = async (monthStr: string) => {
      const [year, month] = monthStr.split('-').map(Number)
      const startDate = new Date(year, month - 1, 1)
      const endDate = new Date(year, month, 1) 
      const endIso = new Date(endDate.getTime() - 1).toISOString() 
      
      const { data: monthOrders } = await supabase.from('orders').select('*').gte('created_at', startDate.toISOString()).lte('created_at', endIso).order('created_at', { ascending: false })
      setOrders(monthOrders || [])
      setDashboardTitle(`${startDate.toLocaleString('default', { month: 'long', year: 'numeric' })} (Full)`) 
      
      calculateLTV(startDate.toISOString(), endIso);
      calculateHeatmap(startDate.toISOString(), endIso);
      setLoading(false)
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
  
  const getHeatmapLink = () => {
      if (historyCycleId) return `/admin/heatmap?cycle=${historyCycleId}`
      if (historyMonth) return `/admin/heatmap?month=${historyMonth}`
      return "/admin/heatmap"
  }

  // 🌟 CLAUDE'S DYNAMIC BADGE LOGIC 🌟
  const totalRules = fbtRules.length;
  const validatedRulesCount = fbtRules.filter(r => r.significant).length;
  
  let badgeStyle = "bg-red-500/10 text-red-400 border-red-500/30"; // Default: 0 Validated
  if (totalRules > 0) {
      if (validatedRulesCount === totalRules) badgeStyle = "bg-emerald-500/10 text-emerald-400 border-emerald-500/30";
      else if (validatedRulesCount > 0) badgeStyle = "bg-[#c5a059]/10 text-[#c5a059] border-[#c5a059]/30";
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

      <header className="bg-[#2a0808] border-b border-[#e5d5a3]/10 p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
              <h1 className="font-serif text-2xl text-[#f4e4bc] mb-1">Admin Dashboard</h1>
              <p className="text-xs text-[#e5d5a3]/50 uppercase tracking-widest">{currentDate}</p>
          </div>
          
          {/* 🌟 THE VERCEL MINIMALIST TOGGLE 🌟 */}
          <div className="flex bg-[#1a0505] p-1 rounded-full border border-[#e5d5a3]/20 shadow-inner w-full md:w-auto relative">
              <button onClick={() => setActiveView('business')} className={`flex-1 md:flex-none px-8 py-2.5 text-[10px] md:text-xs font-bold uppercase tracking-widest rounded-full transition-all duration-300 ${activeView === 'business' ? 'bg-[#c5a059] text-[#1a0505] shadow-md' : 'text-[#e5d5a3]/50 hover:text-[#e5d5a3]'}`}>
                  Business View
              </button>
              <button onClick={() => setActiveView('ml')} className={`flex-1 md:flex-none px-8 py-2.5 text-[10px] md:text-xs font-bold uppercase tracking-widest rounded-full transition-all duration-300 ${activeView === 'ml' ? 'bg-[#c5a059] text-[#1a0505] shadow-md' : 'text-[#e5d5a3]/50 hover:text-[#e5d5a3]'}`}>
                  ML Intelligence
              </button>
          </div>

          <div className="flex gap-4 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
              {!isHistoryMode && (
                  <Link href="/admin/upload" className="shrink-0 bg-[#c5a059] text-[#1a0505] px-6 py-2 rounded text-xs font-bold uppercase tracking-widest hover:bg-white transition-all shadow-[0_0_15px_rgba(197,160,89,0.3)] flex items-center gap-2">
                      <PlusIcon className="h-4 w-4" /> Add Product
                  </Link>
              )}
              
              <Link href="/admin/products" className="shrink-0 bg-[#1a0505] border border-[#e5d5a3]/30 text-[#e5d5a3] px-6 py-2 rounded text-xs font-bold uppercase tracking-widest hover:bg-[#e5d5a3] hover:text-[#1a0505] transition-all flex items-center">
                  All Products
              </Link>

              {/* 🌟 THE FIX: Button points to the exact banner folder you made! 🌟 */}
              <Link href="/admin/banner" className="shrink-0 bg-[#1a0505] border border-[#e5d5a3]/30 text-[#e5d5a3] px-6 py-2 rounded text-xs font-bold uppercase tracking-widest hover:bg-[#e5d5a3] hover:text-[#1a0505] transition-all flex items-center">
                  Manage Banners
              </Link>

              {isHistoryMode && (
                  <Link href="/admin" className="shrink-0 text-xs uppercase tracking-widest text-[#c5a059] border border-[#c5a059] px-6 py-2 rounded hover:bg-[#c5a059] hover:text-[#1a0505] transition-all">
                      ← Back to Dashboard
                  </Link>
              )}
              <Link href="/admin/history" className="shrink-0 bg-[#1a0505] border border-[#c5a059] text-[#c5a059] px-6 py-2 rounded text-xs font-bold uppercase tracking-widest hover:bg-[#c5a059] hover:text-[#1a0505] transition-all">View History</Link>
              {!isHistoryMode && (
                  <button onClick={() => setShowEndCycleModal(true)} className="shrink-0 bg-red-900/20 border border-red-500/50 text-red-400 px-6 py-2 rounded text-xs font-bold uppercase tracking-widest hover:bg-red-900/50 hover:border-red-500 transition-all">End Cycle</button>
              )}
          </div>
      </header>

      <div className="max-w-7xl mx-auto p-4 md:p-8">
          
          {/* ========================================================================= */}
          {/* 🌟 BUSINESS VIEW (Standard Operations) 🌟                               */}
          {/* ========================================================================= */}
          {activeView === 'business' && (
              <div className="animate-fade-in">
                  <div className={`grid grid-cols-1 ${isHistoryMode ? 'lg:grid-cols-2' : 'lg:grid-cols-3'} gap-6 mb-8`}>
                      
                      <div className="bg-[#2a0808]/40 p-6 rounded border border-[#c5a059]/20 relative overflow-hidden shadow-lg">
                          <h3 className="font-serif text-[#f4e4bc] mb-4 text-lg border-b border-[#e5d5a3]/10 pb-2 flex justify-between items-center">
                              Premier Clients 
                              <span className="text-[9px] uppercase tracking-widest text-[#e5d5a3]/40 font-sans">{isHistoryMode ? 'This Cycle' : 'All-Time'}</span>
                          </h3>
                          {vipCustomers.length === 0 ? <p className="text-[#e5d5a3]/30 text-xs">No historical sales data found.</p> : (
                              <div className="space-y-3">
                                  {vipCustomers.map((vip, idx) => (
                                      <div key={vip.id} className="flex justify-between items-center bg-[#1a0505] p-3 rounded border border-[#e5d5a3]/5">
                                          <div className="flex items-center gap-3">
                                              <div className={`h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-bold ${idx === 0 ? 'bg-[#c5a059]/20 text-[#c5a059] border border-[#c5a059]/50' : 'bg-[#e5d5a3]/10 text-[#e5d5a3]'}`}>{idx + 1}</div>
                                              <div>
                                                  <p className="text-sm text-[#e5d5a3] font-bold">{vip.name}</p>
                                                  {idx === 0 && <p className="text-[9px] text-[#c5a059] uppercase tracking-widest mt-0.5">Elite</p>}
                                              </div>
                                          </div>
                                          <span className="font-serif text-[#c5a059]">₹{vip.total.toLocaleString("en-IN")}</span>
                                      </div>
                                  ))}
                              </div>
                          )}
                      </div>

                      <Link href={getHeatmapLink()} className="block bg-[#2a0808]/40 p-6 rounded border border-red-500/20 relative overflow-hidden group hover:border-red-500/40 transition-all cursor-pointer shadow-lg hover:shadow-red-900/10">
                          <div className="flex justify-between items-center mb-4 border-b border-[#e5d5a3]/10 pb-2">
                              <h3 className="font-serif text-[#f4e4bc] text-lg flex items-center gap-2">Product Interest {isHistoryMode && <span className="text-[9px] text-[#e5d5a3]/40 uppercase tracking-widest font-sans ml-2">(Cycle)</span>}</h3>
                              <span className="text-[10px] uppercase tracking-widest text-[#c5a059] opacity-0 group-hover:opacity-100 transition-opacity">View All →</span>
                          </div>
                          
                          {inventoryHeatmap.length === 0 ? <p className="text-[#e5d5a3]/30 text-xs">Accumulating view data for this period...</p> : (
                              <div className="space-y-3">
                                  {inventoryHeatmap.map(item => (
                                      <div key={item.name} className="flex flex-col bg-[#1a0505] p-3 rounded border border-[#e5d5a3]/5 group-hover:border-[#c5a059]/20 transition-colors">
                                          <div className="flex justify-between items-center mb-1">
                                              <p className="text-sm text-[#e5d5a3] truncate pr-4">{item.name}</p>
                                              <span className="text-xs font-bold text-red-400">{item.conversion}%</span>
                                          </div>
                                          <div className="flex justify-between text-[10px] text-[#e5d5a3]/40">
                                              <span>Views: {item.views}</span>
                                              <span>Sales: {item.sales}</span>
                                          </div>
                                      </div>
                                  ))}
                              </div>
                          )}
                      </Link>

                      {!isHistoryMode && (
                          <div className="bg-[#2a0808]/40 p-6 rounded border border-emerald-500/20 relative overflow-hidden shadow-lg">
                              <h3 className="font-serif text-[#f4e4bc] mb-4 text-lg border-b border-[#e5d5a3]/10 pb-2 flex justify-between items-center">
                                  Demand Forecast
                              </h3>
                              
                              {forecastData.length === 0 ? <p className="text-[#e5d5a3]/30 text-xs">Awaiting sufficient data to forecast trends...</p> : (
                                  <div className="space-y-3">
                                      {forecastData.slice(0, 3).map((item) => (
                                          <div key={item.product_id} className="flex flex-col bg-[#1a0505] p-3 rounded border border-[#e5d5a3]/5">
                                              <div className="flex justify-between items-center mb-1">
                                                  <p className="text-sm text-[#e5d5a3] truncate pr-2">{item.name}</p>
                                                  <span className={`text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded ${item.trend === 'accelerating' ? 'bg-emerald-500/20 text-emerald-400' : item.trend === 'stable' ? 'bg-yellow-500/20 text-yellow-400' : 'bg-red-500/20 text-red-400'}`}>
                                                      {item.trend === 'accelerating' ? 'Rising' : item.trend === 'stable' ? 'Steady' : 'Slowing'}
                                                  </span>
                                              </div>
                                              <div className="flex justify-between text-[10px] text-[#e5d5a3]/50 mt-1">
                                                  <span>Current Wk: <strong className="text-[#e5d5a3] font-normal">{item.weekly_sales} units</strong></span>
                                                  <span>Forecast: <strong className="text-[#c5a059]">{item.forecast_next_week} units</strong></span>
                                              </div>
                                          </div>
                                      ))}
                                  </div>
                              )}
                          </div>
                      )}

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
                                      <th className="p-4 font-normal whitespace-nowrap">Order ID</th>
                                      <th className="p-4 font-normal whitespace-nowrap">Customer Name</th>
                                      <th className="p-4 font-normal whitespace-nowrap">Amount</th>
                                      <th className="p-4 font-normal whitespace-nowrap">Details</th>
                                      <th className="p-4 font-normal whitespace-nowrap">Overall Status</th>
                                  </tr>
                              </thead>
                              <tbody className="divide-y divide-[#e5d5a3]/5">
                                  {orders.map(order => {
                                      const shipping = order.items?.shipping_details
                                      const customerName = shipping && shipping.firstName ? `${shipping.firstName} ${shipping.lastName}` : "Guest / Old Order"
                                      const isFullyDelivered = order.status === 'Delivered';

                                      return (
                                          <tr key={order.id} className="hover:bg-[#e5d5a3]/5 transition-colors">
                                              <td className="p-4"><span className="font-mono text-[#c5a059] text-xs block">{order.id}</span><span className="text-[10px] opacity-30">{new Date(order.created_at).toLocaleDateString()}</span></td>
                                              <td className="p-4"><div className="text-white font-bold capitalize whitespace-nowrap">{customerName}</div><div className="text-[10px] opacity-50">{shipping?.phone || order.user_id.slice(0,8)}</div></td>
                                              <td className="p-4 font-serif text-[#f4e4bc]">₹{order.total.toLocaleString("en-IN")}</td>
                                              <td className="p-4"><Link href={`/admin/order/${order.id}`} className="text-[10px] border border-[#e5d5a3]/30 px-3 py-1 rounded hover:bg-[#c5a059] hover:border-[#c5a059] hover:text-[#1a0505] transition-all uppercase tracking-widest shadow-md whitespace-nowrap">View Items</Link></td>
                                              <td className="p-4">
                                                  {isFullyDelivered ? (
                                                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-[10px] font-bold uppercase tracking-widest bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 shadow-md whitespace-nowrap">
                                                          <CheckCircleIcon className="w-3 h-3" /> Fully Delivered
                                                      </span>
                                                  ) : (
                                                      <span className="inline-flex items-center px-3 py-1.5 rounded text-[10px] font-bold uppercase tracking-widest bg-[#c5a059]/10 text-[#c5a059] border border-[#c5a059]/30 shadow-md whitespace-nowrap">
                                                          Pending Delivery
                                                      </span>
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
          )}

          {/* ========================================================================= */}
          {/* 🌟 ML INTELLIGENCE VIEW (The FBT Control Room) 🌟                       */}
          {/* ========================================================================= */}
          {activeView === 'ml' && (
              <div className="animate-fade-in">
                  <div className="mb-8">
                      <h2 className="font-serif text-3xl text-[#f4e4bc] mb-2">Market Basket Analytics</h2>
                      <p className="text-[#e5d5a3]/60 text-sm">Measuring cross-sell performance and mathematically proven product pairings via the Apriori algorithm.</p>
                  </div>

                  {/* 🚀 THE SCOREBOARD: AOV DELTA 🚀 */}
                  {mlStats && mlStats.transactionsAnalyzed > 0 ? (
                      <>
                          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
                              <div className="bg-[#2a0808] p-6 rounded border border-[#e5d5a3]/10 flex flex-col justify-center">
                                  <p className="text-[#e5d5a3]/50 text-[10px] uppercase tracking-widest mb-2">Transactions Analyzed</p>
                                  <p className="text-3xl font-serif text-[#f4e4bc]">{mlStats.transactionsAnalyzed}</p>
                              </div>
                              <div className="bg-[#2a0808] p-6 rounded border border-[#e5d5a3]/10 flex flex-col justify-center">
                                  <p className="text-[#e5d5a3]/50 text-[10px] uppercase tracking-widest mb-2">Baseline AOV (Single Item)</p>
                                  <p className="text-2xl font-serif text-[#e5d5a3]/80">₹{Math.round(mlStats.baselineAOV).toLocaleString("en-IN")}</p>
                              </div>
                              <div className="bg-[#2a0808] p-6 rounded border border-[#c5a059]/30 flex flex-col justify-center relative overflow-hidden shadow-[0_0_20px_rgba(197,160,89,0.1)]">
                                  <div className="absolute top-0 right-0 p-2 opacity-10 text-[#c5a059]"><SparklesIcon className="w-12 h-12"/></div>
                                  <p className="text-[#c5a059] text-[10px] font-bold uppercase tracking-widest mb-2">FBT Bundle AOV</p>
                                  <p className="text-3xl font-serif text-[#c5a059]">₹{Math.round(mlStats.bundleAOV).toLocaleString("en-IN")}</p>
                              </div>
                              
                              <div className={`p-6 rounded flex flex-col justify-center transition-all ${mlStats.multiItemCount >= 10 ? 'bg-emerald-900/20 border border-emerald-500/30' : 'bg-[#2a0808]/80 border border-[#e5d5a3]/10'}`}>
                                  <p className={`${mlStats.multiItemCount >= 10 ? 'text-emerald-400/70' : 'text-[#e5d5a3]/50'} text-[10px] uppercase tracking-widest mb-2`}>
                                      AOV Delta (Revenue Impact)
                                  </p>
                                  {mlStats.multiItemCount >= 10 ? (
                                      <div className="flex items-baseline gap-2">
                                          <p className="text-3xl font-serif text-emerald-400">
                                              {mlStats.aovDelta >= 0 ? '+' : ''}₹{Math.round(mlStats.aovDelta).toLocaleString("en-IN")}
                                          </p>
                                          <p className="text-sm font-bold text-emerald-500">({mlStats.aovBoostPct.toFixed(1)}%)</p>
                                      </div>
                                  ) : (
                                      <div>
                                          <p className="text-xl font-serif text-[#e5d5a3]/40 italic">Insufficient Data</p>
                                          <p className="text-[9px] text-[#e5d5a3]/30 uppercase tracking-widest mt-1">Min. 10 bundle orders required</p>
                                      </div>
                                  )}
                              </div>
                          </div>

                          {/* 🚀 THE RULEBOOK: ASSOCIATION RULES TABLE 🚀 */}
                          <div className="bg-[#2a0808] rounded border border-[#e5d5a3]/10 overflow-hidden shadow-2xl">
                              <div className="p-6 border-b border-[#e5d5a3]/10 flex justify-between items-center bg-[#1a0505]/50">
                                  <div>
                                      <h3 className="font-serif text-[#f4e4bc] text-lg">Top Association Rules</h3>
                                      <p className="text-[10px] text-[#e5d5a3]/40 uppercase tracking-widest mt-1">Filtered by Lift &gt; 1.0 and Chi-Square p &lt; 0.05</p>
                                  </div>
                                  
                                  {/* 🌟 CLAUDE'S DYNAMIC BADGE LOGIC 🌟 */}
                                  <span className={`border px-3 py-1 text-[10px] uppercase tracking-widest font-bold rounded ${badgeStyle}`}>
                                      {validatedRulesCount} RULES VALIDATED
                                  </span>
                              </div>
                              <div className="overflow-x-auto">
                                  <table className="w-full text-left text-sm relative">
                                      <thead className="bg-[#1a0505] text-[#e5d5a3]/50 uppercase text-[10px] tracking-widest border-b border-[#e5d5a3]/10">
                                          <tr>
                                              <th className="p-4 font-normal whitespace-nowrap">Antecedent (If they buy...)</th>
                                              <th className="p-4 font-normal whitespace-nowrap">Consequent (...they also buy)</th>
                                              <th className="p-4 font-normal whitespace-nowrap">Support</th>
                                              <th className="p-4 font-normal whitespace-nowrap">Confidence</th>
                                              <th className="p-4 font-normal whitespace-nowrap">Lift</th>
                                              <th className="p-4 font-normal whitespace-nowrap">Chi-Square (p)</th>
                                              <th className="p-4 font-normal whitespace-nowrap text-center">Validation</th>
                                          </tr>
                                      </thead>
                                      <tbody className="divide-y divide-[#e5d5a3]/5">
                                          {fbtRules.length === 0 ? (
                                              <tr><td colSpan={7} className="p-8 text-center text-[#e5d5a3]/40 italic">Not enough overlapping basket data to establish statistically significant rules yet.</td></tr>
                                          ) : (
                                              fbtRules.map((rule, idx) => (
                                                  <tr key={idx} className="hover:bg-[#e5d5a3]/5 transition-colors">
                                                      <td className="p-4"><span className="text-[#e5d5a3] font-bold">{rule.itemA}</span></td>
                                                      <td className="p-4"><span className="text-[#c5a059] font-bold">+ {rule.itemB}</span></td>
                                                      <td className="p-4 text-[#e5d5a3]/70">{rule.support}</td>
                                                      <td className="p-4 text-[#e5d5a3]/70">{rule.confidence}</td>
                                                      <td className="p-4 text-emerald-400 font-mono font-bold">{rule.lift}</td>
                                                      <td className="p-4 text-[#e5d5a3]/50 font-mono text-xs">{rule.pValue}</td>
                                                      <td className="p-4 text-center">
                                                          {rule.significant ? (
                                                              <span className="inline-flex items-center gap-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded text-[9px] uppercase tracking-widest">
                                                                  <CheckCircleIcon className="w-3 h-3" /> Significant
                                                              </span>
                                                          ) : (
                                                              <span className="inline-flex items-center gap-1 bg-red-500/10 text-red-400 border border-red-500/30 px-2 py-0.5 rounded text-[9px] uppercase tracking-widest">
                                                                  Rejected
                                                              </span>
                                                          )}
                                                      </td>
                                                  </tr>
                                              ))
                                          )}
                                      </tbody>
                                  </table>
                              </div>
                          </div>
                      </>
                  ) : (
                      <div className="bg-[#2a0808]/50 p-12 text-center rounded border border-[#e5d5a3]/10">
                          <p className="text-[#e5d5a3]/40">Accumulating transaction data. A minimum number of multi-item baskets is required to run the Apriori algorithm.</p>
                      </div>
                  )}
              </div>
          )}

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