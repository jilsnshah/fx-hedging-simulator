import React from 'react';
import { DollarSign, Percent, TrendingUp, TrendingDown } from 'lucide-react';

const formatCurrency = (val) => {
  if (val === undefined || val === null) return '$0';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    notation: 'compact',
    maximumFractionDigits: 2
  }).format(val);
};

const formatPercent = (val) => {
  if (val === undefined || val === null) return '0%';
  return `${val > 0 ? '+' : ''}${val.toFixed(2)}%`;
};

export default function KPISection({ data }) {
  if (!data) return null;

  const { total_pnl, portfolio_return_pct, countries } = data;
  
  let bestCountry = { name: '-', pnl: -Infinity };
  let worstCountry = { name: '-', pnl: Infinity };
  
  Object.entries(countries).forEach(([ccy, stats]) => {
    if (stats.pnl > bestCountry.pnl) bestCountry = { name: ccy, pnl: stats.pnl };
    if (stats.pnl < worstCountry.pnl) worstCountry = { name: ccy, pnl: stats.pnl };
  });

  const kpis = [
    {
      title: "Total PnL",
      value: formatCurrency(total_pnl),
      icon: DollarSign,
      color: total_pnl >= 0 ? "text-success" : "text-danger",
      bg: total_pnl >= 0 ? "bg-success/20" : "bg-danger/20",
    },
    {
      title: "Portfolio Return",
      value: formatPercent(portfolio_return_pct),
      icon: Percent,
      color: portfolio_return_pct >= 0 ? "text-success" : "text-danger",
      bg: portfolio_return_pct >= 0 ? "bg-success/20" : "bg-danger/20",
    },
    {
      title: "Best Country",
      value: bestCountry.name,
      subtitle: formatCurrency(bestCountry.pnl),
      icon: TrendingUp,
      color: "text-primary",
      bg: "bg-primary/20",
    },
    {
      title: "Worst Country",
      value: worstCountry.name,
      subtitle: formatCurrency(worstCountry.pnl),
      icon: TrendingDown,
      color: "text-accent",
      bg: "bg-accent/20",
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {kpis.map((kpi, i) => {
        const Icon = kpi.icon;
        return (
          <div key={i} className="glass-card p-5 flex items-center group hover:scale-[1.02] transition-transform">
            <div className={`p-3 rounded-xl ${kpi.bg} mr-4`}>
              <Icon className={`w-6 h-6 ${kpi.color}`} />
            </div>
            <div>
              <p className="text-sm text-slate-400 font-medium">{kpi.title}</p>
              <h3 className={`text-2xl font-bold ${kpi.color}`}>{kpi.value}</h3>
              {kpi.subtitle && (
                <p className="text-xs text-slate-500 mt-1">{kpi.subtitle}</p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
