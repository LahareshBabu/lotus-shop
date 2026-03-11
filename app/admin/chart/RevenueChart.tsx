'use client'
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart, Line } from 'recharts'

export default function RevenueChart({ orders }: { orders: any[] }) {
  
  // 1. PROCESS DATA: Group orders by Date
  const dataMap = new Map<string, number>()

  orders.forEach(order => {
    // We use a sortable format first (YYYY-MM-DD) to ensure chronological order
    const dateObj = new Date(order.created_at);
    const sortKey = dateObj.toISOString().split('T')[0]; 
    const currentTotal = dataMap.get(sortKey) || 0
    dataMap.set(sortKey, currentTotal + (order.total || 0))
  })

  // Convert to Array, sort chronologically, and format the display date
  let data = Array.from(dataMap, ([sortKey, sales]) => {
      const dateObj = new Date(sortKey);
      const displayDate = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      return { _sortKey: sortKey, date: displayDate, sales: sales, forecast: null as number | null };
  }).sort((a, b) => a._sortKey.localeCompare(b._sortKey));

  // 🚀 DATA SCIENCE: TIME-SERIES FORECASTING (Moving Average)
  if (data.length > 1) {
      // Calculate the moving average of the last 3 data points (or fewer if we don't have 3)
      const pointsToAverage = Math.min(3, data.length);
      let sum = 0;
      for (let i = data.length - pointsToAverage; i < data.length; i++) {
          sum += data[i].sales;
      }
      const movingAverage = Math.round(sum / pointsToAverage);

      // We need to link the actual line to the forecast line so the graph doesn't break.
      // Set the "forecast" of the very last actual day to be its actual sales.
      data[data.length - 1].forecast = data[data.length - 1].sales;

      // Predict the next day
      const lastDateObj = new Date(data[data.length - 1]._sortKey);
      lastDateObj.setDate(lastDateObj.getDate() + 1); // Add 1 day
      const nextDayStr = lastDateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

      // Push the prediction into the future
      data.push({
          _sortKey: lastDateObj.toISOString().split('T')[0],
          date: `(Est) ${nextDayStr}`,
          sales: 0, // No actual sales yet
          forecast: movingAverage
      });
  }

  // Custom Tooltip to hide the weird "0 sales" on the forecasted day
  const CustomTooltip = ({ active, payload, label }: any) => {
      if (active && payload && payload.length) {
          const isPrediction = label.includes('(Est)');
          return (
              <div className="bg-[#1a0505] border border-[#c5a059] p-3 rounded shadow-xl">
                  <p className="text-[#f4e4bc] font-bold text-xs mb-2">{label}</p>
                  {payload.map((entry: any, index: number) => {
                      // If it's a prediction day, don't show the flat "Actual: ₹0" line
                      if (isPrediction && entry.dataKey === 'sales') return null;
                      // If it's a past day, don't show the invisible "Forecast" line
                      if (!isPrediction && entry.dataKey === 'forecast' && entry.value === null) return null;
                      
                      return (
                          <p key={index} className="text-xs" style={{ color: entry.color }}>
                              {entry.name === 'sales' ? 'Actual Sales: ' : 'Forecasted Sales: '} 
                              <span className="font-mono">₹{entry.value.toLocaleString("en-IN")}</span>
                          </p>
                      );
                  })}
              </div>
          );
      }
      return null;
  };

  if (data.length === 0) {
    return (
        <div className="h-[300px] w-full bg-[#2a0808]/30 border border-[#e5d5a3]/10 rounded flex items-center justify-center text-[#e5d5a3]/40 text-xs tracking-widest uppercase">
            No sales data to chart yet
        </div>
    )
  }

  return (
    <div className="w-full bg-[#2a0808]/30 border border-[#e5d5a3]/10 rounded p-6 mt-8 relative overflow-hidden group">
      
      {/* 🚀 AI BADGE */}
      <div className="absolute top-6 right-6 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
          <div className="flex items-center gap-2 bg-[#c5a059]/10 border border-[#c5a059]/30 px-3 py-1.5 rounded-full">
              <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#c5a059] opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-[#c5a059]"></span>
              </span>
              <span className="text-[9px] text-[#c5a059] uppercase tracking-widest font-bold">Predictive Model Active</span>
          </div>
      </div>

      <div className="flex justify-between items-end mb-6">
        <div>
            <h3 className="text-[#f4e4bc] font-serif text-lg tracking-wide">Revenue Trend & Forecast</h3>
            <p className="text-[#e5d5a3]/50 text-xs uppercase tracking-wider">Historical Performance vs. Projected Trajectory</p>
        </div>
        <div className="flex gap-4">
            <div className="flex items-center gap-1">
                <span className="h-2 w-4 rounded bg-[#c5a059] opacity-70"></span>
                <span className="text-[9px] text-[#e5d5a3]/70 uppercase tracking-widest">Actual</span>
            </div>
            <div className="flex items-center gap-1">
                <span className="h-0 w-4 border-t border-dashed border-[#e5d5a3]"></span>
                <span className="text-[9px] text-[#e5d5a3]/70 uppercase tracking-widest">Forecast</span>
            </div>
        </div>
      </div>

      <div className="h-[300px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 30, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#c5a059" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#c5a059" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5d5a3" strokeOpacity={0.05} vertical={false} />
            <XAxis 
                dataKey="date" 
                stroke="#e5d5a3" 
                strokeOpacity={0.3} 
                tick={{ fill: '#e5d5a3', fontSize: 10, opacity: 0.5 }} 
                tickLine={false}
                axisLine={false}
                dy={10}
            />
            <YAxis 
                stroke="#e5d5a3" 
                strokeOpacity={0.3} 
                tick={{ fill: '#e5d5a3', fontSize: 10, opacity: 0.5 }} 
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `₹${value}`}
            />
            <Tooltip content={<CustomTooltip />} />
            
            {/* ACTUAL SALES AREA */}
            <Area 
                type="monotone" 
                dataKey="sales" 
                stroke="#c5a059" 
                strokeWidth={2} 
                fillOpacity={1} 
                fill="url(#colorSales)" 
            />

            {/* 🚀 FORECAST DOTTED LINE */}
            <Line 
                type="monotone" 
                dataKey="forecast" 
                stroke="#e5d5a3" 
                strokeWidth={2} 
                strokeDasharray="5 5" 
                dot={{ r: 3, fill: '#1a0505', stroke: '#e5d5a3', strokeWidth: 2 }}
                activeDot={{ r: 5, fill: '#c5a059', stroke: '#1a0505', strokeWidth: 2 }}
                connectNulls={true}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}