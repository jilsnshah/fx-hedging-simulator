import pandas as pd
import os
from datetime import datetime

# Global dictionaries to store data in memory
df_historical = None
# Lookup by (date, currency_pair) -> row dictionary
data_lookup = {}
# Lookup for 1-year future date: future_lookup[(date, currency_pair)] = future_row_dict
future_lookup = {}

def load_data(filepath: str):
    global df_historical, data_lookup, future_lookup
    print(f"Loading data from {filepath}...")
    
    # Read the data sheet
    df = pd.read_excel(filepath, sheet_name='Data')
    
    # Ensure Date is datetime
    df['Date'] = pd.to_datetime(df['Date'])
    
    df_historical = df.copy()
    
    # Build data_lookup
    for _, row in df.iterrows():
        dt = row['Date'].to_pydatetime()
        ccy = row['CCYPair']
        data_lookup[(dt, ccy)] = row.to_dict()
        
    # Get all unique dates sorted
    unique_dates = sorted(df['Date'].unique())
    
    # Build future_lookup
    for (dt, ccy), row_dict in data_lookup.items():
        # Target date is 1 year later
        target_date = dt + pd.DateOffset(years=1)
        
        # Find the exact or next closest date in the dataset
        # (Assuming we might hit weekends/holidays)
        valid_future_dates = [d for d in unique_dates if d >= target_date]
        
        if valid_future_dates:
            future_dt = valid_future_dates[0].to_pydatetime()
            if (future_dt, ccy) in data_lookup:
                future_lookup[(dt, ccy)] = data_lookup[(future_dt, ccy)]
            else:
                # Missing future data for this currency pair on that date
                future_lookup[(dt, ccy)] = None
        else:
            # Out of bounds (e.g., date is too close to end of dataset)
            future_lookup[(dt, ccy)] = None
            
    print(f"Data loaded successfully. {len(data_lookup)} records, {len(future_lookup)} future lookups precomputed.")

def get_available_dates():
    if not data_lookup:
        return []
    # Return distinct dates as strings YYYY-MM-DD
    dates = sorted(list(set([d.strftime('%Y-%m-%d') for d, _ in data_lookup.keys()])))
    return dates

def get_available_currencies():
    if not data_lookup:
        return []
    currencies = sorted(list(set([c for _, c in data_lookup.keys()])))
    return currencies

def get_current_data(date: datetime, currency: str):
    return data_lookup.get((date, currency))

def get_future_data(date: datetime, currency: str):
    return future_lookup.get((date, currency))
