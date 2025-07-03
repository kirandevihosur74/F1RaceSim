from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from mangum import Mangum
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import os
# from dotenv import load_dotenv

from api.simulation import simulate_race
from api.strategy import get_strategy_recommendation

# Load environment variables
# load_dotenv()

app = FastAPI(
    title="F1 Race Simulator API",
    description="AI-powered Formula 1 race strategy simulation and recommendations",
    version="1.0.0"
)

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
async def root():
    return {"message": "F1 Race Simulator API", "version": "1.0.0"}

@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "f1-race-simulator"}

@app.post("/simulate-race", response_model=SimulationResponse)
async def simulate_race_endpoint(request: SimulationRequest):
    """
    Simulate a Formula 1 race with given strategy parameters.
    
    - **pit_stops**: List of lap numbers for pit stops
    - **tires**: List of tire compounds to use
    - **driver_style**: Driver approach (aggressive, balanced, conservative)
    - **weather**: Weather conditions (dry, wet, intermediate)
    """
    try:
        simulation_results = simulate_race(request.strategy, request.weather)
        
        # Calculate total race time
        total_time = sum(lap["lap_time"] for lap in simulation_results)
        
        # Generate strategy analysis
        strategy_analysis = f"Simulated {len(simulation_results)} laps with {len(request.strategy.pit_stops)} pit stops using {' → '.join(request.strategy.tires)} compounds."
        
        return SimulationResponse(
            status="success",
            simulation=simulation_results,
            total_time=total_time,
            strategy_analysis=strategy_analysis
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Simulation failed: {str(e)}")

@app.post("/strategy-recommendation", response_model=RecommendationResponse)
async def strategy_recommendation_endpoint(request: StrategyRecommendationRequest):
    """
    Get AI-generated strategy recommendations based on race scenario.
    
    - **scenario**: Description of the race scenario and current strategy
    """
    try:
        recommendation = await get_strategy_recommendation(request.scenario)
        
        return RecommendationResponse(
            status="success",
            recommendation=recommendation
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get recommendation: {str(e)}")

# AWS Lambda handler
handler = Mangum(app)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000) 