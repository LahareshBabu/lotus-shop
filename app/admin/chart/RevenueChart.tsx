'use client'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts'

export default function RevenueChart({ orders }: { orders: any[] }) {
  
  // 1. PROCESS DATA: Group orders by Date
  // This turns raw orders into specific data points: { date: "Feb 15", sales: 1400 }
  const dataMap = new Map()

  orders.forEach(order => {
    // Format date as "Feb 15"
    const date = new Date(order.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    
    // Add amount to existing total for that day
    const currentTotal = dataMap.get(date) || 0
    dataMap.set(date, currentTotal + (order.total || 0))
  })

  // Convert Map to Array and Sort by Date (so the line goes forward in time)
  const data = Array.from(dataMap, ([date, sales]) => ({ date, sales })).reverse()

  if (data.length === 0) {
    return (
        <div className="h-[300px] w-full bg-[#2a0808]/30 border border-[#e5d5a3]/10 rounded flex items-center justify-center text-[#e5d5a3]/40 text-xs tracking-widest uppercase">
            No sales data to chart yet
        </div>
    )
  }

  return (
    <div className="w-full bg-[#2a0808]/30 border border-[#e5d5a3]/10 rounded p-6 mt-8">
      <div className="flex justify-between items-end mb-6">
        <div>
            <h3 className="text-[#f4e4bc] font-serif text-lg tracking-wide">Revenue Trend</h3>
            <p className="text-[#e5d5a3]/50 text-xs uppercase tracking-wider">Performance over time</p>
        </div>
        <div className="flex gap-2">
            <span className="h-2 w-2 rounded-full bg-[#c5a059] mt-1"></span>
            <span className="text-[10px] text-[#c5a059] uppercase tracking-widest">Sales (₹)</span>
        </div>
      </div>

      <div className="h-[300px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#c5a059" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#c5a059" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5d5a3" strokeOpacity={0.1} vertical={false} />
            <XAxis 
                dataKey="date" 
                stroke="#e5d5a3" 
                strokeOpacity={0.5} 
                tick={{ fill: '#e5d5a3', fontSize: 10, opacity: 0.7 }} 
                tickLine={false}
                axisLine={false}
                dy={10}
            />
            <YAxis 
                stroke="#e5d5a3" 
                strokeOpacity={0.5} 
                tick={{ fill: '#e5d5a3', fontSize: 10, opacity: 0.7 }} 
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `₹${value}`}
            />
            <Tooltip 
                contentStyle={{ backgroundColor: '#1a0505', borderColor: '#c5a059', color: '#f4e4bc' }}
                itemStyle={{ color: '#c5a059' }}
                cursor={{ stroke: '#c5a059', strokeWidth: 1, strokeDasharray: '5 5' }}
            />
            <Area 
                type="monotone" 
                dataKey="sales" 
                stroke="#c5a059" 
                strokeWidth={2} 
                fillOpacity={1} 
                fill="url(#colorSales)" 
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}