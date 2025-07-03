import pytest
from api.simulation import simulate_race, RaceSimulator, TireCompound, DriverStyle

class TestTireCompound:
    def test_tire_compound_creation(self):
        tire = TireCompound("Soft", 1.0, 1.5, 1.2)
        assert tire.name == "Soft"
        assert tire.base_grip == 1.0
        assert tire.wear_rate == 1.5
        assert tire.temperature_sensitivity == 1.2

class TestDriverStyle:
    def test_driver_style_creation(self):
        style = DriverStyle("aggressive", 0.98, 1.3, 0.95)
        assert style.name == "aggressive"
        assert style.pace_multiplier == 0.98
        assert style.tire_wear_multiplier == 1.3
        assert style.fuel_efficiency == 0.95

class TestRaceSimulator:
    def setup_method(self):
        self.simulator = RaceSimulator()

    def test_simulator_initialization(self):
        assert len(self.simulator.tire_compounds) == 5
        assert len(self.simulator.driver_styles) == 3
        assert len(self.simulator.weather_conditions) == 3
        assert self.simulator.base_lap_time == 85.0

    def test_calculate_lap_time_basic(self):
        lap_time = self.simulator.calculate_lap_time(
            lap=1,
            tire_wear=0.0,
            current_tire="Medium",
            driver_style="balanced",
            weather="dry",
            fuel_load=0.0
        )
        
        # Should be close to base lap time with some variation
        assert 80.0 <= lap_time <= 90.0

    def test_calculate_lap_time_with_tire_wear(self):
        lap_time_no_wear = self.simulator.calculate_lap_time(
            lap=1, tire_wear=0.0, current_tire="Medium",
            driver_style="balanced", weather="dry", fuel_load=0.0
        )
        
        lap_time_with_wear = self.simulator.calculate_lap_time(
            lap=1, tire_wear=10.0, current_tire="Medium",
            driver_style="balanced", weather="dry", fuel_load=0.0
        )
        
        # Lap time should increase with tire wear
        assert lap_time_with_wear > lap_time_no_wear

    def test_calculate_lap_time_with_fuel_load(self):
        lap_time_lap_1 = self.simulator.calculate_lap_time(
            lap=1, tire_wear=0.0, current_tire="Medium",
            driver_style="balanced", weather="dry", fuel_load=0.0
        )
        
        lap_time_lap_30 = self.simulator.calculate_lap_time(
            lap=30, tire_wear=0.0, current_tire="Medium",
            driver_style="balanced", weather="dry", fuel_load=30.0
        )
        
        # Lap time should increase with fuel load
        assert lap_time_lap_30 > lap_time_lap_1

    def test_calculate_lap_time_driver_styles(self):
        aggressive_time = self.simulator.calculate_lap_time(
            lap=1, tire_wear=0.0, current_tire="Medium",
            driver_style="aggressive", weather="dry", fuel_load=0.0
        )
        
        conservative_time = self.simulator.calculate_lap_time(
            lap=1, tire_wear=0.0, current_tire="Medium",
            driver_style="conservative", weather="dry", fuel_load=0.0
        )
        
        # Aggressive should be faster than conservative
        assert aggressive_time < conservative_time

    def test_calculate_lap_time_weather_conditions(self):
        dry_time = self.simulator.calculate_lap_time(
            lap=1, tire_wear=0.0, current_tire="Medium",
            driver_style="balanced", weather="dry", fuel_load=0.0
        )
        
        wet_time = self.simulator.calculate_lap_time(
            lap=1, tire_wear=0.0, current_tire="Medium",
            driver_style="balanced", weather="wet", fuel_load=0.0
        )
        
        # Wet conditions should be slower
        assert wet_time > dry_time

    def test_calculate_tire_wear(self):
        initial_wear = 5.0
        new_wear = self.simulator.calculate_tire_wear(
            initial_wear, "Soft", "aggressive", "dry"
        )
        
        # Wear should increase
        assert new_wear > initial_wear

    def test_calculate_tire_wear_different_compounds(self):
        soft_wear = self.simulator.calculate_tire_wear(
            0.0, "Soft", "balanced", "dry"
        )
        
        hard_wear = self.simulator.calculate_tire_wear(
            0.0, "Hard", "balanced", "dry"
        )
        
        # Soft tires should wear faster than hard tires
        assert soft_wear > hard_wear

    def test_calculate_tire_wear_driver_styles(self):
        aggressive_wear = self.simulator.calculate_tire_wear(
            0.0, "Medium", "aggressive", "dry"
        )
        
        conservative_wear = self.simulator.calculate_tire_wear(
            0.0, "Medium", "conservative", "dry"
        )
        
        # Aggressive driving should cause more wear
        assert aggressive_wear > conservative_wear

class TestSimulateRace:
    def test_simulate_race_basic(self):
        strategy = {
            "pit_stops": [15, 35],
            "tires": ["Medium", "Hard", "Soft"],
            "driver_style": "balanced"
        }
        
        results = simulate_race(strategy, "dry")
        
        assert len(results) == 58  # Total laps
        assert all("lap" in result for result in results)
        assert all("lap_time" in result for result in results)
        assert all("tire_wear" in result for result in results)

    def test_simulate_race_with_pit_stops(self):
        strategy = {
            "pit_stops": [20],
            "tires": ["Medium", "Hard"],
            "driver_style": "balanced"
        }
        
        results = simulate_race(strategy, "dry")
        
        # Check that tire wear resets at pit stop
        lap_19_wear = results[18]["tire_wear"]  # Lap 19 (index 18)
        lap_20_wear = results[19]["tire_wear"]  # Lap 20 (index 19)
        
        assert lap_20_wear < lap_19_wear  # Wear should reset at pit stop

    def test_simulate_race_different_weather(self):
        strategy = {
            "pit_stops": [15, 35],
            "tires": ["Medium", "Hard", "Soft"],
            "driver_style": "balanced"
        }
        
        dry_results = simulate_race(strategy, "dry")
        wet_results = simulate_race(strategy, "wet")
        
        # Wet conditions should result in slower lap times
        dry_avg_time = sum(r["lap_time"] for r in dry_results) / len(dry_results)
        wet_avg_time = sum(r["lap_time"] for r in wet_results) / len(wet_results)
        
        assert wet_avg_time > dry_avg_time

    def test_simulate_race_different_driver_styles(self):
        strategy = {
            "pit_stops": [15, 35],
            "tires": ["Medium", "Hard", "Soft"],
            "driver_style": "balanced"
        }
        
        balanced_results = simulate_race(strategy, "dry")
        
        strategy["driver_style"] = "aggressive"
        aggressive_results = simulate_race(strategy, "dry")
        
        # Aggressive should be faster on average
        balanced_avg_time = sum(r["lap_time"] for r in balanced_results) / len(balanced_results)
        aggressive_avg_time = sum(r["lap_time"] for r in aggressive_results) / len(aggressive_results)
        
        assert aggressive_avg_time < balanced_avg_time

    def test_simulate_race_tire_progression(self):
        strategy = {
            "pit_stops": [15, 35],
            "tires": ["Soft", "Medium", "Hard"],
            "driver_style": "balanced"
        }
        
        results = simulate_race(strategy, "dry")
        
        # Check that lap times increase over time due to tire wear
        early_laps = results[:10]
        late_laps = results[45:55]
        
        early_avg = sum(r["lap_time"] for r in early_laps) / len(early_laps)
        late_avg = sum(r["lap_time"] for r in late_laps) / len(late_laps)
        
        # Later laps should be slower due to tire wear
        assert late_avg > early_avg

    def test_simulate_race_edge_cases(self):
        # Test with no pit stops
        strategy = {
            "pit_stops": [],
            "tires": ["Hard"],
            "driver_style": "conservative"
        }
        
        results = simulate_race(strategy, "dry")
        assert len(results) == 58
        
        # Test with single pit stop
        strategy = {
            "pit_stops": [30],
            "tires": ["Medium", "Hard"],
            "driver_style": "balanced"
        }
        
        results = simulate_race(strategy, "dry")
        assert len(results) == 58

    def test_simulate_race_data_structure(self):
        strategy = {
            "pit_stops": [15, 35],
            "tires": ["Medium", "Hard", "Soft"],
            "driver_style": "balanced"
        }
        
        results = simulate_race(strategy, "dry")
        
        for i, result in enumerate(results):
            assert result["lap"] == i + 1
            assert isinstance(result["lap_time"], (int, float))
            assert isinstance(result["tire_wear"], (int, float))
            assert result["lap_time"] > 0
            assert result["tire_wear"] >= 0
            assert "position" in result
            assert "fuel_load" in result 