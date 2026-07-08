import React, { useState, useEffect } from 'react';
import { Info, TrendingUp, TrendingDown, Activity } from 'lucide-react';
import BinomialTree from './BinomialTree';

/* ─── small helpers ─────────────────────────────────────────────────────── */
const fmt  = (n, d = 2) => (typeof n === 'number' ? n.toFixed(d) : '—');
const fmtM = (n)        => `$${(n / 1_000_000).toFixed(2)}M`;
const diff = (a, b)     => a - b;

function ComparisonCard({ details }) {
  if (!details) return null;

  const crr = details.premium_crr_usd ?? details.premium_usd;
  const bs  = details.premium_bs_usd  ?? null;
  const gap = details.convergence_gap ?? (bs !== null ? Math.abs(crr - bs) : null);

  return (
    <div className="glass-card p-5 space-y-4">
      <div className="flex items-center space-x-2">
        <Activity className="w-5 h-5 text-purple-400" />
        <h3 className="text-lg font-bold text-slate-200">CRR Binomial Tree vs Black-Scholes</h3>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* CRR */}
        <div className="bg-blue-900/30 border border-blue-700/40 rounded-xl p-4">
          <p className="text-xs text-blue-400 font-semibold uppercase tracking-wider mb-1">CRR Binomial Tree</p>
          <p className="text-2xl font-bold text-blue-300">{fmtM(crr)}</p>
          <p className="text-xs text-slate-400 mt-1">Discrete-time lattice pricing</p>
          <p className="text-xs text-slate-400 font-mono mt-2">
            Local: {fmt(details.premium_crr_local ?? crr, 4)}
          </p>
        </div>

        {/* BS */}
        <div className="bg-purple-900/30 border border-purple-700/40 rounded-xl p-4">
          <p className="text-xs text-purple-400 font-semibold uppercase tracking-wider mb-1">Black-Scholes</p>
          {bs !== null ? (
            <>
              <p className="text-2xl font-bold text-purple-300">{fmtM(bs)}</p>
              <p className="text-xs text-slate-400 mt-1">Closed-form analytical price</p>
              <p className="text-xs text-slate-400 font-mono mt-2">
                Local: {fmt(details.premium_bs_local ?? bs, 4)}
              </p>
            </>
          ) : (
            <p className="text-slate-500 text-sm mt-2">N/A</p>
          )}
        </div>
      </div>

      {/* Convergence gap */}
      {gap !== null && (
        <div className="flex items-center space-x-3 bg-slate-800/50 rounded-lg p-3">
          <div className={`w-2 h-2 rounded-full ${gap < 100_000 ? 'bg-emerald-400' : 'bg-amber-400'}`} />
          <div>
            <p className="text-xs text-slate-400">
              Convergence gap: <span className="text-slate-200 font-mono">{fmtM(gap)}</span>
            </p>
            <p className="text-xs text-slate-500 mt-0.5">
              {gap < 100_000
                ? '✓ CRR has converged to the Black-Scholes price — pricing is accurate.'
                : 'Increase tree steps to improve CRR convergence toward Black-Scholes.'}
            </p>
          </div>
        </div>
      )}

      {/* Black-Scholes formula */}
      <div className="bg-slate-900/60 rounded-lg p-4 font-mono text-xs space-y-1 text-slate-300">
        <p className="text-slate-400 font-bold mb-2 text-[11px] uppercase tracking-widest">Black-Scholes Formula</p>
        <p>d₁ = [ln(S/K) + (r + σ²/2)·T] / (σ√T)</p>
        <p>d₂ = d₁ − σ√T</p>
        <p className="text-purple-400 font-bold mt-2">C = S·N(d₁) − K·e<sup>−rT</sup>·N(d₂)</p>
      </div>

      {/* Greeks */}
      {details.greeks && Object.keys(details.greeks).length > 0 && (
        <div>
          <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider mb-2">Option Greeks (Black-Scholes)</p>
          <div className="grid grid-cols-5 gap-2">
            {[
              { label: 'Δ Delta', key: 'delta', color: 'text-blue-400' },
              { label: 'Γ Gamma', key: 'gamma', color: 'text-green-400' },
              { label: 'V Vega',  key: 'vega',  color: 'text-purple-400' },
              { label: 'Θ Theta', key: 'theta', color: 'text-amber-400' },
              { label: 'ρ Rho',   key: 'rho',   color: 'text-red-400' },
            ].map(({ label, key, color }) => (
              <div key={key} className="bg-slate-800/50 rounded-lg p-2 text-center">
                <p className={`text-xs font-bold ${color}`}>{label}</p>
                <p className="text-slate-200 font-mono text-sm mt-1">{fmt(details.greeks[key], 4)}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}


/* ─── main component ────────────────────────────────────────────────────── */
export default function StrategyDetails({ data }) {
  const [activeCcy, setActiveCcy] = useState(null);

  useEffect(() => {
    if (data && data.countries) {
      const keys = Object.keys(data.countries);
      if (!activeCcy || !keys.includes(activeCcy)) setActiveCcy(keys[0]);
    }
  }, [data, activeCcy]);

  if (!data || data.strategy !== 'C') return null;

  const activeDetails = activeCcy && data.countries[activeCcy]
    ? data.countries[activeCcy].details
    : null;

  const bsPremium = activeDetails?.premium_bs_local ?? null;

  return (
    <div className="space-y-6">
      {/* Currency Tabs */}
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold text-slate-400">Option Hedge Details by Currency</h3>
        <div className="flex space-x-2">
          {Object.keys(data.countries).map(ccy => (
            <button
              key={ccy}
              onClick={() => setActiveCcy(ccy)}
              className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                activeCcy === ccy
                  ? 'bg-primary text-white'
                  : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-slate-200'
              }`}
            >
              {ccy}
            </button>
          ))}
        </div>
      </div>

      {/* CRR vs BS comparison */}
      {activeDetails && <ComparisonCard details={activeDetails} />}

      {/* Binomial Tree */}
      <div className="glass-card p-5">
        <div className="flex items-center space-x-2 mb-4">
          <Info className="w-5 h-5 text-accent" />
          <h3 className="text-lg font-bold text-slate-200">Binomial Tree Explorer</h3>
          {bsPremium !== null && (
            <span className="ml-auto text-xs text-purple-400 font-mono bg-purple-900/30 border border-purple-700/30 px-2 py-1 rounded">
              BS Ref: {fmt(bsPremium, 4)}
            </span>
          )}
        </div>
        {activeDetails && (
          <BinomialTree treeData={activeDetails.nodes} bsPremium={bsPremium} />
        )}
      </div>

      {/* Summary Table */}
      <div className="glass-card p-5">
        <h3 className="text-lg font-bold text-slate-200 mb-4">Option Pricing Summary — All Currencies</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="text-xs uppercase bg-slate-800/50 text-slate-400">
              <tr>
                <th className="px-4 py-3 rounded-tl-lg">Currency</th>
                <th className="px-4 py-3">U Factor</th>
                <th className="px-4 py-3">D Factor</th>
                <th className="px-4 py-3">Risk-Neutral p</th>
                <th className="px-4 py-3">CRR Premium</th>
                <th className="px-4 py-3">BS Premium</th>
                <th className="px-4 py-3">Payoff</th>
                <th className="px-4 py-3 rounded-tr-lg">Net Effect</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(data.countries).map(([ccy, stats]) => {
                const d = stats.details;
                if (!d) return null;
                const crr = d.premium_crr_usd ?? d.premium_usd;
                const bs  = d.premium_bs_usd  ?? null;
                const net = (d.payoff_usd ?? 0) - (d.premium_usd ?? 0);
                return (
                  <tr
                    key={ccy}
                    className={`border-b border-slate-700/50 hover:bg-slate-800/30 ${activeCcy === ccy ? 'bg-primary/10' : ''}`}
                  >
                    <td className="px-4 py-3 font-medium text-slate-200">{ccy}</td>
                    <td className="px-4 py-3 font-mono">{fmt(d.U, 4)}</td>
                    <td className="px-4 py-3 font-mono">{fmt(d.D, 4)}</td>
                    <td className="px-4 py-3 font-mono">{fmt(d.p, 4)}</td>
                    <td className="px-4 py-3 font-mono text-blue-400">
                      -{fmtM(crr)}
                    </td>
                    <td className="px-4 py-3 font-mono text-purple-400">
                      {bs !== null ? `-${fmtM(bs)}` : '—'}
                    </td>
                    <td className="px-4 py-3 font-mono text-emerald-400">
                      +{fmtM(d.payoff_usd ?? 0)}
                    </td>
                    <td className={`px-4 py-3 font-mono font-bold ${net >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                      {net >= 0 ? '+' : ''}{fmtM(net)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
