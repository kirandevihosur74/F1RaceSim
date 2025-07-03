import os
import random
from typing import Optional
import google.generativeai as genai
# from dotenv import load_dotenv
import json
import re

# Load environment variables
# load_dotenv()

# Initialize Gemini client
api_key = os.getenv("GEMINI_API_KEY")
genai_client = genai.GenerativeModel('gemini-1.5-flash') if api_key else None
if api_key:
    genai.configure(api_key=api_key)

async def get_strategy_recommendation(scenario: str) -> dict:
    """
    Get AI-generated strategy recommendations using OpenAI GPT-4o.
    
    Args:
        scenario: Description of the race scenario and current strategy
    
    Returns:
        AI-generated strategy recommendation as a JSON object
    """
    
    # Check if Gemini API key is available
    if not genai_client:
        return get_mock_recommendation(scenario)
    
    try:
        # Create the prompt for the AI
        prompt = f"""You are an expert Formula 1 race strategist. Given the following race scenario, provide a concise and actionable strategy recommendation.\n\nRace Scenario: {scenario}\n\nRespond ONLY with a valid JSON object with these fields:\n{{\n  \"pit_stop_timing\": \"...\",\n  \"tire_compound_strategy\": \"...\",\n  \"driver_approach_adjustments\": \"...\",\n  \"potential_time_savings_or_risks\": \"...\"\n}}\nDo not include any explanation, markdown, or text outside the JSON object."""
        print("Gemini prompt:\n", prompt)
        # Call Gemini API
        response = await genai_client.generate_content_async(prompt)
        response_text = response.text.strip()
        print("Gemini raw response:\n", response_text)
        # Remove Markdown code fences if present
        response_text_clean = re.sub(r'^```[a-zA-Z]*\n|```$', '', response_text.strip(), flags=re.MULTILINE).strip()
        print("Cleaned Gemini response:\n", response_text_clean)
        try:
            recommendation_json = json.loads(response_text_clean)
        except json.JSONDecodeError as e:
            print("JSON decode error:", e)
            recommendation_json = {
                "pit_stop_timing": "Could not parse AI response.",
                "tire_compound_strategy": "",
                "driver_approach_adjustments": "",
                "potential_time_savings_or_risks": ""
            }
        return recommendation_json if recommendation_json else get_mock_recommendation(scenario)
        
    except Exception as e:
        print(f"OpenAI API error: {e}")
        return get_mock_recommendation(scenario)

def get_mock_recommendation(scenario: str) -> dict:
    """
    Generate mock strategy recommendations for development/testing.
    
    Args:
        scenario: Description of the race scenario
    
    Returns:
        Mock strategy recommendation as a JSON object
    """
    
    # Parse scenario to extract key information
    scenario_lower = scenario.lower()
    
    # Define recommendation templates based on scenario characteristics
    recommendations = [
        {
            "keywords": ["aggressive", "soft"],
            "recommendation": "Your aggressive approach with Soft compounds may lead to premature tire degradation. Consider a more conservative middle stint with Medium tires to preserve performance for the final push. Monitor tire wear closely around lap 25-30."
        },
        {
            "keywords": ["conservative", "hard"],
            "recommendation": "The conservative approach with Hard compounds provides good tire management but may cost you track position. Consider an earlier pit stop to switch to Medium compounds for better pace while maintaining reasonable tire life."
        },
        {
            "keywords": ["balanced", "medium"],
            "recommendation": "Your balanced strategy looks well-placed. The Medium-Hard-Soft progression should work effectively. Consider moving the final pit stop 2-3 laps earlier to maximize the Soft compound's performance advantage in the closing laps."
        },
        {
            "keywords": ["wet", "intermediate"],
            "recommendation": "In wet conditions, prioritize tire temperature management. The Intermediate compounds need proper warm-up. Consider a longer first stint to build tire temperature, then switch to fresh Intermediates when conditions improve slightly."
        },
        {
            "keywords": ["one-stop"],
            "recommendation": "A one-stop strategy can be effective but requires careful tire management. Start with Hard compounds, push hard in the middle stint, then switch to Medium for the final push. Monitor tire wear closely to avoid performance cliff."
        },
        {
            "keywords": ["two-stop"],
            "recommendation": "Two-stop strategy provides flexibility for changing conditions. Consider using Soft-Medium-Soft if track position is crucial, or Medium-Hard-Medium for better tire management. Time your pit stops to avoid traffic."
        }
    ]
    
    # Find the best matching recommendation
    best_match = recommendations[0]  # Default
    max_matches = 0
    
    for rec in recommendations:
        matches = sum(1 for keyword in rec["keywords"] if keyword in scenario_lower)
        if matches > max_matches:
            max_matches = matches
            best_match = rec
    
    # Add some randomization for variety
    if random.random() < 0.3:
        return random.choice(recommendations)["recommendation"]
    
    return best_match["recommendation"]

def analyze_strategy_performance(strategy_data: dict) -> dict:
    """
    Analyze strategy performance and provide insights.
    
    Args:
        strategy_data: Dictionary containing strategy parameters and results
    
    Returns:
        Dictionary with analysis results
    """
    
    analysis = {
        "tire_efficiency": 0.0,
        "pit_stop_timing": 0.0,
        "overall_score": 0.0,
        "recommendations": []
    }
    
    # Analyze tire strategy
    tires = strategy_data.get("tires", [])
    if len(tires) >= 2:
        # Check for logical tire progression
        tire_hardness = {"Soft": 1, "Medium": 2, "Hard": 3, "Intermediate": 2, "Wet": 1}
        progression_score = 0
        
        for i in range(len(tires) - 1):
            current = tire_hardness.get(tires[i], 2)
            next_tire = tire_hardness.get(tires[i + 1], 2)
            if next_tire >= current:  # Logical progression
                progression_score += 1
        
        analysis["tire_efficiency"] = progression_score / max(1, len(tires) - 1)
    
    # Analyze pit stop timing
    pit_stops = strategy_data.get("pit_stops", [])
    if len(pit_stops) >= 2:
        # Check for reasonable spacing between pit stops
        spacing_score = 0
        for i in range(len(pit_stops) - 1):
            spacing = pit_stops[i + 1] - pit_stops[i]
            if 15 <= spacing <= 25:  # Optimal spacing
                spacing_score += 1
        
        analysis["pit_stop_timing"] = spacing_score / max(1, len(pit_stops) - 1)
    
    # Calculate overall score
    analysis["overall_score"] = (analysis["tire_efficiency"] + analysis["pit_stop_timing"]) / 2
    
    # Generate specific recommendations
    if analysis["tire_efficiency"] < 0.5:
        analysis["recommendations"].append("Consider more logical tire compound progression")
    
    if analysis["pit_stop_timing"] < 0.5:
        analysis["recommendations"].append("Optimize pit stop spacing for better tire management")
    
    if strategy_data.get("driver_style") == "aggressive" and len(tires) > 2:
        analysis["recommendations"].append("Aggressive driving with multiple compounds may lead to high tire wear")
    
    return analysis 