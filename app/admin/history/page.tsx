'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

// CONFIGURATION
const supabaseUrl = "https://fwyliqsazdyprlkemavu.supabase.co"
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ3eWxpcXNhemR5cHJsa2VtYXZ1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAzOTg2MzIsImV4cCI6MjA4NTk3NDYzMn0.dXkx1pEtiZ5uwcQJgisJs14ZyUJTuz-SomMCeZv-jbE"
const supabase = createClient(supabaseUrl, supabaseKey)

// ICONS
function FolderIcon({ className="h-8 w-8" }) { return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" /></svg> }
function TrashIcon({ className="h-4 w-4" }) { return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg> }
function WarningIcon({ className="h-12 w-12" }) { return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg> }

export default function HistoryPage() {
  const [cycles, setCycles] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [cycleToDelete, setCycleToDelete] = useState<string | null>(null)

  useEffect(() => {
    async function fetchCycles() {
      const { data } = await supabase.from('cycles').select('*').order('created_at', { ascending: false })
      if (data) setCycles(data)
      setLoading(false)
    }
    fetchCycles()
  }, [])

  const requestDelete = (e: React.MouseEvent, id: string) => {
      e.preventDefault(); e.stopPropagation(); setCycleToDelete(id)
  }

  const confirmDelete = async () => {
      if (!cycleToDelete) return
      const { error } = await supabase.from('cycles').delete().eq('id', cycleToDelete)
      if (!error) { setCycles(cycles.filter(c => c.id !== cycleToDelete)); setCycleToDelete(null) }
      else { alert("Error deleting record.") }
  }

  // 🌟 CALCULATE CURRENT MONTH KEY (e.g. "2026-02") 🌟
  // This allows us to link the "Active" card to the Aggregate Month View
  const currentMonthKey = new Date().toISOString().slice(0, 7);

  return (
    <div className="min-h-screen bg-[#1a0505] text-[#e5d5a3] font-sans p-8 relative">
      
      {/* DELETE MODAL */}
      {cycleToDelete && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm animate-fade-in">
              <div className="bg-[#2a0808] border border-[#c5a059] p-8 rounded-lg shadow-[0_0_30px_rgba(197,160,89,0.2)] max-w-sm w-full text-center">
                  <div className="flex justify-center mb-4 text-[#c5a059]"><WarningIcon /></div>
                  <h3 className="font-serif text-2xl text-[#f4e4bc] mb-2">Delete Record?</h3>
                  <p className="text-[#e5d5a3]/70 text-sm mb-8 leading-relaxed">Permanently delete this record?</p>
                  <div className="flex gap-4 justify-center">
                      <button onClick={() => setCycleToDelete(null)} className="px-6 py-3 border border-[#e5d5a3]/30 rounded text-[#e5d5a3] text-xs font-bold uppercase tracking-widest hover:border-[#e5d5a3] transition-all">Cancel</button>
                      <button onClick={confirmDelete} className="px-6 py-3 bg-red-900/80 border border-red-500/50 rounded text-red-100 text-xs font-bold uppercase tracking-widest hover:bg-red-800 hover:border-red-500 transition-all shadow-lg">Yes, Delete</button>
                  </div>
              </div>
          </div>
      )}

      {/* HEADER */}
      <div className="max-w-6xl mx-auto flex justify-between items-center mb-12 border-b border-[#e5d5a3]/10 pb-6">
          <h1 className="font-serif text-3xl text-[#f4e4bc]">Record History</h1>
          {/* 🌟 THIS BUTTON GOES TO THE LIVE DASHBOARD (Which might be 0) 🌟 */}
          <Link href="/admin" className="text-xs uppercase tracking-widest text-[#c5a059] border border-[#c5a059] px-6 py-2 rounded hover:bg-[#c5a059] hover:text-[#1a0505] transition-all">
              ← Back to Dashboard
          </Link>
      </div>

      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          
          {/* 🌟 ACTIVE CARD: NOW LINKS TO FULL MONTH AGGREGATE VIEW 🌟 */}
          {/* Instead of href="/admin", it goes to ?month=2026-02 to show EVERYTHING */}
          <Link href={`/admin?month=${currentMonthKey}`} className="bg-[#2a0808] border border-[#c5a059] p-6 rounded hover:scale-105 transition-transform group relative overflow-hidden block">
              <div className="absolute top-0 right-0 bg-[#c5a059] text-[#1a0505] text-[10px] font-bold px-3 py-1 uppercase tracking-widest">Active Month</div>
              <div className="text-[#c5a059] mb-4"><FolderIcon /></div>
              <h3 className="text-xl font-serif text-white mb-1">{new Date().toLocaleString('default', { month: 'long', year: 'numeric' })}</h3>
              <p className="text-xs text-[#e5d5a3]/50 uppercase tracking-widest">View Full Month Records</p>
          </Link>

          {/* HISTORY CARDS */}
          {cycles.map(cycle => {
              const startDate = new Date(cycle.start_date).toLocaleDateString('en-GB')
              const endDate = new Date(cycle.end_date).toLocaleDateString('en-GB')
              const dateRange = `${startDate} - ${endDate}`
              const monthYear = new Date(cycle.start_date).toLocaleString('default', { month: 'long', year: 'numeric' })

              return (
                  <div key={cycle.id} className="relative group">
                      <Link href={`/admin?cycle=${cycle.id}`} className="block bg-[#2a0808] border border-[#e5d5a3]/20 p-6 rounded hover:border-[#c5a059] hover:scale-105 transition-all h-full">
                          <div className="text-[#e5d5a3]/40 group-hover:text-[#c5a059] mb-4 transition-colors"><FolderIcon /></div>
                          <h3 className="text-xl font-serif text-[#f4e4bc] mb-1">{monthYear}</h3>
                          <p className="text-xs text-[#c5a059] uppercase tracking-widest mb-4 font-mono">{dateRange}</p>
                          <div className="space-y-1 pt-2 border-t border-[#e5d5a3]/10">
                              <div className="flex justify-between text-xs text-[#e5d5a3]/60"><span>Revenue:</span><span className="text-white">₹{cycle.total_revenue.toLocaleString("en-IN")}</span></div>
                              <div className="flex justify-between text-xs text-[#e5d5a3]/60"><span>Orders:</span><span className="text-white">{cycle.total_orders}</span></div>
                          </div>
                      </Link>
                      <button onClick={(e) => requestDelete(e, cycle.id)} className="absolute top-4 right-4 border border-red-500/30 text-red-500/70 p-2 rounded hover:bg-red-500 hover:text-white transition-all z-10" title="Delete Record"><TrashIcon /></button>
                  </div>
              )
          })}

          {!loading && cycles.length === 0 && (
              <div className="col-span-full text-center py-12 border border-dashed border-[#e5d5a3]/10 rounded text-[#e5d5a3]/30 italic">
                  No ended cycles found.
              </div>
          )}
      </div>
    </div>
  )
}