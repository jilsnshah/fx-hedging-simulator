import React, { useState, useEffect } from 'react';
import axios from 'axios';
import ControlPanel from './components/ControlPanel';
import KPISection from './components/KPISection';
import Charts from './components/Charts';
import StrategyDetails from './components/StrategyDetails';

const API_URL = '/api';

function App() {
  const [dates, setDates] = useState([]);
  const [params, setParams] = useState({
    strategy: 'A',
    start_date: '',
    investment_return: 0.10,
    risk_free_rate: 0.05,
    tree_steps: 100
  });
  const [loading, setLoading] = useState(false);
  const [simData, setSimData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    // Fetch available dates
    axios.get(`${API_URL}/dates`)
      .then(res => {
        setDates(res.data);
        if (res.data.length > 0) {
          setParams(p => ({ ...p, start_date: res.data[0] }));
        }
      })
      .catch(err => {
        setError('Failed to connect to backend API.');
        console.error(err);
      });
  }, []);

  const handleSimulate = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await axios.post(`${API_URL}/simulate`, params);
      setSimData(res.data);
    } catch (err) {
      setError(err.response?.data?.detail || err.message);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-200 p-4 md:p-8 font-sans">
      <div className="max-w-7xl mx-auto">
        <header className="mb-8">
          <h1 className="text-3xl md:text-4xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-purple-400 to-emerald-400 tracking-tight">
            FX Hedging Case Study Simulator
          </h1>
          <p className="text-slate-400 mt-2 text-sm md:text-base max-w-2xl">
            Model a US company investing $1B across 4 Asian markets. 
            Evaluate No Hedge, Forward Hedge, and Option Hedge strategies.
          </p>
        </header>

        {error && (
          <div className="mb-6 p-4 bg-red-500/20 border border-red-500/50 rounded-lg text-red-200 flex items-center">
            <span className="font-bold mr-2">Error:</span> {error}
          </div>
        )}

        <div className="flex flex-col lg:flex-row gap-8">
          <div className="w-full lg:w-1/3 xl:w-1/4 shrink-0">
            <ControlPanel 
              dates={dates}
              params={params}
              setParams={setParams}
              onSimulate={handleSimulate}
              loading={loading}
            />
          </div>
          
          <div className="w-full lg:w-2/3 xl:w-3/4 flex flex-col min-w-0">
            {simData ? (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <KPISection data={simData} />
                <Charts data={simData} />
                <StrategyDetails data={simData} />
              </div>
            ) : (
              <div className="flex-1 glass-card flex flex-col items-center justify-center p-12 text-center text-slate-500 min-h-[500px]">
                <div className="w-16 h-16 mb-4 rounded-full bg-slate-800 flex items-center justify-center">
                  <svg className="w-8 h-8 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h3 className="text-xl font-medium text-slate-300 mb-2">Ready to Simulate</h3>
                <p>Adjust parameters in the control panel and click run to see results.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
