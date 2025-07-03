import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { scenario } = body
    
    // In development, we'll return mock recommendations
    // In production, this would call OpenAI GPT-4o
    const recommendation = generateMockRecommendation(scenario)
    
    return NextResponse.json({
      status: 'success',
      recommendation
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to get strategy recommendation' },
      { status: 500 }
    )
  }
}

function generateMockRecommendation(scenario: string): string {
  const recommendations = [
    "Based on your strategy, consider moving the first pit stop 2-3 laps earlier to avoid heavy tire degradation. The Medium-Hard-Soft combination looks optimal for current conditions.",
    "Your pit stop timing is well-placed. However, consider using the Soft compound for the final stint to maximize overtaking opportunities in the closing laps.",
    "The aggressive driver style with your current tire strategy may lead to premature tire wear. Consider a more conservative approach in the middle stint to preserve tires.",
    "Your strategy shows good balance. The Medium-Hard-Soft progression should work well, but monitor tire wear closely around lap 30-35 for optimal pit timing.",
    "Consider a one-stop strategy with Hard-Medium compounds for better tire management and fewer pit stop risks. This could save 15-20 seconds total race time."
  ]
  
  // Return a random recommendation for demo purposes
  return recommendations[Math.floor(Math.random() * recommendations.length)]
}

// Production OpenAI integration function (commented out for development)
/*
async function getOpenAIRecommendation(scenario: string): Promise<string> {
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  })

  const prompt = `Given the F1 race scenario: ${scenario}, provide a concise strategy recommendation focusing on:
  1. Optimal pit stop timing
  2. Tire compound selection
  3. Driver approach adjustments
  4. Potential time savings or risks
  
  Keep the response under 200 words and focus on actionable advice.`

  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      {
        role: "user",
        content: prompt
      }
    ],
    max_tokens: 300,
    temperature: 0.7
  })

  return response.choices[0].message.content || "Unable to generate recommendation"
}
*/ 