'use client'
import { useState, useEffect, useRef } from 'react'
import { createClient } from '@supabase/supabase-js'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

// CONFIGURATION
const supabaseUrl = "https://fwyliqsazdyprlkemavu.supabase.co"
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ3eWxpcXNhemR5cHJsa2VtYXZ1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAzOTg2MzIsImV4cCI6MjA4NTk3NDYzMn0.dXkx1pEtiZ5uwcQJgisJs14ZyUJTuz-SomMCeZv-jbE"
const supabase = createClient(supabaseUrl, supabaseKey)

// STATIC DATA
const INDIAN_STATES = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Goa", "Gujarat", "Haryana", 
  "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", 
  "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", 
  "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal", "Andaman and Nicobar Islands", "Chandigarh", 
  "Dadra and Nagar Haveli and Daman and Diu", "Delhi", "Jammu and Kashmir", "Ladakh", "Lakshadweep", "Puducherry"
];

const TN_CITIES = [
  "Chennai", "Coimbatore", "Madurai", "Tiruchirappalli", "Salem", "Tirunelveli", "Tiruppur", "Vellore", 
  "Erode", "Thoothukudi", "Dindigul", "Thanjavur", "Ranipet", "Sivakasi", "Karur", "Udhagamandalam (Ooty)", 
  "Hosur", "Nagercoil", "Kanchipuram", "Kumarapalayam", "Karaikudi", "Neyveli", "Cuddalore", "Kumbakonam", 
  "Tiruvannamalai", "Pollachi", "Rajapalayam", "Gudiyatham", "Pudukkottai", "Vaniyambadi", "Ambur", 
  "Nagapattinam", "Villupuram", "Theni", "Krishnagiri", "Dharmapuri", "Kovilpatti", "Theni Allinagaram"
];

// ICONS
function BoxIcon({ className="h-6 w-6" }) { return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg> }
function MapIcon({ className="h-6 w-6" }) { return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg> }
function ShieldIcon({ className="h-6 w-6" }) { return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg> }
function ClockIcon({ className="h-6 w-6" }) { return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> }
function TrashIcon({ className="h-4 w-4" }) { return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg> }
function PlusIcon({ className="h-5 w-5" }) { return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg> }
function EditIcon({ className="h-4 w-4" }) { return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" /></svg> }
function WarningIcon({ className="h-12 w-12" }) { return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg> }

export default function AccountPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('dashboard') 
  
  const [addresses, setAddresses] = useState<any[]>([])
  const [orders, setOrders] = useState<any[]>([])
  const [recentlyViewed, setRecentlyViewed] = useState<any[]>([])
  
  // FORM STATES
  const [showAddressForm, setShowAddressForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState({ 
      name: '', street: '', city: '', state: '', zip: '', phone: '', country: '' 
  })

  // DROPDOWNS
  const [showStateDropdown, setShowStateDropdown] = useState(false)
  const [showCityDropdown, setShowCityDropdown] = useState(false)
  
  // DELETE MODAL STATE
  const [orderToDelete, setOrderToDelete] = useState<string | null>(null)
  
  const stateDropdownRef = useRef<HTMLDivElement>(null)
  const cityDropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    async function init() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.push('/'); return }
      setUser(session.user)

      const { data: addr } = await supabase.from('addresses').select('*')
      if (addr) setAddresses(addr)

      const { data: ord } = await supabase.from('orders').select('*').order('created_at', { ascending: false })
      if (ord) setOrders(ord)

      const viewed = JSON.parse(localStorage.getItem('recentlyViewed') || '[]')
      setRecentlyViewed(viewed)
      setLoading(false)
    }
    init()

    function handleClickOutside(event: any) {
        if (stateDropdownRef.current && !stateDropdownRef.current.contains(event.target)) setShowStateDropdown(false)
        if (cityDropdownRef.current && !cityDropdownRef.current.contains(event.target)) setShowCityDropdown(false)
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [])

  const handleLogout = async () => { await supabase.auth.signOut(); router.push('/') }
  const handleDeleteAccount = async () => { if(window.confirm("Are you sure?")) alert("Account deletion requested.") }
  
  const handleDeleteAddress = async (id: string) => { 
      if(!window.confirm("Delete this address?")) return
      await supabase.from('addresses').delete().eq('id', id)
      setAddresses(addresses.filter(a => a.id !== id)) 
  }

  const handleDeleteOrder = async (id: string) => {
      // Logic handled by modal
  }

  const requestDeleteOrder = (id: string) => {
      setOrderToDelete(id)
  }

  const confirmDeleteOrder = async () => {
      if (!orderToDelete) return
      const { error } = await supabase.from('orders').delete().eq('id', orderToDelete)
      if (!error) {
          setOrders(orders.filter(o => o.id !== orderToDelete))
      } else {
          alert("Could not remove order.")
      }
      setOrderToDelete(null) 
  }

  const handleEditAddress = (addr: any) => {
      setFormData({
          name: addr.name, street: addr.street, city: addr.city, state: addr.state,
          zip: addr.zip, phone: addr.phone, country: addr.country || ''
      })
      setEditingId(addr.id)
      setShowAddressForm(true)
  }

  const openNewAddressForm = () => {
      setFormData({ name: '', street: '', city: '', state: '', zip: '', phone: '', country: '' })
      setEditingId(null)
      setShowAddressForm(true)
  }
  
  const goBackToDashboard = () => {
      setActiveTab('dashboard')
      setShowAddressForm(false)
      setEditingId(null)
      setShowStateDropdown(false)
      setShowCityDropdown(false)
  }

  const handleSaveAddress = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    if (editingId) {
        const { data } = await supabase.from('addresses').update({ ...formData }).eq('id', editingId).select()
        if (data) {
            setAddresses(addresses.map(a => a.id === editingId ? data[0] : a))
            setShowAddressForm(false)
        }
    } else {
        const { data } = await supabase.from('addresses').insert({ user_id: user.id, ...formData }).select()
        if (data) {
            setAddresses([...addresses, data[0]])
            setShowAddressForm(false)
        }
    }
  }

  if (loading) return <div className="min-h-screen bg-[#1a0505] flex items-center justify-center text-[#c5a059] font-serif">Loading your royal profile...</div>

  const isIndia = formData.country.trim().toLowerCase() === 'india';
  const isTamilNadu = formData.state.trim().toLowerCase() === 'tamil nadu';
  const filteredStates = INDIAN_STATES.filter(s => s.toLowerCase().includes(formData.state.toLowerCase()));
  const filteredCities = TN_CITIES.filter(c => c.toLowerCase().includes(formData.city.toLowerCase()));

  return (
    <div className="min-h-screen bg-[#1a0505] text-[#e5d5a3] font-sans relative">
      
      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: #1a0505; border-radius: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background-color: #c5a059; border-radius: 4px; border: 1px solid #1a0505; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background-color: #e5d5a3; }
      `}</style>

      {/* CUSTOM ROYAL DELETE MODAL */}
      {orderToDelete && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm animate-fade-in">
              <div className="bg-[#2a0808] border border-[#c5a059] p-8 rounded-lg shadow-[0_0_30px_rgba(197,160,89,0.2)] max-w-sm w-full text-center">
                  <div className="flex justify-center mb-4 text-[#c5a059]">
                      <WarningIcon />
                  </div>
                  <h3 className="font-serif text-2xl text-[#f4e4bc] mb-2">Remove Order?</h3>
                  <p className="text-[#e5d5a3]/70 text-sm mb-8 leading-relaxed">
                      Are you sure you want to remove this delivered order from your history? This action cannot be undone.
                  </p>
                  <div className="flex gap-4 justify-center">
                      <button 
                          onClick={() => setOrderToDelete(null)} 
                          className="px-6 py-3 border border-[#e5d5a3]/30 rounded text-[#e5d5a3] text-xs font-bold uppercase tracking-widest hover:border-[#e5d5a3] transition-all"
                      >
                          Cancel
                      </button>
                      <button 
                          onClick={confirmDeleteOrder} 
                          className="px-6 py-3 bg-red-900/80 border border-red-500/50 rounded text-red-100 text-xs font-bold uppercase tracking-widest hover:bg-red-800 hover:border-red-500 transition-all shadow-lg"
                      >
                          Yes, Remove
                      </button>
                  </div>
              </div>
          </div>
      )}

      {/* HEADER */}
      <header className="border-b border-[#e5d5a3]/10 bg-[#1a0505] p-6 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <Link href="/" className="font-serif text-2xl font-bold tracking-widest text-[#e5d5a3]">LOTUS</Link>
          <button onClick={handleLogout} className="text-xs uppercase tracking-widest text-[#e5d5a3]/60 hover:text-red-400 transition-colors font-bold">Sign Out</button>
        </div>
      </header>

      <div className="max-w-6xl mx-auto p-6 md:p-12">
        <h1 className="font-serif text-3xl md:text-4xl text-[#f4e4bc] mb-2">Your Account</h1>
        <p className="text-[#e5d5a3]/50 text-sm mb-12 italic">Welcome back, {user?.email}</p>

        {/* DASHBOARD GRID */}
        {activeTab === 'dashboard' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div onClick={() => setActiveTab('orders')} className="bg-[#2a0808] border border-[#e5d5a3]/20 p-6 rounded hover:border-[#c5a059] cursor-pointer transition-all flex items-center gap-4 group">
              <div className="p-3 bg-[#1a0505] rounded-full text-[#c5a059] group-hover:scale-110 transition-transform"><BoxIcon /></div>
              <div><h3 className="font-serif text-lg text-[#f4e4bc]">Your Orders</h3><p className="text-xs text-[#e5d5a3]/50">Track, return, or buy things again.</p></div>
            </div>
            <div onClick={() => setActiveTab('addresses')} className="bg-[#2a0808] border border-[#e5d5a3]/20 p-6 rounded hover:border-[#c5a059] cursor-pointer transition-all flex items-center gap-4 group">
              <div className="p-3 bg-[#1a0505] rounded-full text-[#c5a059] group-hover:scale-110 transition-transform"><MapIcon /></div>
              <div><h3 className="font-serif text-lg text-[#f4e4bc]">Your Addresses</h3><p className="text-xs text-[#e5d5a3]/50">Edit addresses for orders.</p></div>
            </div>
            <div onClick={() => setActiveTab('security')} className="bg-[#2a0808] border border-[#e5d5a3]/20 p-6 rounded hover:border-[#c5a059] cursor-pointer transition-all flex items-center gap-4 group">
              <div className="p-3 bg-[#1a0505] rounded-full text-[#c5a059] group-hover:scale-110 transition-transform"><ShieldIcon /></div>
              <div><h3 className="font-serif text-lg text-[#f4e4bc]">Login & Security</h3><p className="text-xs text-[#e5d5a3]/50">Manage account settings.</p></div>
            </div>
          </div>
        )}

        {/* ─── ORDERS TAB (FIXED STATUS TEXT) ─── */}
        {activeTab === 'orders' && (
          <div>
            <button onClick={goBackToDashboard} className="mb-6 text-xs text-[#c5a059] hover:underline uppercase tracking-widest font-bold">← Back to Account</button>
            <h2 className="font-serif text-2xl text-[#f4e4bc] mb-6">Your Orders</h2>
            {orders.length === 0 ? (
              <div className="p-8 border border-dashed border-[#e5d5a3]/20 rounded text-center text-[#e5d5a3]/40 italic">You haven't placed any orders yet.</div>
            ) : (
              <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                {orders.map(order => {
                  const firstItem = Array.isArray(order.items) ? order.items[0] : (order.items?.products?.[0] || {});
                  const isDelivered = (order.status || '').toLowerCase().includes('delivered');
                  
                  // 🌟 FIX: Map "Processing" -> "ORDER PLACED" 🌟
                  const displayStatus = (order.status === 'Processing') ? 'ORDER PLACED' : order.status;

                  return (
                    <div key={order.id} className="bg-[#2a0808] p-6 rounded border border-[#e5d5a3]/10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 hover:border-[#e5d5a3]/30 transition-colors relative">
                      
                      {isDelivered && (
                          <button 
                            onClick={() => requestDeleteOrder(order.id)} 
                            className="absolute top-4 right-4 text-[#e5d5a3]/20 hover:text-red-500 transition-colors z-10"
                            title="Remove from history"
                          >
                              <TrashIcon />
                          </button>
                      )}

                      <div className="flex gap-4 items-center w-full">
                         <div className="h-20 w-20 bg-[#1a0505] rounded overflow-hidden flex-shrink-0 border border-[#e5d5a3]/10">
                            {firstItem?.image_url ? <img src={firstItem.image_url} className="h-full w-full object-cover" /> : <div className="h-full w-full flex items-center justify-center text-[10px] text-[#e5d5a3]/30">NO IMAGE</div>}
                         </div>
                         <div className="flex-1">
                            <h4 className="text-[#f4e4bc] font-serif text-lg leading-tight mb-1">{firstItem?.name || "Royal Treasure"}</h4>
                            <p className="text-[#e5d5a3]/50 text-xs mb-2">Order ID: <span className="font-mono text-[#c5a059]">{order.id}</span></p>
                            <p className="text-[#e5d5a3]/40 text-[10px]">Ordered on {new Date(order.created_at).toDateString()}</p>
                         </div>
                      </div>
                      
                      <div className="flex flex-col items-end gap-2 w-full md:w-auto pl-20 md:pl-0">
                        <div className="flex items-center gap-4">
                            {isDelivered && (
                                <button 
                                    onClick={() => requestDeleteOrder(order.id)} 
                                    className="border border-red-500/50 text-red-500 p-1.5 rounded hover:bg-red-500 hover:text-white transition-all"
                                    title="Remove from history"
                                >
                                    <TrashIcon />
                                </button>
                            )}
                            <p className="font-bold text-xl text-[#f4e4bc]">₹{order.total.toLocaleString("en-IN")}</p>
                        </div>

                        {/* 🌟 USE displayStatus HERE 🌟 */}
                        <span className={`text-[10px] bg-[#e5d5a3]/10 px-3 py-1 rounded uppercase tracking-widest font-bold mb-2 border border-[#e5d5a3]/10 ${isDelivered ? 'text-green-400 border-green-900/30 bg-green-900/10' : 'text-[#e5d5a3]'}`}>
                            {displayStatus}
                        </span>
                        
                        {!isDelivered && (
                            <Link href={`/track?id=${order.id}`} className="bg-transparent border border-[#c5a059] text-[#c5a059] px-6 py-2 rounded font-bold uppercase text-[10px] tracking-widest hover:bg-[#c5a059] hover:text-[#1a0505] transition-all text-center whitespace-nowrap">Track Order</Link>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* ADDRESSES TAB */}
        {activeTab === 'addresses' && (
          <div>
            <button onClick={goBackToDashboard} className="mb-6 text-xs text-[#c5a059] hover:underline uppercase tracking-widest font-bold">← Back to Account</button>
            <h2 className="font-serif text-2xl text-[#f4e4bc] mb-6">Your Addresses</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {!showAddressForm && (
                <button onClick={openNewAddressForm} className="h-full min-h-[150px] border-2 border-dashed border-[#e5d5a3]/20 rounded flex flex-col items-center justify-center gap-2 text-[#e5d5a3]/50 hover:border-[#c5a059] hover:text-[#c5a059] transition-all group">
                  <PlusIcon className="h-8 w-8 group-hover:scale-110 transition-transform" />
                  <span className="text-xs uppercase tracking-widest font-bold">Add Address</span>
                </button>
              )}

              {!showAddressForm && addresses.map(addr => (
                <div key={addr.id} className="bg-[#2a0808] p-6 rounded border border-[#e5d5a3]/20 relative hover:border-[#e5d5a3]/40 transition-colors group">
                  <div className="absolute top-4 right-4 flex gap-3">
                      <button onClick={() => handleEditAddress(addr)} className="border border-[#c5a059] text-[#c5a059] p-2 rounded hover:bg-[#c5a059] hover:text-[#1a0505] transition-all"><EditIcon /></button>
                      <button onClick={() => handleDeleteAddress(addr.id)} className="border border-red-500 text-red-500 p-2 rounded hover:bg-red-500 hover:text-white transition-all"><TrashIcon /></button>
                  </div>
                  <h3 className="font-bold text-[#f4e4bc] mb-2 font-serif pr-20">{addr.name}</h3>
                  <p className="text-sm text-[#e5d5a3]/70">{addr.street}</p>
                  <p className="text-sm text-[#e5d5a3]/70">{addr.city}, {addr.state} - {addr.zip}</p>
                  {addr.country && <p className="text-sm text-[#e5d5a3]/70 font-bold">{addr.country}</p>}
                  <p className="text-sm text-[#c5a059] mt-3 font-bold text-xs tracking-widest uppercase">Phone: {addr.phone}</p>
                </div>
              ))}
            </div>

            {showAddressForm && (
              <div className="mt-4 bg-[#1a0505] border border-[#e5d5a3]/20 p-8 rounded shadow-2xl max-w-lg">
                <h3 className="font-serif text-xl text-[#f4e4bc] mb-6">{editingId ? 'Update Shipping Address' : 'New Shipping Address'}</h3>
                <form onSubmit={handleSaveAddress} className="space-y-4">
                  <div className="flex flex-col gap-1"><label className="text-[10px] uppercase text-[#e5d5a3]/40 tracking-widest font-bold">Full Name</label><input required className="w-full bg-[#2a0808] border border-[#e5d5a3]/20 p-3 rounded text-[#e5d5a3] outline-none focus:border-[#c5a059]" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} /></div>
                  <div className="flex flex-col gap-1"><label className="text-[10px] uppercase text-[#e5d5a3]/40 tracking-widest font-bold">Street Address</label><input required className="w-full bg-[#2a0808] border border-[#e5d5a3]/20 p-3 rounded text-[#e5d5a3] outline-none focus:border-[#c5a059]" value={formData.street} onChange={e => setFormData({...formData, street: e.target.value})} /></div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1"><label className="text-[10px] uppercase text-[#e5d5a3]/40 tracking-widest font-bold">Country</label><input required className="w-full bg-[#2a0808] border border-[#e5d5a3]/20 p-3 rounded text-[#e5d5a3] outline-none focus:border-[#c5a059]" value={formData.country} onChange={e => setFormData({...formData, country: e.target.value})} /></div>
                    <div className="flex flex-col gap-1 relative" ref={stateDropdownRef}><label className="text-[10px] uppercase text-[#e5d5a3]/40 tracking-widest font-bold">State</label><input required className="w-full bg-[#2a0808] border border-[#e5d5a3]/20 p-3 rounded text-[#e5d5a3] outline-none focus:border-[#c5a059]" value={formData.state} onChange={e => {setFormData({...formData, state: e.target.value}); if(isIndia) setShowStateDropdown(true);}} onFocus={() => isIndia && setShowStateDropdown(true)} />{isIndia && showStateDropdown && filteredStates.length > 0 && (<div className="absolute top-[105%] left-0 w-full max-h-48 overflow-y-auto bg-[#1a0505] border border-[#c5a059] rounded z-50 shadow-2xl custom-scrollbar">{filteredStates.map(state => (<div key={state} onClick={() => {setFormData({...formData, state: state}); setShowStateDropdown(false)}} className="p-3 text-sm text-[#e5d5a3] hover:bg-[#c5a059] hover:text-[#1a0505] cursor-pointer transition-colors border-b border-[#e5d5a3]/10 last:border-0">{state}</div>))}</div>)}</div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1 relative" ref={cityDropdownRef}><label className="text-[10px] uppercase text-[#e5d5a3]/40 tracking-widest font-bold">City</label><input required className="w-full bg-[#2a0808] border border-[#e5d5a3]/20 p-3 rounded text-[#e5d5a3] outline-none focus:border-[#c5a059]" value={formData.city} onChange={e => {setFormData({...formData, city: e.target.value}); if(isTamilNadu) setShowCityDropdown(true);}} onFocus={() => isTamilNadu && setShowCityDropdown(true)} />{isTamilNadu && showCityDropdown && filteredCities.length > 0 && (<div className="absolute top-[105%] left-0 w-full max-h-48 overflow-y-auto bg-[#1a0505] border border-[#c5a059] rounded z-50 shadow-2xl custom-scrollbar">{filteredCities.map(city => (<div key={city} onClick={() => {setFormData({...formData, city: city}); setShowCityDropdown(false)}} className="p-3 text-sm text-[#e5d5a3] hover:bg-[#c5a059] hover:text-[#1a0505] cursor-pointer transition-colors border-b border-[#e5d5a3]/10 last:border-0">{city}</div>))}</div>)}</div>
                    <div className="flex flex-col gap-1"><label className="text-[10px] uppercase text-[#e5d5a3]/40 tracking-widest font-bold">Zip Code</label><input required className="w-full bg-[#2a0808] border border-[#e5d5a3]/20 p-3 rounded text-[#e5d5a3] outline-none focus:border-[#c5a059]" value={formData.zip} onChange={e => setFormData({...formData, zip: e.target.value})} /></div>
                  </div>
                  <div className="flex flex-col gap-1"><label className="text-[10px] uppercase text-[#e5d5a3]/40 tracking-widest font-bold">Phone Number</label><input required className="w-full bg-[#2a0808] border border-[#e5d5a3]/20 p-3 rounded text-[#e5d5a3] outline-none focus:border-[#c5a059]" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} /></div>
                  <div className="flex gap-4 pt-4"><button type="submit" className="bg-[#c5a059] text-[#1a0505] px-8 py-3 rounded font-bold uppercase text-xs hover:bg-white transition-colors shadow-lg">{editingId ? 'Update Address' : 'Save Address'}</button><button type="button" onClick={() => setShowAddressForm(false)} className="text-[#e5d5a3]/50 hover:text-white text-xs uppercase tracking-widest font-bold">Cancel</button></div>
                </form>
              </div>
            )}
          </div>
        )}

        {/* SECURITY TAB */}
        {activeTab === 'security' && (
          <div>
            <button onClick={goBackToDashboard} className="mb-6 text-xs text-[#c5a059] hover:underline uppercase tracking-widest font-bold">← Back to Account</button>
            <h2 className="font-serif text-2xl text-[#f4e4bc] mb-6">Login & Security</h2>
            <div className="bg-[#2a0808] border border-[#e5d5a3]/20 p-8 rounded max-w-2xl">
                <div className="flex justify-between items-center mb-8 pb-8 border-b border-[#e5d5a3]/10"><div><h4 className="text-[#f4e4bc] font-bold">Email Address</h4><p className="text-xs text-[#e5d5a3]/50 mt-1">Your current primary email address.</p></div><span className="text-[#e5d5a3]">{user?.email}</span></div>
                <div className="flex justify-between items-center"><div><h4 className="text-red-400 font-bold">Delete Account</h4><p className="text-xs text-[#e5d5a3]/50 mt-1">Permanently remove your data and access.</p></div><button onClick={handleDeleteAccount} className="border border-red-900 text-red-400 px-6 py-2 rounded text-xs font-bold uppercase tracking-widest hover:bg-red-900/20 transition-colors">Delete Account</button></div>
            </div>
          </div>
        )}

        {/* RECENTLY VIEWED */}
        <div className="mt-20 border-t border-[#e5d5a3]/10 pt-12">
          <div className="flex items-center gap-2 mb-8 text-[#c5a059]"><ClockIcon /><h2 className="font-serif text-2xl text-[#f4e4bc]">Recently Viewed</h2></div>
          {recentlyViewed.length === 0 ? (<p className="text-[#e5d5a3]/30 text-sm italic py-4 border border-dashed border-[#e5d5a3]/10 rounded text-center">Your browsing history will appear here.</p>) : (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
              {recentlyViewed.slice(0, 5).map((item: any) => (
                <Link href={`/product/${item.id}`} key={item.id} className="block bg-[#2a0808] border border-[#e5d5a3]/10 p-3 rounded hover:border-[#c5a059] transition-all group">
                  <div className="aspect-[3/4] bg-[#1a0505] mb-3 rounded overflow-hidden relative"><img src={item.image_url} className="h-full w-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all" /></div>
                  <p className="text-sm text-[#e5d5a3] truncate font-serif">{item.name}</p><p className="text-[#c5a059] font-bold text-xs mt-1">₹{item.price.toLocaleString("en-IN")}</p>
                </Link>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  )
}