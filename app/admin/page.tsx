'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import RevenueChart from './chart/RevenueChart' // 🌟 IMPORT THE CHART

// CONFIGURATION
const supabaseUrl = "https://fwyliqsazdyprlkemavu.supabase.co"
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ3eWxpcXNhemR5cHJsa2VtYXZ1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAzOTg2MzIsImV4cCI6MjA4NTk3NDYzMn0.dXkx1pEtiZ5uwcQJgisJs14ZyUJTuz-SomMCeZv-jbE"
const supabase = createClient(supabaseUrl, supabaseKey)

// ⚠️ YOUR ADMIN EMAIL
const MY_ADMIN_EMAIL = "lahareshab@gmail.com" 

// ICONS
function WarningIcon({ className="h-12 w-12" }) { return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg> }
function CheckCircleIcon({ className="h-5 w-5" }) { return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> }

export default function AdminPage() {
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
      
      if (historyCycleId) fetchManualCycleData(historyCycleId)
      else if (historyMonth) fetchFullMonthData(historyMonth)
      else fetchLiveOrders() 
    }
    init()
  }, [historyCycleId, historyMonth])

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
      setLoading(false)
  }

  const fetchManualCycleData = async (id: string) => {
      const { data: cycle } = await supabase.from('cycles').select('*').eq('id', id).single()
      if (cycle) {
          setDashboardTitle(`${new Date(cycle.start_date).toLocaleDateString('en-GB')} - ${new Date(cycle.end_date).toLocaleDateString('en-GB')}`)
          const { data: oldOrders } = await supabase.from('orders').select('*').gte('created_at', cycle.start_date).lte('created_at', cycle.end_date).order('created_at', { ascending: false })
          setOrders(oldOrders || [])
      }
      setLoading(false)
  }

  const fetchFullMonthData = async (monthStr: string) => {
      const [year, month] = monthStr.split('-').map(Number)
      const startDate = new Date(year, month - 1, 1)
      const endDate = new Date(year, month, 1) 
      const { data: monthOrders } = await supabase.from('orders').select('*').gte('created_at', startDate.toISOString()).lt('created_at', endDate.toISOString()).order('created_at', { ascending: false })
      setOrders(monthOrders || [])
      setDashboardTitle(`${startDate.toLocaleString('default', { month: 'long', year: 'numeric' })} (Full)`) 
      setLoading(false)
  }

  const updateStatus = async (orderId: string, newStatus: string) => {
      setOrders(orders.map(o => o.id === orderId ? { ...o, status: newStatus } : o))
      await supabase.from('orders').update({ status: newStatus }).eq('id', orderId)
  }

  const handleEndCycle = async () => {
      const stats = calculateStats(orders)
      const cycleName = `${new Date().toLocaleString('default', { month: 'long', year: 'numeric' })}`
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

  return (
    <div className="min-h-screen bg-[#1a0505] text-[#e5d5a3] font-sans relative">
      
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
              
              {isHistoryMode && (
                  <Link href="/admin" className="text-xs uppercase tracking-widest text-[#c5a059] border border-[#c5a059] px-6 py-2 rounded hover:bg-[#c5a059] hover:text-[#1a0505] transition-all">
                      ← Back to Dashboard
                  </Link>
              )}

              <Link href="/admin/history" className="bg-[#1a0505] border border-[#c5a059] text-[#c5a059] px-6 py-2 rounded text-xs font-bold uppercase tracking-widest hover:bg-[#c5a059] hover:text-[#1a0505] transition-all">View History</Link>
              
              {!isHistoryMode && (
                  <button onClick={() => setShowEndCycleModal(true)} className="bg-red-900/20 border border-red-500/50 text-red-400 px-6 py-2 rounded text-xs font-bold uppercase tracking-widest hover:bg-red-900/50 hover:border-red-500 transition-all">End Current Cycle</button>
              )}
          </div>
      </header>

      <div className="max-w-7xl mx-auto p-8">
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

          {/* 🌟 INSERTED CHART HERE 🌟 */}
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