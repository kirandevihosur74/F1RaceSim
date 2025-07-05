from typing import List, Dict, Any, Optional
from dataclasses import dataclass
import random
import math
from .tracks import track_db

@dataclass
class CarState:
    car_id: str
    driver_name: str
    position: int
    lap_time: float
    total_time: float
    tire_wear: float
    current_tire: str
    fuel_load: float
    driver_style: str
    strategy: Dict[str, Any]
    sector_times: List[float]
    gap_to_leader: float
    gap_to_car_ahead: float
    is_pitting: bool
    pit_lap: Optional[int]
    last_pit_lap: int

@dataclass
class OvertakingEvent:
    lap: int
    overtaking_car: str
    overtaken_car: str
    position_change: int
    gap_before: float
    gap_after: float

class MultiCarSimulator:
    def __init__(self, track_id: str = "silverstone"):
        self.track = track_db.get_track(track_id)
        self.cars: List[CarState] = []
        self.overtaking_events: List[OvertakingEvent] = []
        self.lap_results: List[Dict[str, Any]] = []
        
    def initialize_cars(self, car_configs: List[Dict[str, Any]]):
        """Initialize cars with their configurations"""
        self.cars = []
        
        for i, config in enumerate(car_configs):
            car = CarState(
                car_id=config["car_id"],
                driver_name=config["driver_name"],
                position=i + 1,
                lap_time=0.0,
                total_time=0.0,
                tire_wear=0.0,
                current_tire=config["strategy"]["tires"][0],
                fuel_load=0.0,
                driver_style=config["strategy"]["driver_style"],
                strategy=config["strategy"],
                sector_times=[0.0, 0.0, 0.0],
                gap_to_leader=0.0,
                gap_to_car_ahead=0.0,
                is_pitting=False,
                pit_lap=None,
                last_pit_lap=0
            )
            self.cars.append(car)
    
    def calculate_sector_times(self, car: CarState, weather: str) -> List[float]:
        """Calculate sector times based on track characteristics"""
        sector_times = []
        
        for i, sector in enumerate(self.track.sectors):
            # Base sector time
            sector_time = sector.base_time
            
            # Tire wear impact
            tire_wear_impact = car.tire_wear * sector.tire_wear_factor
            sector_time += tire_wear_impact
            
            # Fuel load impact
            fuel_impact = car.fuel_load * 0.01 * sector.fuel_consumption_factor
            sector_time += fuel_impact
            
            # Driver style impact
            if car.driver_style == "aggressive":
                sector_time *= 0.98
            elif car.driver_style == "conservative":
                sector_time *= 1.02
            
            # Weather impact
            weather_multiplier = 1.0 + (0.1 * self.track.weather_sensitivity)
            if weather == "wet":
                sector_time *= weather_multiplier * 1.1
            elif weather == "intermediate":
                sector_time *= weather_multiplier * 1.05
            
            # Add randomness
            sector_time += (random.random() - 0.5) * 0.5
            
            sector_times.append(round(sector_time, 3))
        
        return sector_times
    
    def calculate_overtaking_probability(self, attacking_car: CarState, defending_car: CarState) -> float:
        """Calculate probability of overtaking based on various factors"""
        base_probability = 0.1
        
        # Gap to car ahead
        if defending_car.gap_to_car_ahead < 1.0:  # Within 1 second
            base_probability += 0.2
        
        # Track overtaking difficulty
        base_probability *= (1 - self.track.overtaking_difficulty)
        
        # Driver style impact
        if attacking_car.driver_style == "aggressive":
            base_probability *= 1.3
        elif attacking_car.driver_style == "conservative":
            base_probability *= 0.7
        
        # Tire advantage
        tire_advantage = self._calculate_tire_advantage(attacking_car, defending_car)
        base_probability *= (1 + tire_advantage)
        
        # Random factor
        base_probability *= random.uniform(0.8, 1.2)
        
        return min(base_probability, 0.8)  # Cap at 80%
    
    def _calculate_tire_advantage(self, car1: CarState, car2: CarState) -> float:
        """Calculate tire advantage between two cars"""
        tire_compounds = {"Soft": 1.0, "Medium": 0.95, "Hard": 0.9, "Intermediate": 0.85, "Wet": 0.8}
        
        car1_advantage = tire_compounds.get(car1.current_tire, 0.95) - tire_compounds.get(car2.current_tire, 0.95)
        car1_advantage -= (car1.tire_wear - car2.tire_wear) * 0.1
        
        return car1_advantage
    
    def simulate_overtaking(self, lap: int) -> List[OvertakingEvent]:
        """Simulate overtaking attempts for the current lap"""
        events = []
        
        # Check each car for overtaking opportunities
        for i in range(len(self.cars) - 1):
            attacking_car = self.cars[i + 1]  # Car behind
            defending_car = self.cars[i]      # Car ahead
            
            # Only attempt overtaking if within 2 seconds
            if attacking_car.gap_to_car_ahead < 2.0:
                probability = self.calculate_overtaking_probability(attacking_car, defending_car)
                
                if random.random() < probability:
                    # Successful overtake
                    event = OvertakingEvent(
                        lap=lap,
                        overtaking_car=attacking_car.car_id,
                        overtaken_car=defending_car.car_id,
                        position_change=1,
                        gap_before=attacking_car.gap_to_car_ahead,
                        gap_after=0.5  # New gap after overtake
                    )
                    events.append(event)
                    
                    # Update positions
                    attacking_car.position, defending_car.position = defending_car.position, attacking_car.position
                    attacking_car.gap_to_car_ahead = event.gap_after
                    
                    # Update gaps for other cars
                    self._update_gaps()
        
        return events
    
    def _update_gaps(self):
        """Update gaps between cars after position changes"""
        for i in range(len(self.cars)):
            if i == 0:
                self.cars[i].gap_to_leader = 0.0
                self.cars[i].gap_to_car_ahead = 0.0
            else:
                self.cars[i].gap_to_leader = self.cars[i].total_time - self.cars[0].total_time
                self.cars[i].gap_to_car_ahead = self.cars[i].total_time - self.cars[i-1].total_time
    
    def simulate_lap(self, lap: int, weather: str) -> Dict[str, Any]:
        """Simulate one lap for all cars"""
        lap_results = {
            "lap": lap,
            "cars": [],
            "overtaking_events": []
        }
        
        # Simulate each car's lap
        for car in self.cars:
            if car.is_pitting and car.pit_lap == lap:
                # Car is pitting this lap
                car.total_time += 25.0  # Pit stop time
                car.tire_wear = 0.0
                car.last_pit_lap = lap
                car.is_pitting = False
                car.pit_lap = None
                
                # Change to next tire compound
                current_tire_index = car.strategy["tires"].index(car.current_tire)
                if current_tire_index < len(car.strategy["tires"]) - 1:
                    car.current_tire = car.strategy["tires"][current_tire_index + 1]
            
            # Check if car should pit next lap
            if lap + 1 in car.strategy["pit_stops"]:
                car.is_pitting = True
                car.pit_lap = lap + 1
            
            # Calculate sector times
            car.sector_times = self.calculate_sector_times(car, weather)
            car.lap_time = sum(car.sector_times)
            
            # Update tire wear
            tire_degradation = self.track.tire_degradation.get(car.current_tire, 1.0)
            car.tire_wear += 1.0 * tire_degradation * (1.0 if car.driver_style == "balanced" else 1.2 if car.driver_style == "aggressive" else 0.8)
            
            # Update fuel load
            car.fuel_load = lap
            
            # Update total time
            car.total_time += car.lap_time
            
            # Add car result
            lap_results["cars"].append({
                "car_id": car.car_id,
                "driver_name": car.driver_name,
                "position": car.position,
                "lap_time": car.lap_time,
                "total_time": car.total_time,
                "tire_wear": round(car.tire_wear, 1),
                "current_tire": car.current_tire,
                "fuel_load": round(car.fuel_load, 1),
                "sector_times": car.sector_times,
                "gap_to_leader": round(car.gap_to_leader, 3),
                "gap_to_car_ahead": round(car.gap_to_car_ahead, 3),
                "is_pitting": car.is_pitting
            })
        
        # Simulate overtaking
        overtaking_events = self.simulate_overtaking(lap)
        lap_results["overtaking_events"] = [
            {
                "lap": event.lap,
                "overtaking_car": event.overtaking_car,
                "overtaken_car": event.overtaken_car,
                "position_change": event.position_change,
                "gap_before": event.gap_before,
                "gap_after": event.gap_after
            }
            for event in overtaking_events
        ]
        
        # Sort cars by position (total time)
        self.cars.sort(key=lambda x: x.total_time)
        for i, car in enumerate(self.cars):
            car.position = i + 1
        
        # Update gaps
        self._update_gaps()
        
        return lap_results
    
    def simulate_race(self, car_configs: List[Dict[str, Any]], weather: str = "dry") -> List[Dict[str, Any]]:
        """Simulate complete race with multiple cars"""
        self.initialize_cars(car_configs)
        self.lap_results = []
        
        for lap in range(1, self.track.total_laps + 1):
            lap_result = self.simulate_lap(lap, weather)
            self.lap_results.append(lap_result)
        
        return self.lap_results

def create_sample_car_configs() -> List[Dict[str, Any]]:
    """Create sample car configurations for testing"""
    return [
        {
            "car_id": "VER",
            "driver_name": "Max Verstappen",
            "strategy": {
                "pit_stops": [15, 35],
                "tires": ["Soft", "Medium", "Hard"],
                "driver_style": "aggressive"
            }
        },
        {
            "car_id": "HAM",
            "driver_name": "Lewis Hamilton",
            "strategy": {
                "pit_stops": [18, 38],
                "tires": ["Medium", "Hard", "Medium"],
                "driver_style": "balanced"
            }
        },
        {
            "car_id": "LEC",
            "driver_name": "Charles Leclerc",
            "strategy": {
                "pit_stops": [12, 32],
                "tires": ["Soft", "Soft", "Medium"],
                "driver_style": "aggressive"
            }
        },
        {
            "car_id": "NOR",
            "driver_name": "Lando Norris",
            "strategy": {
                "pit_stops": [20, 40],
                "tires": ["Medium", "Hard", "Hard"],
                "driver_style": "conservative"
            }
        }
    ] 