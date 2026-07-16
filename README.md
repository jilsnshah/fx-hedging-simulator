# FX Hedging Strategy Simulator

Interactive simulator comparing three FX hedging strategies for a USD corporate
book invested across emerging/Asian currencies. Built as the capstone project
of the **Barclays Mentorship Programme**.

**Case study:** a treasurer invests **$250M per currency** (~$1B total) across
**USDINR, USDJPY, USDCNH, USDKRW** for one year, and must decide how to hedge
the FX risk on the way back to USD. The simulator replays this decision on
**2 years of daily market data** (spot, 1-year forward, ATM implied vol —
2,055 rows) and attributes P&L per currency and per strategy.

## The three strategies

| | Strategy | Mechanics |
|---|---|---|
| **A** | No hedge | Convert at the future spot — full FX exposure, no cost |
| **B** | Forward hedge | Lock today's 1-year forward rate — certainty, no upside |
| **C** | Option hedge | Buy a 1-year ATM call on the FX rate — pay premium, keep upside, floor the downside |

Strategy C's premium is priced **two ways** and compared:

- **Black-Scholes** closed form, with full Greeks (delta, gamma, vega, theta, rho)
- **Cox-Ross-Rubinstein binomial tree** with configurable steps, reporting the
  tree→Black-Scholes **convergence gap** (the tree price converges to the
  closed form as steps increase — the UI visualizes the tree itself)

## Stack

```
backend/            FastAPI service
  pricing.py        Black-Scholes + Greeks, CRR binomial tree
  strategies.py     strategy A/B/C simulation + P&L attribution
  data_loader.py    case-study Excel -> (date, currency) lookups, 1y-forward matching
  excel_export.py   results export
frontend/           React + Vite + Tailwind
  BinomialTree.jsx  interactive tree visualization
  Charts.jsx        strategy-comparison charts
  KPISection.jsx    portfolio KPIs
api/index.py        Vercel serverless entrypoint
```

## Run locally

```bash
# backend (requires Python 3.12 — see .python-version)
pip install -e .
uvicorn backend.main:app --reload

# frontend
cd frontend && npm install && npm run dev
```

## Notes & limitations

- Prices **European ATM calls at a fixed 1-year tenor**; strike = spot at
  hedge inception, per the case-study setup.
- The CRR premium (not Black-Scholes) is used for realized P&L, consistent
  with the visualized tree; the BS premium is shown alongside for comparison.
- Case-study dataset, not a live feed; forwards/vols come from the provided
  Excel (`Casestudy_Data.xlsx`).
