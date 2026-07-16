import React from 'react';
import { Settings, Calendar, TrendingUp, Shield, Layers } from 'lucide-react';

export default function ControlPanel({
  dates,
  params,
  setParams,
  onSimulate,
  loading
}) {
  const handleChange = (e) => {
    const { name, value } = e.target;
    setParams(prev => ({
      ...prev,
      [name]: name === 'strategy' || name === 'start_date' ? value : Number(value)
    }));
  };

  return (
    <div className="glass-card p-6 h-full flex flex-col space-y-6">
      <div className="flex items-center space-x-3 mb-4">
        <div className="p-2 bg-primary/20 rounded-lg">
          <Settings className="w-6 h-6 text-primary" />
        </div>
        <h2 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
          Simulation Controls
        </h2>
      </div>

      <div className="space-y-4 flex-1">
        <div className="space-y-2">
          <label className="flex items-center text-sm font-medium text-slate-300">
            <Shield className="w-4 h-4 mr-2 text-accent" /> Strategy
          </label>
          <select 
            name="strategy" 
            value={params.strategy}
            onChange={handleChange}
            className="input-field"
          >
            <option value="A">Strategy A — No Hedge</option>
            <option value="B">Strategy B — Forward Hedge</option>
            <option value="C">Strategy C — Option Hedge</option>
          </select>
        </div>

        <div className="space-y-2">
          <label className="flex items-center text-sm font-medium text-slate-300">
            <Calendar className="w-4 h-4 mr-2 text-accent" /> Start Date
          </label>
          <select 
            name="start_date" 
            value={params.start_date}
            onChange={handleChange}
            className="input-field"
          >
            {dates.map(d => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <label className="flex items-center text-sm font-medium text-slate-300">
            <TrendingUp className="w-4 h-4 mr-2 text-accent" /> Investment Return
          </label>
          <div className="flex items-center space-x-3">
            <input 
              type="range" 
              name="investment_return"
              min="0" max="0.2" step="0.01"
              value={params.investment_return}
              onChange={handleChange}
              className="flex-1 accent-primary"
            />
            <span className="text-sm font-mono bg-slate-800 px-2 py-1 rounded">
              {(params.investment_return * 100).toFixed(0)}%
            </span>
          </div>
        </div>

        {params.strategy === 'C' && (
          <>
            <div className="space-y-2">
              <label className="flex items-center text-sm font-medium text-slate-300">
                <TrendingUp className="w-4 h-4 mr-2 text-accent" /> Risk-Free Rate
              </label>
              <div className="flex items-center space-x-3">
                <input 
                  type="range" 
                  name="risk_free_rate"
                  min="0" max="0.1" step="0.005"
                  value={params.risk_free_rate}
                  onChange={handleChange}
                  className="flex-1 accent-primary"
                />
                <span className="text-sm font-mono bg-slate-800 px-2 py-1 rounded">
                  {(params.risk_free_rate * 100).toFixed(1)}%
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <label className="flex items-center text-sm font-medium text-slate-300">
                <Layers className="w-4 h-4 mr-2 text-accent" /> Tree Steps
              </label>
              <div className="flex items-center space-x-3">
                <input 
                  type="range" 
                  name="tree_steps"
                  min="2" max="500" step="1"
                  value={params.tree_steps}
                  onChange={handleChange}
                  className="flex-1 accent-primary"
                />
                <span className="text-sm font-mono bg-slate-800 px-2 py-1 rounded">
                  {params.tree_steps}
                </span>
              </div>
            </div>
          </>
        )}
      </div>

      <button 
        onClick={onSimulate}
        disabled={loading || dates.length === 0}
        className={`btn-primary w-full py-3 flex items-center justify-center space-x-2 ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
      >
        {loading ? (
          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        ) : (
          <span>Run Simulation</span>
        )}
      </button>
    </div>
  );
}
