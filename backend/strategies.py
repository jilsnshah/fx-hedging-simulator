from datetime import datetime
from typing import Dict, Any
from backend.data_loader import get_current_data, get_future_data
from backend.fx_core import compute_local_currency_value
from backend.pricing import calculate_option_metrics

def run_simulation(
    strategy: str,
    start_date: datetime,
    investment_return: float,
    risk_free_rate: float,
    tree_steps: int,
    currencies: list,
    usd_per_currency: float = 250_000_000.0
) -> Dict[str, Any]:
    
    total_pnl = 0.0
    total_investment = usd_per_currency * len(currencies)
    countries_result = {}
    
    for ccy in currencies:
        current_data = get_current_data(start_date, ccy)
        future_data = get_future_data(start_date, ccy)
        
        if not current_data or not future_data:
            # Skip if missing data
            continue
            
        spot_start = current_data['Spot']
        spot_future = future_data['Spot']
        forward_start = current_data.get('Forward', spot_start) # Fallback if missing
        volatility = current_data.get('ATM Vol', 0.1) # Fallback to 10% if missing
        
        # Base FX exposure
        local_final = compute_local_currency_value(usd_per_currency, spot_start, investment_return)
        
        # Convert back depending on strategy
        pnl = 0.0
        premium_usd = 0.0
        payoff_usd = 0.0
        details = {}
        
        if strategy == 'A':
            # No Hedge: use future spot
            usd_final = local_final / spot_future
            pnl = usd_final - usd_per_currency
            
        elif strategy == 'B':
            # Forward Hedge: use start date forward rate
            usd_final = local_final / forward_start
            pnl = usd_final - usd_per_currency
            
        elif strategy == 'C':
            # Option Hedge
            # Investment PnL without hedge
            inv_pnl = (local_final / spot_future) - usd_per_currency
            
            # Strike is ATM = Spot
            K = spot_start
            T = 1.0 # 1 year
            
            # Price option
            metrics = calculate_option_metrics(S0=spot_start, K=K, T=T, r=risk_free_rate, sigma=volatility, N=tree_steps)
            
            # ── CRR premium ───────────────────────────────────────────────
            premium_crr_local = metrics['premium_crr']
            premium_crr_usd   = (premium_crr_local / spot_start) * usd_per_currency

            # ── Black-Scholes premium ─────────────────────────────────────
            premium_bs_local = metrics['premium_bs']
            premium_bs_usd   = (premium_bs_local / spot_start) * usd_per_currency

            # Use CRR premium for actual P&L calculation (consistent with tree)
            premium_usd = premium_crr_usd

            # Realized payoff per 1 USD (call payoff: FX rose, local depreciated)
            payoff_local = max(spot_future - K, 0)
            payoff_usd   = (payoff_local / spot_future) * usd_per_currency

            pnl = inv_pnl + payoff_usd - premium_usd
            details = {
                "U":                 metrics['U'],
                "D":                 metrics['D'],
                "p":                 metrics['p'],
                "premium_usd":       premium_usd,           # CRR (used for P&L)
                "premium_crr_usd":   premium_crr_usd,
                "premium_bs_usd":    premium_bs_usd,
                "premium_crr_local": premium_crr_local,
                "premium_bs_local":  premium_bs_local,
                "convergence_gap":   abs(premium_crr_usd - premium_bs_usd),
                "payoff_usd":        payoff_usd,
                "investment_pnl":    inv_pnl,
                "greeks":            metrics.get('greeks', {}),
                "nodes":             metrics.get('nodes', []),
            }
        else:
            raise ValueError(f"Unknown strategy {strategy}")
            
        total_pnl += pnl
        
        countries_result[ccy] = {
            "pnl": pnl,
            "premium": premium_usd,
            "payoff": payoff_usd,
            "details": details
        }
        
    portfolio_return_pct = (total_pnl / total_investment) * 100 if total_investment > 0 else 0
    
    return {
        "strategy": strategy,
        "total_pnl": total_pnl,
        "portfolio_return_pct": portfolio_return_pct,
        "countries": countries_result
    }
