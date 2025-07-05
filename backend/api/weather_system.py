from typing import Dict, List, Any, Optional
from dataclasses import dataclass
import random
import math

@dataclass
class WeatherCondition:
    condition: str  # dry, wet, intermediate
    temperature: float  # in Celsius
    humidity: float  # percentage
    wind_speed: float  # km/h
    rain_probability: float  # 0-1
    track_temperature: float  # in Celsius
    grip_level: float  # 0-1, affects tire performance

@dataclass
class WeatherEvent:
    lap: int
    event_type: str  # rain_start, rain_stop, temperature_change, humidity_change
    description: str
    impact: Dict[str, Any]

class WeatherSimulator:
    def __init__(self, initial_weather: str = "dry"):
        self.current_weather = WeatherCondition(
            condition=initial_weather,
            temperature=25.0,
            humidity=60.0,
            wind_speed=10.0,
            rain_probability=0.1,
            track_temperature=35.0,
            grip_level=1.0
        )
        self.weather_events: List[WeatherEvent] = []
        self.forecast: List[WeatherCondition] = []
        
    def generate_weather_forecast(self, total_laps: int, track_id: str = "silverstone") -> List[WeatherCondition]:
        """Generate weather forecast for the entire race"""
        forecast = []
        
        # Track-specific weather patterns
        track_weather_patterns = {
            "monaco": {"rain_probability": 0.3, "temperature_variation": 5.0},
            "silverstone": {"rain_probability": 0.4, "temperature_variation": 8.0},
            "spa": {"rain_probability": 0.5, "temperature_variation": 10.0},
            "monza": {"rain_probability": 0.2, "temperature_variation": 6.0},
            "suzuka": {"rain_probability": 0.4, "temperature_variation": 7.0}
        }
        
        pattern = track_weather_patterns.get(track_id, {"rain_probability": 0.3, "temperature_variation": 5.0})
        
        for lap in range(1, total_laps + 1):
            # Base weather condition
            weather = WeatherCondition(
                condition=self.current_weather.condition,
                temperature=self.current_weather.temperature,
                humidity=self.current_weather.humidity,
                wind_speed=self.current_weather.wind_speed,
                rain_probability=self.current_weather.rain_probability,
                track_temperature=self.current_weather.track_temperature,
                grip_level=self.current_weather.grip_level
            )
            
            # Temperature variation throughout the day
            time_factor = math.sin((lap / total_laps) * math.pi) * 0.5 + 0.5
            temperature_change = (random.random() - 0.5) * pattern["temperature_variation"]
            weather.temperature += temperature_change
            weather.track_temperature = weather.temperature + 10.0 + random.uniform(-2, 2)
            
            # Humidity changes
            weather.humidity += (random.random() - 0.5) * 10
            weather.humidity = max(30, min(90, weather.humidity))
            
            # Wind speed variation
            weather.wind_speed += (random.random() - 0.5) * 5
            weather.wind_speed = max(0, min(30, weather.wind_speed))
            
            # Rain probability based on humidity and temperature
            if weather.humidity > 80 and weather.temperature < 20:
                weather.rain_probability = min(0.8, weather.rain_probability + 0.1)
            elif weather.humidity < 50 and weather.temperature > 25:
                weather.rain_probability = max(0.05, weather.rain_probability - 0.05)
            
            # Simulate rain events
            if weather.rain_probability > 0.6 and random.random() < 0.1:
                weather.condition = "wet"
                weather.grip_level = 0.7
                self._add_weather_event(lap, "rain_start", "Rain started", {
                    "grip_reduction": 0.3,
                    "tire_compound_impact": "wet_tires_recommended"
                })
            elif weather.condition == "wet" and weather.rain_probability < 0.3:
                weather.condition = "intermediate"
                weather.grip_level = 0.85
                self._add_weather_event(lap, "rain_stop", "Rain stopped, track drying", {
                    "grip_improvement": 0.15,
                    "tire_compound_impact": "intermediate_tires_recommended"
                })
            
            # Track drying process
            if weather.condition in ["wet", "intermediate"] and weather.rain_probability < 0.2:
                drying_rate = 0.02  # Track dries slowly
                weather.grip_level = min(1.0, weather.grip_level + drying_rate)
                if weather.grip_level > 0.95:
                    weather.condition = "dry"
                    weather.grip_level = 1.0
                    self._add_weather_event(lap, "track_dry", "Track fully dried", {
                        "grip_restoration": 1.0,
                        "tire_compound_impact": "dry_tires_optimal"
                    })
            
            forecast.append(weather)
        
        self.forecast = forecast
        return forecast
    
    def _add_weather_event(self, lap: int, event_type: str, description: str, impact: Dict[str, Any]):
        """Add a weather event to the log"""
        event = WeatherEvent(
            lap=lap,
            event_type=event_type,
            description=description,
            impact=impact
        )
        self.weather_events.append(event)
    
    def get_weather_at_lap(self, lap: int) -> WeatherCondition:
        """Get weather conditions for a specific lap"""
        if lap <= len(self.forecast):
            return self.forecast[lap - 1]
        return self.current_weather
    
    def get_weather_events(self) -> List[WeatherEvent]:
        """Get all weather events that occurred during the race"""
        return self.weather_events
    
    def calculate_tire_performance_impact(self, weather: WeatherCondition, tire_compound: str) -> Dict[str, float]:
        """Calculate how weather affects tire performance"""
        base_performance = {
            "Soft": 1.0,
            "Medium": 0.95,
            "Hard": 0.9,
            "Intermediate": 0.85,
            "Wet": 0.8
        }
        
        # Weather-specific adjustments
        weather_adjustments = {
            "dry": {
                "Soft": 1.0, "Medium": 0.95, "Hard": 0.9, "Intermediate": 0.7, "Wet": 0.5
            },
            "intermediate": {
                "Soft": 0.6, "Medium": 0.7, "Hard": 0.8, "Intermediate": 1.0, "Wet": 0.9
            },
            "wet": {
                "Soft": 0.4, "Medium": 0.5, "Hard": 0.6, "Intermediate": 0.8, "Wet": 1.0
            }
        }
        
        # Temperature impact
        temp_factor = 1.0
        if weather.track_temperature > 40:
            temp_factor = 0.9  # Hot track reduces tire life
        elif weather.track_temperature < 15:
            temp_factor = 0.95  # Cold track slightly reduces grip
        
        # Calculate final performance
        base = base_performance.get(tire_compound, 0.9)
        weather_adj = weather_adjustments[weather.condition].get(tire_compound, 0.8)
        final_performance = base * weather_adj * temp_factor * weather.grip_level
        
        return {
            "performance_multiplier": final_performance,
            "wear_rate_multiplier": 1.0 / final_performance if final_performance > 0 else 2.0,
            "grip_level": weather.grip_level,
            "temperature_factor": temp_factor
        }
    
    def get_wet_dry_line_strategy(self, weather: WeatherCondition) -> Dict[str, Any]:
        """Provide strategy recommendations for wet/dry line racing"""
        if weather.condition == "dry":
            return {
                "recommendation": "Use dry racing line",
                "tire_compound": "Optimal dry compound",
                "risk_level": "low"
            }
        elif weather.condition == "intermediate":
            return {
                "recommendation": "Use intermediate line with dry patches",
                "tire_compound": "Intermediate tires",
                "risk_level": "medium",
                "line_choice": "Mix of wet and dry lines"
            }
        else:  # wet
            return {
                "recommendation": "Use wet racing line",
                "tire_compound": "Wet tires",
                "risk_level": "high",
                "line_choice": "Avoid dry patches, use full wet line"
            }
    
    def get_weather_summary(self) -> Dict[str, Any]:
        """Get a summary of weather conditions during the race"""
        if not self.forecast:
            return {"error": "No weather forecast available"}
        
        conditions_count = {}
        temperature_range = {"min": float('inf'), "max": float('-inf')}
        rain_laps = []
        
        for i, weather in enumerate(self.forecast):
            condition = weather.condition
            conditions_count[condition] = conditions_count.get(condition, 0) + 1
            
            temperature_range["min"] = min(temperature_range["min"], weather.temperature)
            temperature_range["max"] = max(temperature_range["max"], weather.temperature)
            
            if weather.condition in ["wet", "intermediate"]:
                rain_laps.append(i + 1)
        
        return {
            "total_laps": len(self.forecast),
            "conditions_distribution": conditions_count,
            "temperature_range": temperature_range,
            "rain_laps": rain_laps,
            "weather_events": len(self.weather_events),
            "average_humidity": sum(w.humidity for w in self.forecast) / len(self.forecast),
            "average_wind_speed": sum(w.wind_speed for w in self.forecast) / len(self.forecast)
        } 