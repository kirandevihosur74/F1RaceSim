import random
from typing import List, Dict, Any
from dataclasses import dataclass

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
    def __init__(self):
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
        self.base_lap_time = 85.0  # Base lap time in seconds
        self.fuel_load_impact = 0.02  # Seconds per lap per lap number
        self.pit_stop_time = 25.0  # Pit stop time in seconds
        
    def calculate_lap_time(self, lap: int, tire_wear: float, current_tire: str, 
                          driver_style: str, weather: str, fuel_load: float) -> float:
        """Calculate lap time based on various factors."""
        
        # Get compound and style data
        tire = self.tire_compounds.get(current_tire, self.tire_compounds["Medium"])
        style = self.driver_styles.get(driver_style, self.driver_styles["balanced"])
        weather_data = self.weather_conditions.get(weather, self.weather_conditions["dry"])
        
        # Base lap time
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
        
        # Add some randomness
        wear_increase += (random.random() - 0.5) * 0.3
        
        return current_wear + max(0, wear_increase)

def simulate_race(strategy, weather: str = "dry") -> List[Dict[str, Any]]:
    """
    Simulate a complete F1 race with the given strategy.
    
    Args:
        strategy: StrategyInput object or dictionary containing pit_stops, tires, and driver_style
        weather: Weather conditions (dry, wet, intermediate)
    
    Returns:
        List of lap-by-lap simulation results
    """
    
    simulator = RaceSimulator()
    total_laps = 58
    results = []
    
    # Initialize race state
    tire_wear = 0.0
    current_tire_index = 0
    fuel_load = 0.0
    total_time = 0.0
    
    # Handle both Pydantic model and dictionary
    if hasattr(strategy, 'pit_stops'):
        # Pydantic model
        pit_stops = strategy.pit_stops
        tires = strategy.tires
        driver_style = strategy.driver_style
    else:
        # Dictionary
        pit_stops = strategy.get("pit_stops", [])
        tires = strategy.get("tires", ["Medium"])
        driver_style = strategy.get("driver_style", "balanced")
    
    for lap in range(1, total_laps + 1):
        # Check if this is a pit stop lap
        if lap in pit_stops:
            # Reset tire wear and change to next compound
            tire_wear = 0.0
            current_tire_index = min(current_tire_index + 1, len(tires) - 1)
            total_time += simulator.pit_stop_time
        
        # Get current tire compound
        current_tire = tires[current_tire_index] if current_tire_index < len(tires) else tires[-1]
        
        # Calculate lap time
        lap_time = simulator.calculate_lap_time(
            lap, tire_wear, current_tire, driver_style, weather, fuel_load
        )
        
        # Update total time
        total_time += lap_time
        
        # Calculate new tire wear
        tire_wear = simulator.calculate_tire_wear(
            tire_wear, current_tire, driver_style, weather
        )
        
        # Update fuel load
        fuel_load = lap
        
        # Store lap result
        results.append({
            "lap": lap,
            "lap_time": lap_time,
            "tire_wear": round(tire_wear, 1),
            "position": 1,  # Simplified - could be expanded for multi-car simulation
            "fuel_load": round(fuel_load, 1)
        })
    
    return results 