import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, ZoomIn, ZoomOut, Settings2, Info } from 'lucide-react';

const H_SPACING = 200;
const V_SPACING = 100;
const NODE_W = 140;
const NODE_H = 100;

export default function BinomialTree({ treeData, bsPremium }) {
  const canvasRef = useRef(null);
  const viewportRef = useRef(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 60, y: 400 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [hoveredNode, setHoveredNode] = useState(null);
  
  // Controls
  const [showFX, setShowFX] = useState(true);
  const [showValue, setShowValue] = useState(true);
  const [showPayoff, setShowPayoff] = useState(true);
  const [showEdges, setShowEdges] = useState(false);
  
  // Play mode
  const [isPlaying, setIsPlaying] = useState(false);
  const [playStep, setPlayStep] = useState(null);

  if (!treeData || treeData.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 bg-slate-800/50 rounded-xl border border-slate-700">
        <Info className="w-10 h-10 text-amber-500 mb-4" />
        <h4 className="text-lg font-bold text-slate-200">Tree Visualization Disabled</h4>
        <p className="text-slate-400 text-center max-w-md mt-2">
          Tree visualization is disabled for steps &gt; 12 to maintain performance. Please refer to the summary metrics.
        </p>
      </div>
    );
  }

  const N = treeData.length - 1;

  useEffect(() => {
    let timer;
    if (isPlaying) {
      if (playStep === null) {
        setPlayStep(N);
      } else if (playStep > 0) {
        timer = setTimeout(() => setPlayStep(playStep - 1), 1500);
      } else {
        setIsPlaying(false);
      }
    }
    return () => clearTimeout(timer);
  }, [isPlaying, playStep, N]);

  // ── Auto-fit whenever tree data changes ───────────────────────────────────
  const fitTree = () => {
    const CANVAS_H = viewportRef.current?.clientHeight || 630;
    const CANVAS_W = viewportRef.current?.clientWidth || 900;
    // Tree vertical span: root=0, top terminal=-N*V_SPACING, bottom=+N*V_SPACING
    const treeH = (2 * N + 1) * V_SPACING + NODE_H;
    const treeW = N * H_SPACING + NODE_W;
    const fitZoom = Math.min(1, Math.min(CANVAS_H / (treeH + 40), CANVAS_W / (treeW + 60)));
    // Center vertically: root at y=0, canvas center at CANVAS_H/2
    const initPanY = CANVAS_H / 2;
    setPan({ x: 60, y: initPanY });
    setZoom(fitZoom);
    setPlayStep(null);
    setIsPlaying(false);
  };

  useEffect(() => { fitTree(); }, [treeData]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleMouseDown = (e) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e) => {
    if (isDragging) {
      setPan({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
    }
  };

  const handleMouseUp = () => setIsDragging(false);
  const handleWheel = (e) => {
    e.preventDefault();
    const zoomDelta = e.deltaY > 0 ? -0.1 : 0.1;
    setZoom(z => Math.min(Math.max(0.3, z + zoomDelta), 3));
  };

  const isNodeVisible = (step) => {
    if (playStep === null) return true;
    return step >= playStep;
  };

  return (
    <div ref={canvasRef} className="flex flex-col h-[700px] glass-card overflow-hidden">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between p-4 border-b border-slate-700/50 bg-slate-900/50">
        <div className="flex items-center space-x-4">
          <button 
            onClick={() => {
              if (isPlaying) {
                setIsPlaying(false);
              } else {
                if (playStep === 0) setPlayStep(N);
                setIsPlaying(true);
              }
            }}
            className="flex items-center space-x-2 bg-primary/20 text-primary px-4 py-2 rounded-lg hover:bg-primary/30 transition-colors"
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            <span className="font-medium text-sm">{isPlaying ? 'Pause' : 'Play Induction'}</span>
          </button>
          
          {playStep !== null && (
            <button 
              onClick={() => { setIsPlaying(false); setPlayStep(null); }}
              className="text-xs text-slate-400 hover:text-slate-200"
            >
              Reset
            </button>
          )}
          
          <div className="h-6 w-px bg-slate-700" />
          
          <div className="h-6 w-px bg-slate-700" />

          <div className="flex items-center space-x-2">
            <button onClick={() => setZoom(z => Math.max(0.3, z - 0.1))} className="p-1.5 hover:bg-slate-800 rounded text-slate-400">
              <ZoomOut className="w-4 h-4" />
            </button>
            <span className="text-xs font-mono text-slate-400 w-12 text-center">{Math.round(zoom * 100)}%</span>
            <button onClick={() => setZoom(z => Math.min(3, z + 0.1))} className="p-1.5 hover:bg-slate-800 rounded text-slate-400">
              <ZoomIn className="w-4 h-4" />
            </button>
            <button
              onClick={fitTree}
              className="ml-1 text-xs px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 rounded transition-colors"
              title="Fit tree to view"
            >
              Fit
            </button>
          </div>
        </div>

        <div className="flex items-center space-x-4 text-sm text-slate-400">
          <label className="flex items-center space-x-2 cursor-pointer hover:text-slate-200">
            <input type="checkbox" checked={showFX} onChange={e => setShowFX(e.target.checked)} className="accent-primary" />
            <span>FX Rate</span>
          </label>
          <label className="flex items-center space-x-2 cursor-pointer hover:text-slate-200">
            <input type="checkbox" checked={showValue} onChange={e => setShowValue(e.target.checked)} className="accent-primary" />
            <span>Option Value</span>
          </label>
          <label className="flex items-center space-x-2 cursor-pointer hover:text-slate-200">
            <input type="checkbox" checked={showPayoff} onChange={e => setShowPayoff(e.target.checked)} className="accent-primary" />
            <span>Payoff</span>
          </label>
        </div>
      </div>

      {/* Canvas */}
      <div
        ref={viewportRef}
        className="flex-1 relative overflow-hidden cursor-grab active:cursor-grabbing bg-[#0a0f1c]"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
      >
        <svg width="100%" height="100%">
          <defs>
            <linearGradient id="rootGrad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#1e3a8a" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.4" />
            </linearGradient>
            <linearGradient id="termGrad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#4c1d95" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.4" />
            </linearGradient>
            <linearGradient id="intGrad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#1e293b" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#334155" stopOpacity="0.6" />
            </linearGradient>
            <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="8" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>
          {/* Edges */}
          {treeData.map((stepNodes, step) => 
            step < N && isNodeVisible(step) ? stepNodes.map(node => {
              const x1 = node.step * H_SPACING + NODE_W;
              const y1 = (node.step - 2 * node.up_moves) * V_SPACING + NODE_H / 2;

              const upChild = treeData[node.step + 1][node.up_moves + 1];
              const dnChild = treeData[node.step + 1][node.up_moves];
              
              if (!isNodeVisible(step + 1)) return null;

              const x2 = upChild.step * H_SPACING;
              const y2_up = (upChild.step - 2 * upChild.up_moves) * V_SPACING + NODE_H / 2;
              const y2_dn = (dnChild.step - 2 * dnChild.up_moves) * V_SPACING + NODE_H / 2;

              return (
                <g key={`edges-${step}-${node.up_moves}`}>
                  <path d={`M ${x1} ${y1} C ${x1 + 40} ${y1}, ${x2 - 40} ${y2_up}, ${x2} ${y2_up}`} fill="none" stroke="#10b981" strokeWidth="2" strokeOpacity="0.4" />
                  <path d={`M ${x1} ${y1} C ${x1 + 40} ${y1}, ${x2 - 40} ${y2_dn}, ${x2} ${y2_dn}`} fill="none" stroke="#ef4444" strokeWidth="2" strokeOpacity="0.4" />
                </g>
              );
            }) : null
          )}

          {/* Nodes */}
          {treeData.map(stepNodes => 
            stepNodes.map(node => {
              if (!isNodeVisible(node.step)) return null;
              
              const x = node.step * H_SPACING;
              const y = (node.step - 2 * node.up_moves) * V_SPACING;
              const isRoot = node.step === 0;
              const isTerminal = node.step === N;
              const isHovered = hoveredNode?.step === node.step && hoveredNode?.up_moves === node.up_moves;

              let fillUrl = "url(#intGrad)";
              if (isRoot) fillUrl = "url(#rootGrad)";
              if (isTerminal) fillUrl = "url(#termGrad)";

              return (
                <g 
                  key={`node-${node.step}-${node.up_moves}`} 
                  transform={`translate(${x}, ${y})`}
                  onMouseEnter={() => setHoveredNode(node)}
                  onMouseLeave={() => setHoveredNode(null)}
                  style={{ cursor: 'pointer' }}
                >
                  <rect 
                    width={NODE_W} 
                    height={NODE_H} 
                    rx="12" 
                    fill={fillUrl}
                    stroke={isHovered ? "#10b981" : "#475569"}
                    strokeWidth={isHovered ? "2" : "1"}
                    filter={isRoot && playStep === 0 ? "url(#glow)" : ""}
                  />
                  
                  <text x="10" y="22" fill="#94a3b8" fontSize="12" fontWeight="bold">
                    Step {node.step} ({node.up_moves} U)
                  </text>
                  
                  {showFX && (
                    <text x="10" y="44" fill="#e2e8f0" fontSize="13">
                      FX: {node.fx_rate.toFixed(4)}
                    </text>
                  )}
                  
                  {showValue && (
                    <text x="10" y="64" fill="#3b82f6" fontSize="14" fontWeight="bold">
                      Val: {node.option_value.toFixed(4)}
                    </text>
                  )}
                  
                  {isTerminal && showPayoff && (
                    <text x="10" y="84" fill="#10b981" fontSize="13">
                      Pay: {node.payoff.toFixed(4)}
                    </text>
                  )}
                </g>
              );
            })
          )}
          </g>
        </svg>

        {/* BS Reference annotation (absolute-positioned over the SVG) */}
        {bsPremium !== null && bsPremium !== undefined && (
          <div
            className="absolute top-4 right-4 bg-purple-900/70 backdrop-blur border border-purple-600/50 rounded-lg px-3 py-2 pointer-events-none"
          >
            <p className="text-[10px] text-purple-400 font-semibold uppercase tracking-wider">Black-Scholes Ref</p>
            <p className="text-purple-200 font-mono text-sm font-bold">{bsPremium.toFixed(4)}</p>
          </div>
        )}

        {/* Floating Tooltip */}
        <AnimatePresence>
          {hoveredNode && hoveredNode.calculation && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="absolute bottom-6 left-1/2 transform -translate-x-1/2 bg-slate-800/95 backdrop-blur border border-slate-600 rounded-xl p-4 shadow-2xl pointer-events-none z-50 text-sm min-w-[320px]"
            >
              <h5 className="font-bold text-slate-200 mb-2 border-b border-slate-700 pb-2">
                Node ({hoveredNode.step}, {hoveredNode.up_moves}) Backpropagation
              </h5>
              <div className="space-y-1.5 font-mono text-xs text-slate-300">
                <p>Formula: <span className="text-slate-400">exp(-r*dt) × [p×Vu + (1-p)×Vd]</span></p>
                <div className="bg-slate-900/50 p-2 rounded mt-2">
                  <p className="text-emerald-400">discount = {hoveredNode.calculation.discount_factor.toFixed(5)}</p>
                  <p className="text-blue-400">p = {hoveredNode.calculation.probability.toFixed(5)}</p>
                  <p className="text-purple-400">Vu = {hoveredNode.calculation.up_value.toFixed(5)}</p>
                  <p className="text-red-400">Vd = {hoveredNode.calculation.down_value.toFixed(5)}</p>
                  <div className="h-px bg-slate-700 my-2" />
                  <p className="text-white font-bold text-sm">
                    Result = {hoveredNode.calculation.formula_result.toFixed(5)}
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
