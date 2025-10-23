from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from mangum import Mangum
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import os
# from dotenv import load_dotenv

# --- Add slowapi for rate limiting ---
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

from api.simulation import simulate_race
from api.strategy import get_strategy_recommendation

# Load environment variables
# load_dotenv()

app = FastAPI(
    title="F1 Race Simulator API",
    description="AI-powered Formula 1 race strategy simulation and recommendations",
    version="1.0.0"
)

# --- Rate Limiter Setup ---
# Add your admin IP(s) here
ADMIN_IPS = {"122.163.100.100"}  # Replace with your real IP

def custom_key_func(request):
    ip = get_remote_address(request)
    if ip in ADMIN_IPS:
        return f"admin-{ip}"  # Exempt admin IP from rate limiting
    return ip

# Use the custom key function in the limiter
limiter = Limiter(key_func=custom_key_func)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure appropriately for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Pydantic models
class StrategyInput(BaseModel):
    pit_stops: List[int]
    tires: List[str]
    driver_style: str

class SimulationRequest(BaseModel):
    strategy: StrategyInput
    weather: str = "dry"

class StrategyRecommendationRequest(BaseModel):
    scenario: str

class SimulationResult(BaseModel):
    lap: int
    lap_time: float
    tire_wear: float
    position: Optional[int] = None
    fuel_load: Optional[float] = None

class SimulationResponse(BaseModel):
    status: str
    simulation: List[SimulationResult]
    total_time: Optional[float] = None
    strategy_analysis: Optional[str] = None

class RecommendationResponse(BaseModel):
    status: str
    recommendation: Dict[str, Any]

@app.get("/")
@limiter.limit("3/day")
async def root(request: Request):
    return {"message": "F1 Race Simulator API", "version": "1.0.0"}

@app.get("/health")
@limiter.limit("3/day")
async def health_check(request: Request):
    return {"status": "healthy", "service": "f1-race-simulator"}

@app.post("/simulate-race", response_model=SimulationResponse)
@limiter.limit("100/day")  # Higher limit - let the plan system control actual limits
async def simulate_race_endpoint(request: Request, body: SimulationRequest):
    """
    Simulate a Formula 1 race with given strategy parameters.
    
    - **pit_stops**: List of lap numbers for pit stops
    - **tires**: List of tire compounds to use
    - **driver_style**: Driver approach (aggressive, balanced, conservative)
    - **weather**: Weather conditions (dry, wet, intermediate)
    """
    try:
        simulation_results = simulate_race(body.strategy, body.weather)
        
        # Calculate total race time
        total_time = sum(lap["lap_time"] for lap in simulation_results)
        
        # Generate strategy analysis
        strategy_analysis = f"Simulated {len(simulation_results)} laps with {len(body.strategy.pit_stops)} pit stops using {' → '.join(body.strategy.tires)} compounds."
        
        return SimulationResponse(
            status="success",
            simulation=simulation_results,
            total_time=total_time,
            strategy_analysis=strategy_analysis
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Simulation failed: {str(e)}")

@app.post("/strategy-recommendation", response_model=RecommendationResponse)
@limiter.limit("100/day")  # Higher limit - let the plan system control actual limits
async def strategy_recommendation_endpoint(request: Request, body: StrategyRecommendationRequest):
    """
    Get AI-generated strategy recommendations based on race scenario.
    
    - **scenario**: Description of the race scenario and current strategy
    """
    try:
        print(f"Calling get_strategy_recommendation with scenario: {body.scenario}")
        recommendation = await get_strategy_recommendation(body.scenario)
        print(f"Received recommendation type: {type(recommendation)}")
        print(f"Received recommendation value: {recommendation}")
        
        # Ensure recommendation is a dictionary
        if not isinstance(recommendation, dict):
            print(f"CRITICAL: recommendation is not a dict, got {type(recommendation)}: {recommendation}")
            # Convert string to dict if needed
            if isinstance(recommendation, str):
                print("Converting string to dict structure")
                recommendation = {
                    "pit_stop_timing": recommendation,
                    "tire_compound_strategy": "",
                    "driver_approach_adjustments": "",
                    "potential_time_savings_or_risks": ""
                }
                print(f"Converted to: {recommendation}")
            else:
                print(f"Unknown type, falling back to mock")
                from api.strategy import get_mock_recommendation
                recommendation = get_mock_recommendation(body.scenario)
        
        print(f"Final recommendation before Pydantic: {recommendation}")
        print(f"Final recommendation type: {type(recommendation)}")
        
        response = RecommendationResponse(
            status="success",
            recommendation=recommendation
        )
        print(f"Pydantic response created successfully: {response}")
        return response
    except Exception as e:
        print(f"Error in strategy recommendation: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get recommendation: {str(e)}")

# AWS Lambda handler
handler = Mangum(app)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000) 