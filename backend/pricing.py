import numpy as np
from scipy.stats import norm
from typing import Dict, Any, List


# ── Black-Scholes ────────────────────────────────────────────────────────────

def black_scholes_call(S0: float, K: float, T: float, r: float, sigma: float) -> float:
    """
    European Call option price using the Black-Scholes closed-form formula.

    C = S·N(d1) − K·e^(−rT)·N(d2)
    d1 = [ln(S/K) + (r + σ²/2)·T] / (σ√T)
    d2 = d1 − σ√T
    """
    if T <= 0 or sigma <= 0:
        return max(S0 - K, 0.0)

    sqrt_T = np.sqrt(T)
    d1 = (np.log(S0 / K) + (r + 0.5 * sigma ** 2) * T) / (sigma * sqrt_T)
    d2 = d1 - sigma * sqrt_T

    price = S0 * norm.cdf(d1) - K * np.exp(-r * T) * norm.cdf(d2)
    return float(price)


def black_scholes_greeks(S0: float, K: float, T: float, r: float, sigma: float) -> Dict[str, float]:
    """
    Returns Delta, Gamma, Vega, Theta, Rho for a European Call.
    """
    if T <= 0 or sigma <= 0:
        return {"delta": 1.0 if S0 > K else 0.0, "gamma": 0.0, "vega": 0.0, "theta": 0.0, "rho": 0.0}

    sqrt_T = np.sqrt(T)
    d1 = (np.log(S0 / K) + (r + 0.5 * sigma ** 2) * T) / (sigma * sqrt_T)
    d2 = d1 - sigma * sqrt_T

    delta = norm.cdf(d1)
    gamma = norm.pdf(d1) / (S0 * sigma * sqrt_T)
    vega  = S0 * norm.pdf(d1) * sqrt_T / 100          # per 1% vol move
    theta = (-(S0 * norm.pdf(d1) * sigma) / (2 * sqrt_T)
             - r * K * np.exp(-r * T) * norm.cdf(d2)) / 365  # per day
    rho   = K * T * np.exp(-r * T) * norm.cdf(d2) / 100       # per 1% rate move

    return {
        "delta": float(delta),
        "gamma": float(gamma),
        "vega":  float(vega),
        "theta": float(theta),
        "rho":   float(rho),
    }


# ── Binomial CRR ─────────────────────────────────────────────────────────────

def build_binomial_tree_nodes(S0: float, K: float, T: float, r: float, sigma: float, N: int) -> Dict[str, Any]:
    """
    Prices a European Call option using the CRR Binomial Tree and returns
    full tree metadata including per-node calculation details.
    """
    dt = T / N
    U  = np.exp(sigma * np.sqrt(dt))
    D  = np.exp(-sigma * np.sqrt(dt))

    # Risk-neutral probability
    p = (np.exp(r * dt) - D) / (U - D)

    if not (0 <= p <= 1):
        raise ValueError("Arbitrage opportunity detected: p is not between 0 and 1.")

    discount = np.exp(-r * dt)

    # Pre-calculate FX rates for all steps
    S_nodes = []
    V_nodes = []

    for i in range(N + 1):
        j   = np.arange(i + 1)
        S_i = S0 * (U ** j) * (D ** (i - j))
        S_nodes.append(S_i)
        V_nodes.append(np.zeros(i + 1))

    # Terminal payoffs
    V_nodes[N] = np.maximum(S_nodes[N] - K, 0)

    # Backward induction
    for i in range(N - 1, -1, -1):
        V_nodes[i] = discount * (p * V_nodes[i + 1][1:i + 2] + (1 - p) * V_nodes[i + 1][0:i + 1])

    premium_crr = float(V_nodes[0][0])

    # Black-Scholes reference
    premium_bs = black_scholes_call(S0, K, T, r, sigma)
    greeks     = black_scholes_greeks(S0, K, T, r, sigma)

    # Build full node tree only if visualisable (N ≤ 12)
    nodes = []
    if N <= 12:
        for i in range(N + 1):
            step_nodes = []
            for j in range(i + 1):
                node: Dict[str, Any] = {
                    "step":         i,
                    "up_moves":     j,
                    "fx_rate":      float(S_nodes[i][j]),
                    "option_value": float(V_nodes[i][j]),
                    "payoff":       float(np.maximum(S_nodes[i][j] - K, 0)) if i == N else None,
                }
                if i < N:
                    node["children"] = {
                        "up":   [i + 1, j + 1],
                        "down": [i + 1, j],
                    }
                    node["calculation"] = {
                        "discount_factor": float(discount),
                        "probability":     float(p),
                        "up_value":        float(V_nodes[i + 1][j + 1]),
                        "down_value":      float(V_nodes[i + 1][j]),
                        "formula_result":  float(V_nodes[i][j]),
                    }
                step_nodes.append(node)
            nodes.append(step_nodes)

    return {
        "U":           float(U),
        "D":           float(D),
        "p":           float(p),
        "premium_crr": premium_crr,
        "premium_bs":  premium_bs,
        "premium_local": premium_crr,   # kept for backward-compat
        "greeks":      greeks,
        "nodes":       nodes,
    }


def calculate_option_metrics(S0: float, K: float, T: float, r: float, sigma: float, N: int) -> Dict[str, Any]:
    """Entry-point called by strategies.py."""
    return build_binomial_tree_nodes(S0, K, T, r, sigma, N)
