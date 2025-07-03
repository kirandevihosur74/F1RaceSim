import pytest
import os
from unittest.mock import patch, MagicMock
from api.strategy import get_strategy_recommendation, get_mock_recommendation, analyze_strategy_performance

class TestStrategyRecommendation:
    @pytest.mark.asyncio
    async def test_get_mock_recommendation(self):
        scenario = "Pit stops at laps 15, 35, using Medium → Hard → Soft, driver style: balanced"
        recommendation = get_mock_recommendation(scenario)
        
        assert isinstance(recommendation, str)
        assert len(recommendation) > 0
        assert "tire" in recommendation.lower() or "pit" in recommendation.lower()

    @pytest.mark.asyncio
    async def test_get_mock_recommendation_aggressive_soft(self):
        scenario = "aggressive driver with soft tires"
        recommendation = get_mock_recommendation(scenario)
        
        # Should contain relevant keywords
        assert "aggressive" in recommendation.lower() or "soft" in recommendation.lower()

    @pytest.mark.asyncio
    async def test_get_mock_recommendation_conservative_hard(self):
        scenario = "conservative driver with hard tires"
        recommendation = get_mock_recommendation(scenario)
        
        # Should contain relevant keywords
        assert "conservative" in recommendation.lower() or "hard" in recommendation.lower()

    @pytest.mark.asyncio
    async def test_get_mock_recommendation_wet_conditions(self):
        scenario = "wet weather with intermediate tires"
        recommendation = get_mock_recommendation(scenario)
        
        # Should contain relevant keywords
        assert "wet" in recommendation.lower() or "intermediate" in recommendation.lower()

    @pytest.mark.asyncio
    @patch('api.strategy.openai.api_key', 'test-key')
    @patch('api.strategy.openai.ChatCompletion.acreate')
    async def test_get_strategy_recommendation_with_openai(self, mock_openai):
        # Mock OpenAI response
        mock_response = MagicMock()
        mock_response.choices = [MagicMock()]
        mock_response.choices[0].message.content = "Use Medium tires for optimal performance."
        mock_openai.return_value = mock_response
        
        scenario = "Test scenario"
        recommendation = await get_strategy_recommendation(scenario)
        
        assert recommendation == "Use Medium tires for optimal performance."
        mock_openai.assert_called_once()

    @pytest.mark.asyncio
    @patch('api.strategy.openai.api_key', None)
    async def test_get_strategy_recommendation_fallback_to_mock(self):
        scenario = "Test scenario"
        recommendation = await get_strategy_recommendation(scenario)
        
        # Should fall back to mock recommendation when no API key
        assert isinstance(recommendation, str)
        assert len(recommendation) > 0

    @pytest.mark.asyncio
    @patch('api.strategy.openai.api_key', 'test-key')
    @patch('api.strategy.openai.ChatCompletion.acreate')
    async def test_get_strategy_recommendation_openai_error(self, mock_openai):
        # Mock OpenAI error
        mock_openai.side_effect = Exception("API Error")
        
        scenario = "Test scenario"
        recommendation = await get_strategy_recommendation(scenario)
        
        # Should fall back to mock recommendation on error
        assert isinstance(recommendation, str)
        assert len(recommendation) > 0

    @pytest.mark.asyncio
    @patch('api.strategy.openai.api_key', 'test-key')
    @patch('api.strategy.openai.ChatCompletion.acreate')
    async def test_get_strategy_recommendation_empty_response(self, mock_openai):
        # Mock empty OpenAI response
        mock_response = MagicMock()
        mock_response.choices = [MagicMock()]
        mock_response.choices[0].message.content = ""
        mock_openai.return_value = mock_response
        
        scenario = "Test scenario"
        recommendation = await get_strategy_recommendation(scenario)
        
        # Should fall back to mock recommendation on empty response
        assert isinstance(recommendation, str)
        assert len(recommendation) > 0

class TestStrategyPerformanceAnalysis:
    def test_analyze_strategy_performance_basic(self):
        strategy_data = {
            "tires": ["Medium", "Hard", "Soft"],
            "pit_stops": [15, 35],
            "driver_style": "balanced"
        }
        
        analysis = analyze_strategy_performance(strategy_data)
        
        assert "tire_efficiency" in analysis
        assert "pit_stop_timing" in analysis
        assert "overall_score" in analysis
        assert "recommendations" in analysis
        assert isinstance(analysis["tire_efficiency"], float)
        assert isinstance(analysis["pit_stop_timing"], float)
        assert isinstance(analysis["overall_score"], float)
        assert isinstance(analysis["recommendations"], list)

    def test_analyze_strategy_performance_good_tire_progression(self):
        strategy_data = {
            "tires": ["Soft", "Medium", "Hard"],  # Logical progression
            "pit_stops": [15, 35],
            "driver_style": "balanced"
        }
        
        analysis = analyze_strategy_performance(strategy_data)
        
        # Should have high tire efficiency score
        assert analysis["tire_efficiency"] > 0.5

    def test_analyze_strategy_performance_bad_tire_progression(self):
        strategy_data = {
            "tires": ["Hard", "Soft", "Medium"],  # Illogical progression
            "pit_stops": [15, 35],
            "driver_style": "balanced"
        }
        
        analysis = analyze_strategy_performance(strategy_data)
        
        # Should have low tire efficiency score
        assert analysis["tire_efficiency"] < 0.5

    def test_analyze_strategy_performance_good_pit_timing(self):
        strategy_data = {
            "tires": ["Medium", "Hard", "Soft"],
            "pit_stops": [20, 40],  # Good spacing
            "driver_style": "balanced"
        }
        
        analysis = analyze_strategy_performance(strategy_data)
        
        # Should have high pit stop timing score
        assert analysis["pit_stop_timing"] > 0.5

    def test_analyze_strategy_performance_bad_pit_timing(self):
        strategy_data = {
            "tires": ["Medium", "Hard", "Soft"],
            "pit_stops": [5, 10],  # Too close together
            "driver_style": "balanced"
        }
        
        analysis = analyze_strategy_performance(strategy_data)
        
        # Should have low pit stop timing score
        assert analysis["pit_stop_timing"] < 0.5

    def test_analyze_strategy_performance_aggressive_driver_warning(self):
        strategy_data = {
            "tires": ["Soft", "Medium", "Hard", "Soft"],  # Multiple compounds
            "pit_stops": [15, 30, 45],
            "driver_style": "aggressive"
        }
        
        analysis = analyze_strategy_performance(strategy_data)
        
        # Should have recommendation about aggressive driving
        aggressive_warnings = [rec for rec in analysis["recommendations"] 
                             if "aggressive" in rec.lower()]
        assert len(aggressive_warnings) > 0

    def test_analyze_strategy_performance_no_tires(self):
        strategy_data = {
            "tires": [],
            "pit_stops": [15, 35],
            "driver_style": "balanced"
        }
        
        analysis = analyze_strategy_performance(strategy_data)
        
        # Should handle empty tire list gracefully
        assert analysis["tire_efficiency"] == 0.0

    def test_analyze_strategy_performance_single_tire(self):
        strategy_data = {
            "tires": ["Medium"],
            "pit_stops": [15, 35],
            "driver_style": "balanced"
        }
        
        analysis = analyze_strategy_performance(strategy_data)
        
        # Should handle single tire gracefully
        assert analysis["tire_efficiency"] == 0.0

    def test_analyze_strategy_performance_no_pit_stops(self):
        strategy_data = {
            "tires": ["Medium", "Hard"],
            "pit_stops": [],
            "driver_style": "balanced"
        }
        
        analysis = analyze_strategy_performance(strategy_data)
        
        # Should handle no pit stops gracefully
        assert analysis["pit_stop_timing"] == 0.0

    def test_analyze_strategy_performance_single_pit_stop(self):
        strategy_data = {
            "tires": ["Medium", "Hard"],
            "pit_stops": [30],
            "driver_style": "balanced"
        }
        
        analysis = analyze_strategy_performance(strategy_data)
        
        # Should handle single pit stop gracefully
        assert analysis["pit_stop_timing"] == 0.0

    def test_analyze_strategy_performance_overall_score_calculation(self):
        strategy_data = {
            "tires": ["Soft", "Medium", "Hard"],  # Good progression
            "pit_stops": [20, 40],  # Good spacing
            "driver_style": "balanced"
        }
        
        analysis = analyze_strategy_performance(strategy_data)
        
        # Overall score should be average of tire efficiency and pit stop timing
        expected_score = (analysis["tire_efficiency"] + analysis["pit_stop_timing"]) / 2
        assert abs(analysis["overall_score"] - expected_score) < 0.01

    def test_analyze_strategy_performance_recommendations_generation(self):
        strategy_data = {
            "tires": ["Hard", "Soft"],  # Bad progression
            "pit_stops": [5, 10],  # Bad spacing
            "driver_style": "aggressive"
        }
        
        analysis = analyze_strategy_performance(strategy_data)
        
        # Should generate recommendations for poor performance
        assert len(analysis["recommendations"]) > 0
        
        # Check for specific recommendation types
        tire_recs = [rec for rec in analysis["recommendations"] 
                    if "tire" in rec.lower()]
        pit_recs = [rec for rec in analysis["recommendations"] 
                   if "pit" in rec.lower()]
        aggressive_recs = [rec for rec in analysis["recommendations"] 
                          if "aggressive" in rec.lower()]
        
        assert len(tire_recs) > 0 or len(pit_recs) > 0 or len(aggressive_recs) > 0 