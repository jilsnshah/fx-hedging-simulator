from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List
from datetime import datetime
import os

from backend.data_loader import load_data, get_available_dates, get_available_currencies
from backend.strategies import run_simulation

app = FastAPI(title="FX Hedging Case Study Simulator")

# Add CORS middleware for the frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Adjust in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def startup_event():
    # Load dataset on startup
    file_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'Casestudy_Data.xlsx')
    if os.path.exists(file_path):
        load_data(file_path)
    else:
        print(f"Warning: Data file not found at {file_path}")

@app.get("/api/dates", response_model=List[str])
def get_dates():
    """Returns all valid dates."""
    dates = get_available_dates()
    if not dates:
        raise HTTPException(status_code=404, detail="No dates available")
    return dates

@app.get("/api/currencies", response_model=List[str])
def get_currencies():
    """Returns all available currency pairs."""
    currencies = get_available_currencies()
    if not currencies:
        raise HTTPException(status_code=404, detail="No currencies available")
    return currencies

class SimulateRequest(BaseModel):
    strategy: str
    start_date: str # YYYY-MM-DD
    investment_return: float
    risk_free_rate: float
    tree_steps: int = 100

@app.post("/api/simulate")
def simulate(req: SimulateRequest):
    try:
        dt = datetime.strptime(req.start_date, '%Y-%m-%d')
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD")
        
    if req.strategy not in ['A', 'B', 'C']:
        raise HTTPException(status_code=400, detail="Invalid strategy. Must be A, B, or C")
        
    currencies = get_available_currencies()
    if not currencies:
        raise HTTPException(status_code=500, detail="No data loaded")
        
    try:
        result = run_simulation(
            strategy=req.strategy,
            start_date=dt,
            investment_return=req.investment_return,
            risk_free_rate=req.risk_free_rate,
            tree_steps=req.tree_steps,
            currencies=currencies
        )
        return result
    except ValueError as e:
        # CRR needs d < e^(r*dt) < u. Few steps make dt coarse enough that the
        # drift escapes the up/down move and p leaves [0, 1] — a bad request,
        # not a server fault. The viable minimum rises with the risk-free rate
        # and falls with volatility, so report it rather than guess a floor.
        raise HTTPException(
            status_code=400,
            detail=(
                f"Cannot price the tree with {req.tree_steps} step(s) at a "
                f"{req.risk_free_rate:.2%} risk-free rate: {e} "
                "Increase the tree steps or lower the rate."
            ),
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
