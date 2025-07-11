import random
from typing import List, Dict, Any
from dataclasses import dataclass
from .tracks import track_db
from .multi_car_simulation import MultiCarSimulator, create_sample_car_configs
from .weather_system import WeatherSimulator
from .strategy_comparison import StrategyComparator, create_sample_strategies

@dataclass
class TireCompound:
    name: str
    base_grip: float
    wear_rate: float
    temperature_sensitivity: float

@dataclass
class DriverStyle:
    name: str
    pace_multiplier: float
    tire_wear_multiplier: float
    fuel_efficiency: float

class RaceSimulator:
    def __init__(self, track_id: str = "silverstone"):
        self.track = track_db.get_track(track_id)
        
        # Tire compound definitions
        self.tire_compounds = {
            "Soft": TireCompound("Soft", 1.0, 1.5, 1.2),
            "Medium": TireCompound("Medium", 0.95, 1.0, 1.0),
            "Hard": TireCompound("Hard", 0.9, 0.7, 0.8),
            "Intermediate": TireCompound("Intermediate", 0.85, 1.2, 1.1),
            "Wet": TireCompound("Wet", 0.8, 1.3, 1.3)
        }
        
        # Driver style definitions
        self.driver_styles = {
            "aggressive": DriverStyle("aggressive", 0.98, 1.3, 0.95),
            "balanced": DriverStyle("balanced", 1.0, 1.0, 1.0),
            "conservative": DriverStyle("conservative", 1.02, 0.8, 1.05)
        }
        
        # Weather conditions
        self.weather_conditions = {
            "dry": {"grip_multiplier": 1.0, "wear_multiplier": 1.0},
            "wet": {"grip_multiplier": 0.85, "wear_multiplier": 1.2},
            "intermediate": {"grip_multiplier": 0.92, "wear_multiplier": 1.1}
        }
        
        # Track characteristics
        self.base_lap_time = self.track.lap_record  # Use track lap record as base
        self.fuel_load_impact = 0.02  # Seconds per lap per lap number
        self.pit_stop_time = 25.0  # Pit stop time in seconds
        
        # Initialize weather and multi-car simulators
        self.weather_simulator = WeatherSimulator()
        self.multi_car_simulator = MultiCarSimulator(track_id)
        self.strategy_comparator = StrategyComparator(track_id)
        
    def calculate_lap_time(self, lap: int, tire_wear: float, current_tire: str, 
                          driver_style: str, weather: str, fuel_load: float) -> float:
        """Calculate lap time based on various factors."""
        
        # Get compound and style data
        tire = self.tire_compounds.get(current_tire, self.tire_compounds["Medium"])
        style = self.driver_styles.get(driver_style, self.driver_styles["balanced"])
        weather_data = self.weather_conditions.get(weather, self.weather_conditions["dry"])
        
        # Base lap time from track record
        lap_time = self.base_lap_time
        
        # Fuel load impact (increases with lap number)
        fuel_impact = fuel_load * self.fuel_load_impact
        lap_time += fuel_impact
        
        # Tire wear impact
        tire_wear_impact = tire_wear * tire.wear_rate * style.tire_wear_multiplier
        lap_time += tire_wear_impact
        
        # Tire compound grip
        grip_impact = (1 - tire.base_grip) * 2.0  # 2 seconds difference between compounds
        lap_time += grip_impact
        
        # Driver style pace
        lap_time *= style.pace_multiplier
        
        # Weather impact
        lap_time *= (2 - weather_data["grip_multiplier"])  # Inverse relationship
        
        # Add some randomness (±0.5 seconds)
        random_variation = (random.random() - 0.5) * 1.0
        lap_time += random_variation
        
        return round(lap_time, 1)
    
    def calculate_tire_wear(self, current_wear: float, current_tire: str, 
                           driver_style: str, weather: str) -> float:
        """Calculate tire wear increase for the lap."""
        
        tire = self.tire_compounds.get(current_tire, self.tire_compounds["Medium"])
        style = self.driver_styles.get(driver_style, self.driver_styles["balanced"])
        weather_data = self.weather_conditions.get(weather, self.weather_conditions["dry"])
        
        # Base wear increase
        wear_increase = 1.0
        
        # Tire compound wear rate
        wear_increase *= tire.wear_rate
        
        # Driver style impact
        wear_increase *= style.tire_wear_multiplier
        
        # Weather impact
        wear_increase *= weather_data["wear_multiplier"]
        
        # Track-specific degradation
        track_degradation = self.track.tire_degradation.get(current_tire, 1.0)
        wear_increase *= track_degradation
        
        # Add some randomness
        wear_increase += (random.random() - 0.5) * 0.3
        
        return current_wear + max(0, wear_increase)

def simulate_race(strategy, weather: str = "dry", track_id: str = "silverstone") -> List[Dict[str, Any]]:
    """
    Simulate a complete F1 race with the given strategy.
    """
    simulator = RaceSimulator(track_id)
    track = track_db.get_track(track_id)
    total_laps = track.total_laps
    results = []
    tire_wear = 0.0
    current_tire_index = 0
    fuel_load = 0.0
    total_time = 0.0

    # Handle both Pydantic model and dictionary
    if hasattr(strategy, 'pit_stops'):
        pit_stops = strategy.pit_stops
        tires = strategy.tires
        driver_style = strategy.driver_style
    else:
        pit_stops = strategy.get("pit_stops", [])
        tires = strategy.get("tires", ["Medium"])
        driver_style = strategy.get("driver_style", "balanced")

    for lap in range(1, total_laps + 1):
        # Check if this is a pit stop lap
        if lap in pit_stops:
            tire_wear = 0.0
            current_tire_index = min(current_tire_index + 1, len(tires) - 1)
            total_time += simulator.pit_stop_time
        current_tire = tires[current_tire_index] if current_tire_index < len(tires) else tires[-1]
        lap_time = simulator.calculate_lap_time(
            lap, tire_wear, current_tire, driver_style, weather, fuel_load
        )
        total_time += lap_time
        tire_wear = simulator.calculate_tire_wear(
            tire_wear, current_tire, driver_style, weather
        )
        fuel_load = lap
        results.append({
            "lap": lap,
            "lap_time": lap_time,
            "tire_wear": round(tire_wear, 1),
            "position": 1,
            "fuel_load": round(fuel_load, 1)
        })
    return results

def simulate_multi_car_race(car_configs: List[Dict[str, Any]], 
                           weather: str = "dry", 
                           track_id: str = "silverstone") -> List[Dict[str, Any]]:
    """
    Simulate a multi-car race with overtaking and traffic management.
    
    Args:
        car_configs: List of car configurations
        weather: Weather conditions
        track_id: Track identifier
    
    Returns:
        List of lap-by-lap simulation results with multiple cars
    """
    simulator = MultiCarSimulator(track_id)
    return simulator.simulate_race(car_configs, weather)

def compare_strategies(strategies: List[Dict[str, Any]], 
                      weather: str = "dry", 
                      track_id: str = "silverstone",
                      num_simulations: int = 5) -> Dict[str, Any]:
    """
    Compare multiple strategies and provide analysis.
    
    Args:
        strategies: List of strategies to compare
        weather: Weather conditions
        track_id: Track identifier
        num_simulations: Number of simulations per strategy
    
    Returns:
        Comparison results with analysis
    """
    comparator = StrategyComparator(track_id)
    result = comparator.compare_strategies(strategies, weather, num_simulations)
    
    return {
        "strategies": [
            {
                "name": s.strategy_name,
                "total_time": s.total_time,
                "pit_stops": s.pit_stops,
                "tires": s.tires,
                "driver_style": s.driver_style,
                "best_lap": s.best_lap,
                "average_lap": s.average_lap,
                "risk_score": s.risk_score,
                "tire_wear_analysis": s.tire_wear_analysis,
                "weather_impact": s.weather_impact
            }
            for s in result.strategies
        ],
        "winner": {
            "name": result.winner.strategy_name,
            "total_time": result.winner.total_time
        },
        "key_differences": result.key_differences,
        "optimization_suggestions": result.optimization_suggestions,
        "risk_analysis": result.risk_analysis
    }

def get_available_tracks() -> List[Dict[str, Any]]:
    """Get list of available tracks for frontend selection"""
    return track_db.get_track_list()

def get_track_details(track_id: str) -> Dict[str, Any]:
    """Get detailed information about a specific track"""
    track = track_db.get_track(track_id)
    return {
        "id": track_id,
        "name": track.name,
        "country": track.country,
        "circuit_length": track.circuit_length,
        "total_laps": track.total_laps,
        "lap_record": track.lap_record,
        "sectors": [
            {
                "name": sector.name,
                "length": sector.length,
                "base_time": sector.base_time,
                "tire_wear_factor": sector.tire_wear_factor,
                "fuel_consumption_factor": sector.fuel_consumption_factor
            }
            for sector in track.sectors
        ],
        "tire_degradation": track.tire_degradation,
        "weather_sensitivity": track.weather_sensitivity,
        "overtaking_difficulty": track.overtaking_difficulty
    }

def generate_weather_forecast(track_id: str = "silverstone", 
                            total_laps: int = 0) -> List[Dict[str, Any]]:
    """Generate weather forecast for the race"""
    if total_laps == 0:
        track = track_db.get_track(track_id)
        total_laps = track.total_laps
    
    weather_simulator = WeatherSimulator()
    forecast = weather_simulator.generate_weather_forecast(total_laps, track_id)
    
    return [
        {
            "lap": i + 1,
            "condition": weather.condition,
            "temperature": weather.temperature,
            "humidity": weather.humidity,
            "wind_speed": weather.wind_speed,
            "rain_probability": weather.rain_probability,
            "track_temperature": weather.track_temperature,
            "grip_level": weather.grip_level
        }
        for i, weather in enumerate(forecast)
    ]

def get_sample_car_configs() -> List[Dict[str, Any]]:
    """Get sample car configurations for multi-car simulation"""
    return create_sample_car_configs()

def get_sample_strategies() -> List[Dict[str, Any]]:
    """Get sample strategies for comparison"""
    return create_sample_strategies() 