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
        prompt = f"""You are an expert Formula 1 race strategist. Given the following race scenario, provide a concise and actionable strategy recommendation.

Race Scenario: {scenario}

Respond ONLY with a valid JSON object with these exact fields:
{{
  "pit_stop_timing": "Your recommendation for pit stop timing",
  "tire_compound_strategy": "Your recommendation for tire compound selection",
  "driver_approach_adjustments": "Your recommendation for driver style changes",
  "potential_time_savings_or_risks": "Potential time savings or risks of this strategy"
}}

IMPORTANT: 
- Return ONLY the JSON object
- No markdown formatting
- No explanations before or after
- No code blocks
- Ensure valid JSON syntax"""
        print("Gemini prompt:\n", prompt)
        # Call Gemini API
        response = await genai_client.generate_content_async(prompt)
        response_text = response.text.strip()
        print("Gemini raw response:\n", response_text)
        # Clean the response text
        response_text_clean = response_text.strip()
        
        # Remove markdown code fences
        response_text_clean = re.sub(r'^```[a-zA-Z]*\n|```$', '', response_text_clean, flags=re.MULTILINE).strip()
        
        # Remove any text before the first { and after the last }
        start_idx = response_text_clean.find('{')
        end_idx = response_text_clean.rfind('}')
        
        if start_idx != -1 and end_idx != -1 and end_idx > start_idx:
            response_text_clean = response_text_clean[start_idx:end_idx+1]
        
        print("Cleaned Gemini response:\n", response_text_clean)
        
        try:
            recommendation_json = json.loads(response_text_clean)
            
            # Validate that all required fields are present
            required_fields = ["pit_stop_timing", "tire_compound_strategy", "driver_approach_adjustments", "potential_time_savings_or_risks"]
            for field in required_fields:
                if field not in recommendation_json:
                    recommendation_json[field] = ""
                    
        except json.JSONDecodeError as e:
            print("JSON decode error:", e)
            print("Raw response was:", response_text)
            print("Cleaned response was:", response_text_clean)
            
            # If JSON parsing fails, try to extract the recommendation text and structure it
            if response_text_clean and len(response_text_clean) > 10:
                # Use the AI response as the main recommendation
                recommendation_json = {
                    "pit_stop_timing": response_text_clean,
                    "tire_compound_strategy": "Consider the recommended approach based on track conditions",
                    "driver_approach_adjustments": "Monitor tire wear and adjust driving style accordingly", 
                    "potential_time_savings_or_risks": "Potential time savings with proper execution"
                }
            else:
                # Fallback to mock if no useful response
                recommendation_json = {
                    "pit_stop_timing": "Could not parse AI response. Please try again.",
                    "tire_compound_strategy": "",
                    "driver_approach_adjustments": "",
                    "potential_time_savings_or_risks": ""
                }
        # Final safety check - ensure we NEVER return a string
        if not isinstance(recommendation_json, dict):
            print(f"CRITICAL: recommendation_json is not a dict, got {type(recommendation_json)}: {recommendation_json}")
            return get_mock_recommendation(scenario)
        
        print(f"Successfully parsed recommendation: {recommendation_json}")
        return recommendation_json
        
    except Exception as e:
        print(f"Gemini API error: {e}")
        return get_mock_recommendation(scenario)
    
    # Final absolute safety check - this should never happen
    if not isinstance(recommendation_json, dict):
        print(f"ABSOLUTE CRITICAL ERROR: recommendation_json is not a dict: {type(recommendation_json)}")
        print(f"This should never happen! Value: {recommendation_json}")
        return get_mock_recommendation(scenario)
    
    return recommendation_json

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
            "pit_stop_timing": "Consider pitting 2-3 laps earlier than planned to preserve tire performance",
            "tire_compound_strategy": "Switch to Medium compounds for the middle stint to balance speed and durability",
            "driver_approach_adjustments": "Reduce aggression in the first stint to preserve tires for the final push",
            "potential_time_savings_or_risks": "Risk: Premature tire degradation could cost 15-20 seconds. Savings: Better tire management could save 5-10 seconds"
        },
        {
            "keywords": ["conservative", "hard"],
            "pit_stop_timing": "Consider an earlier first pit stop around lap 12-15 to gain track position",
            "tire_compound_strategy": "Switch to Medium compounds for better pace while maintaining tire life",
            "driver_approach_adjustments": "Increase aggression slightly in the middle stint to maximize Medium tire performance",
            "potential_time_savings_or_risks": "Risk: Conservative approach may lose track position. Savings: Better pace could gain 8-12 seconds"
        },
        {
            "keywords": ["balanced", "medium"],
            "pit_stop_timing": "Your pit stop timing looks optimal. Consider moving final stop 2-3 laps earlier",
            "tire_compound_strategy": "Medium-Hard-Soft progression is solid. Consider Soft-Medium-Soft for more pace",
            "driver_approach_adjustments": "Maintain current balanced approach, slightly more aggressive on fresh tires",
            "potential_time_savings_or_risks": "Minor optimization could save 3-5 seconds. Current strategy is well-balanced"
        },
        {
            "keywords": ["wet", "intermediate"],
            "pit_stop_timing": "Extend first stint to build tire temperature, pit when conditions improve",
            "tire_compound_strategy": "Start with Intermediates, switch to fresh Intermediates when track dries",
            "driver_approach_adjustments": "Be patient in first stint to warm tires, then push when conditions improve",
            "potential_time_savings_or_risks": "Risk: Wrong tire choice could cost 20+ seconds. Savings: Proper tire management could save 10-15 seconds"
        },
        {
            "keywords": ["one-stop"],
            "pit_stop_timing": "Target lap 25-30 for your single pit stop to maximize tire life",
            "tire_compound_strategy": "Start Hard, switch to Medium for final stint. Monitor tire wear closely",
            "driver_approach_adjustments": "Conservative start, aggressive middle stint, careful final stint",
            "potential_time_savings_or_risks": "Risk: Tire degradation cliff could cost 30+ seconds. Savings: No pit stop time could save 25 seconds"
        },
        {
            "keywords": ["two-stop"],
            "pit_stop_timing": "Aim for laps 15 and 35 to avoid traffic and maximize tire performance",
            "tire_compound_strategy": "Soft-Medium-Soft for pace, or Medium-Hard-Medium for tire management",
            "driver_approach_adjustments": "Push hard on fresh tires, manage wear in middle stint",
            "potential_time_savings_or_risks": "Risk: Traffic could cost 5-10 seconds. Savings: Fresh tires could gain 8-15 seconds"
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
        selected_rec = random.choice(recommendations)
        return {
            "pit_stop_timing": selected_rec["pit_stop_timing"],
            "tire_compound_strategy": selected_rec["tire_compound_strategy"],
            "driver_approach_adjustments": selected_rec["driver_approach_adjustments"],
            "potential_time_savings_or_risks": selected_rec["potential_time_savings_or_risks"]
        }
    
    return {
        "pit_stop_timing": best_match["pit_stop_timing"],
        "tire_compound_strategy": best_match["tire_compound_strategy"],
        "driver_approach_adjustments": best_match["driver_approach_adjustments"],
        "potential_time_savings_or_risks": best_match["potential_time_savings_or_risks"]
    }

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