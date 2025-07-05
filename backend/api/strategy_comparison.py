from typing import List, Dict, Any, Tuple
from dataclasses import dataclass
import statistics
from .multi_car_simulation import MultiCarSimulator
from .weather_system import WeatherSimulator
from .tracks import track_db

@dataclass
class StrategyComparison:
    strategy_name: str
    total_time: float
    pit_stops: List[int]
    tires: List[str]
    driver_style: str
    final_position: int
    best_lap: float
    average_lap: float
    tire_wear_analysis: Dict[str, Any]
    weather_impact: Dict[str, Any]
    risk_score: float

@dataclass
class ComparisonResult:
    strategies: List[StrategyComparison]
    winner: StrategyComparison
    key_differences: List[Dict[str, Any]]
    optimization_suggestions: List[str]
    risk_analysis: Dict[str, Any]

class StrategyComparator:
    def __init__(self, track_id: str = "silverstone"):
        self.track = track_db.get_track(track_id)
        self.simulator = MultiCarSimulator(track_id)
        self.weather_simulator = WeatherSimulator()
        
    def compare_strategies(self, strategies: List[Dict[str, Any]], 
                          weather: str = "dry", 
                          num_simulations: int = 5) -> ComparisonResult:
        """Compare multiple strategies with multiple simulations"""
        
        comparison_results = []
        
        for strategy in strategies:
            strategy_result = self._evaluate_strategy(strategy, weather, num_simulations)
            comparison_results.append(strategy_result)
        
        # Find winner
        winner = min(comparison_results, key=lambda x: x.total_time)
        
        # Analyze key differences
        key_differences = self._analyze_key_differences(comparison_results)
        
        # Generate optimization suggestions
        optimization_suggestions = self._generate_optimization_suggestions(comparison_results)
        
        # Risk analysis
        risk_analysis = self._analyze_risks(comparison_results)
        
        return ComparisonResult(
            strategies=comparison_results,
            winner=winner,
            key_differences=key_differences,
            optimization_suggestions=optimization_suggestions,
            risk_analysis=risk_analysis
        )
    
    def _evaluate_strategy(self, strategy: Dict[str, Any], weather: str, num_simulations: int) -> StrategyComparison:
        """Evaluate a single strategy with multiple simulations"""
        
        simulation_results = []
        
        for _ in range(num_simulations):
            # Generate weather forecast for this simulation
            weather_forecast = self.weather_simulator.generate_weather_forecast(
                self.track.total_laps, self.track.name.lower().replace(" ", "_")
            )
            
            # Create car config with this strategy
            car_config = {
                "car_id": "TEST",
                "driver_name": "Test Driver",
                "strategy": strategy
            }
            
            # Run simulation
            race_results = self.simulator.simulate_race([car_config], weather)
            
            # Extract key metrics
            total_time = race_results[-1]["cars"][0]["total_time"]
            lap_times = [lap["cars"][0]["lap_time"] for lap in race_results]
            
            simulation_results.append({
                "total_time": total_time,
                "lap_times": lap_times,
                "final_position": race_results[-1]["cars"][0]["position"]
            })
        
        # Calculate average metrics
        avg_total_time = statistics.mean([r["total_time"] for r in simulation_results])
        all_lap_times = [lap for sim in simulation_results for lap in sim["lap_times"]]
        avg_lap = statistics.mean(all_lap_times)
        best_lap = min(all_lap_times)
        
        # Analyze tire wear
        tire_wear_analysis = self._analyze_tire_wear(strategy, weather)
        
        # Analyze weather impact
        weather_impact = self._analyze_weather_impact(strategy, weather)
        
        # Calculate risk score
        risk_score = self._calculate_risk_score(strategy, simulation_results)
        
        return StrategyComparison(
            strategy_name=strategy.get("name", "Strategy"),
            total_time=avg_total_time,
            pit_stops=strategy["pit_stops"],
            tires=strategy["tires"],
            driver_style=strategy["driver_style"],
            final_position=1,  # Single car simulation
            best_lap=best_lap,
            average_lap=avg_lap,
            tire_wear_analysis=tire_wear_analysis,
            weather_impact=weather_impact,
            risk_score=risk_score
        )
    
    def _analyze_tire_wear(self, strategy: Dict[str, Any], weather: str) -> Dict[str, Any]:
        """Analyze tire wear characteristics of a strategy"""
        
        pit_stops = strategy["pit_stops"]
        tires = strategy["tires"]
        
        # Calculate stint lengths
        stint_lengths = []
        for i in range(len(pit_stops) + 1):
            if i == 0:
                stint_lengths.append(pit_stops[0] if pit_stops else self.track.total_laps)
            elif i == len(pit_stops):
                stint_lengths.append(self.track.total_laps - pit_stops[-1])
            else:
                stint_lengths.append(pit_stops[i] - pit_stops[i-1])
        
        # Analyze tire degradation
        tire_analysis = {}
        for i, tire in enumerate(tires):
            if i < len(stint_lengths):
                degradation = self.track.tire_degradation.get(tire, 1.0)
                wear_risk = "high" if degradation > 1.2 else "medium" if degradation > 1.0 else "low"
                
                tire_analysis[tire] = {
                    "stint_length": stint_lengths[i],
                    "degradation_factor": degradation,
                    "wear_risk": wear_risk,
                    "optimal_stint_length": self._calculate_optimal_stint_length(tire, weather)
                }
        
        return {
            "stint_lengths": stint_lengths,
            "tire_analysis": tire_analysis,
            "overall_wear_risk": self._calculate_overall_wear_risk(tire_analysis)
        }
    
    def _calculate_optimal_stint_length(self, tire: str, weather: str) -> int:
        """Calculate optimal stint length for a tire compound"""
        base_lengths = {
            "Soft": 15,
            "Medium": 25,
            "Hard": 35,
            "Intermediate": 20,
            "Wet": 18
        }
        
        weather_multipliers = {
            "dry": 1.0,
            "intermediate": 0.9,
            "wet": 0.8
        }
        
        base_length = base_lengths.get(tire, 20)
        weather_mult = weather_multipliers.get(weather, 1.0)
        
        return int(base_length * weather_mult)
    
    def _calculate_overall_wear_risk(self, tire_analysis: Dict[str, Any]) -> str:
        """Calculate overall tire wear risk for the strategy"""
        high_risk_count = sum(1 for analysis in tire_analysis.values() if analysis["wear_risk"] == "high")
        medium_risk_count = sum(1 for analysis in tire_analysis.values() if analysis["wear_risk"] == "medium")
        
        if high_risk_count > 0:
            return "high"
        elif medium_risk_count > 1:
            return "medium"
        else:
            return "low"
    
    def _analyze_weather_impact(self, strategy: Dict[str, Any], weather: str) -> Dict[str, Any]:
        """Analyze how weather affects the strategy"""
        
        # Get weather forecast
        weather_forecast = self.weather_simulator.generate_weather_forecast(
            self.track.total_laps, self.track.name.lower().replace(" ", "_")
        )
        
        # Count weather events during pit windows
        pit_stops = strategy["pit_stops"]
        weather_events_during_pits = 0
        
        for lap in pit_stops:
            if lap < len(weather_forecast):
                weather_at_lap = weather_forecast[lap - 1]
                if weather_at_lap.condition != "dry":
                    weather_events_during_pits += 1
        
        # Analyze tire compound suitability
        tires = strategy["tires"]
        weather_suitability = {}
        
        for tire in tires:
            performance_impact = self.weather_simulator.calculate_tire_performance_impact(
                weather_forecast[0], tire
            )
            weather_suitability[tire] = {
                "performance_multiplier": performance_impact["performance_multiplier"],
                "suitability": "optimal" if performance_impact["performance_multiplier"] > 0.8 else "suboptimal"
            }
        
        return {
            "weather_events_during_pits": weather_events_during_pits,
            "tire_suitability": weather_suitability,
            "weather_risk": "high" if weather_events_during_pits > 1 else "medium" if weather_events_during_pits > 0 else "low"
        }
    
    def _calculate_risk_score(self, strategy: Dict[str, Any], simulation_results: List[Dict[str, Any]]) -> float:
        """Calculate overall risk score for a strategy"""
        risk_score = 0.0
        
        # Time consistency risk
        total_times = [r["total_time"] for r in simulation_results]
        time_variance = statistics.variance(total_times) if len(total_times) > 1 else 0
        risk_score += min(time_variance / 1000, 0.3)  # Cap at 30%
        
        # Tire wear risk
        tire_analysis = self._analyze_tire_wear(strategy, "dry")
        if tire_analysis["overall_wear_risk"] == "high":
            risk_score += 0.3
        elif tire_analysis["overall_wear_risk"] == "medium":
            risk_score += 0.15
        
        # Strategy complexity risk
        pit_stops = strategy["pit_stops"]
        if len(pit_stops) > 2:
            risk_score += 0.2  # More pit stops = more complexity
        
        # Driver style risk
        if strategy["driver_style"] == "aggressive":
            risk_score += 0.15
        elif strategy["driver_style"] == "conservative":
            risk_score += 0.05
        
        return min(risk_score, 1.0)  # Cap at 100%
    
    def _analyze_key_differences(self, strategies: List[StrategyComparison]) -> List[Dict[str, Any]]:
        """Analyze key differences between strategies"""
        differences = []
        
        if len(strategies) < 2:
            return differences
        
        # Time differences
        times = [s.total_time for s in strategies]
        time_range = max(times) - min(times)
        if time_range > 5.0:  # More than 5 seconds difference
            differences.append({
                "type": "time_difference",
                "description": f"Time difference between fastest and slowest strategy: {time_range:.1f}s",
                "impact": "high" if time_range > 10.0 else "medium"
            })
        
        # Tire strategy differences
        tire_strategies = [s.tires for s in strategies]
        if len(set(str(tire_strategies))) > 1:
            differences.append({
                "type": "tire_strategy",
                "description": "Different tire compound strategies used",
                "impact": "medium"
            })
        
        # Risk differences
        risk_scores = [s.risk_score for s in strategies]
        risk_range = max(risk_scores) - min(risk_scores)
        if risk_range > 0.2:
            differences.append({
                "type": "risk_difference",
                "description": f"Significant risk difference between strategies: {risk_range:.2f}",
                "impact": "medium"
            })
        
        return differences
    
    def _generate_optimization_suggestions(self, strategies: List[StrategyComparison]) -> List[str]:
        """Generate optimization suggestions based on strategy analysis"""
        suggestions = []
        
        # Find best and worst strategies
        best_strategy = min(strategies, key=lambda x: x.total_time)
        worst_strategy = max(strategies, key=lambda x: x.total_time)
        
        # Analyze tire wear
        high_wear_strategies = [s for s in strategies if s.tire_wear_analysis["overall_wear_risk"] == "high"]
        if high_wear_strategies:
            suggestions.append("Consider reducing aggressive tire compounds to minimize wear risk")
        
        # Analyze pit stop timing
        for strategy in strategies:
            pit_stops = strategy.pit_stops
            if len(pit_stops) > 2:
                suggestions.append("Consider reducing number of pit stops to minimize time loss")
        
        # Weather considerations
        weather_sensitive_strategies = [s for s in strategies if s.weather_impact["weather_risk"] == "high"]
        if weather_sensitive_strategies:
            suggestions.append("Include weather-adaptive tire compounds for changing conditions")
        
        # Risk management
        high_risk_strategies = [s for s in strategies if s.risk_score > 0.6]
        if high_risk_strategies:
            suggestions.append("Consider more conservative driver style to reduce risk")
        
        return list(set(suggestions))  # Remove duplicates
    
    def _analyze_risks(self, strategies: List[StrategyComparison]) -> Dict[str, Any]:
        """Analyze risk factors across all strategies"""
        
        risk_factors = {
            "high_risk_strategies": len([s for s in strategies if s.risk_score > 0.6]),
            "medium_risk_strategies": len([s for s in strategies if 0.3 <= s.risk_score <= 0.6]),
            "low_risk_strategies": len([s for s in strategies if s.risk_score < 0.3]),
            "average_risk": statistics.mean([s.risk_score for s in strategies]),
            "risk_distribution": {
                "high": len([s for s in strategies if s.risk_score > 0.6]),
                "medium": len([s for s in strategies if 0.3 <= s.risk_score <= 0.6]),
                "low": len([s for s in strategies if s.risk_score < 0.3])
            }
        }
        
        return risk_factors

def create_sample_strategies() -> List[Dict[str, Any]]:
    """Create sample strategies for comparison testing"""
    return [
        {
            "name": "Aggressive Soft Strategy",
            "pit_stops": [12, 28],
            "tires": ["Soft", "Soft", "Medium"],
            "driver_style": "aggressive"
        },
        {
            "name": "Conservative Hard Strategy",
            "pit_stops": [20, 40],
            "tires": ["Medium", "Hard", "Hard"],
            "driver_style": "conservative"
        },
        {
            "name": "Balanced Strategy",
            "pit_stops": [15, 35],
            "tires": ["Medium", "Hard", "Medium"],
            "driver_style": "balanced"
        },
        {
            "name": "One-Stop Strategy",
            "pit_stops": [25],
            "tires": ["Medium", "Hard"],
            "driver_style": "conservative"
        }
    ] 