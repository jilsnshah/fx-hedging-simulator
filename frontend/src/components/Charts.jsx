import React from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Cell,
  PieChart, Pie
} from 'recharts';

const COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#ef4444'];

export default function Charts({ data }) {
  if (!data) return null;

  const chartData = Object.entries(data.countries).map(([ccy, stats]) => ({
    name: ccy,
    pnl: stats.pnl
  }));

  // Filter positive PnL for Pie Chart to show contribution of gains
  const pieData = chartData.filter(d => d.pnl > 0);
  
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-800 border border-slate-700 p-3 rounded shadow-lg">
          <p className="font-medium text-slate-200 mb-1">{label || payload[0].name}</p>
          <p className="text-primary font-bold">
            PnL: ${payload[0].value.toLocaleString(undefined, { maximumFractionDigits: 0 })}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
      {/* Bar Chart */}
      <div className="glass-card p-5">
        <h3 className="text-lg font-bold mb-4 text-slate-200">PnL by Country</h3>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
              <XAxis dataKey="name" stroke="#94a3b8" />
              <YAxis 
                stroke="#94a3b8"
                tickFormatter={(val) => `$${(val / 1000000).toFixed(1)}M`}
              />
              <RechartsTooltip content={<CustomTooltip />} cursor={{fill: 'rgba(255, 255, 255, 0.05)'}} />
              <Bar dataKey="pnl" radius={[4, 4, 0, 0]}>
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.pnl >= 0 ? '#10b981' : '#ef4444'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Pie Chart */}
      <div className="glass-card p-5">
        <h3 className="text-lg font-bold mb-4 text-slate-200">Gains Contribution</h3>
        {pieData.length > 0 ? (
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={5}
                  dataKey="pnl"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <RechartsTooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-64 w-full flex items-center justify-center text-slate-500">
            No positive gains to display
          </div>
        )}
      </div>
    </div>
  );
}
