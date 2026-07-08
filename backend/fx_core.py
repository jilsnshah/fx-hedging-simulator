def compute_local_currency_value(usd_investment: float, spot: float, investment_return: float) -> float:
    """
    Computes the final local currency value of a USD investment.
    """
    local = usd_investment * spot
    return local * (1 + investment_return)
