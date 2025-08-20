# F1 Race Strategy Simulator

A Formula 1 race strategy simulator that helps you plan, simulate, and optimize race strategies with real data, weather conditions, and AI recommendations.

**Live Demo:** [https://f1-race-sim.vercel.app](https://f1-race-sim.vercel.app)

---

## Getting Started

1. **Choose a Track** - Pick from the available F1 circuits
2. **Build Your Strategy** - Set pit stop laps, tire compounds, and driving style
3. **Save & Run** - Save your strategy and run the simulation
4. **Get AI Tips** - Receive strategy recommendations from AI
5. **Compare Results** - Test multiple strategies side by side
6. **Check Weather** - See how weather affects your race

**Note:** API rate limits apply. Contact @kirandevihosur74@gmail.com if you need help.

---

## What It Does

- **Track Selection** - Modern carousel for circuit selection
- **Strategy Builder** - Create and edit multiple strategies
- **Race Simulation** - Run races and view detailed results
- **AI Recommendations** - Get strategy advice from Google Gemini
- **Weather Integration** - Real weather data with fallback simulation
- **Multi-Car Racing** - Simulate up to 20 cars
- **Strategy Comparison** - Compare up to 5 strategies
- **Interactive Charts** - Visualize results with ApexCharts

## Setup

### Prerequisites
- Node.js 18+
- Python 3.11+ (backend)
- AWS Account (deployment)

### Installation

1. **Clone and setup**
```bash
git clone https://github.com/kirandevihosur74/F1RaceSim.git
cd F1RaceSim
npm install
```

2. **Backend setup**
```bash
cd backend
python -m venv venv311
source venv311/bin/activate  # Windows: venv311\Scripts\activate
pip install -r requirements.txt
```

3. **Environment**
```bash
cp .env.example .env.local
# Add your API keys (optional)
NEXT_PUBLIC_OPENWEATHER_API_KEY=your_weather_api_key
```

4. **Run development servers**
```bash
# Terminal 1: Frontend
npm run dev

# Terminal 2: Backend
cd backend
python main.py
```

## APIs

- **Ergast API** - F1 circuit data
- **OpenWeatherMap API** - Real-time weather

## How It Works

1. Select a track from the carousel
2. Configure your strategy (pit stops, tires, driver style)
3. Save and run the simulation
4. Get AI recommendations
5. Compare different strategies

## Architecture

### Frontend
- React 18 + TypeScript
- Tailwind CSS
- Zustand state management
- Swiper.js carousel
- ApexCharts visualization

### Backend
- FastAPI with Python
- Google Gemini AI
- AWS Lambda deployment
- Rate limiting (3 requests/day per endpoint)

### Data Flow
```
Frontend → Next.js API Routes → FastAPI Backend → Gemini AI & External APIs
```

## Deployment

### Backend (AWS)
```bash
cd backend
sam build
sam deploy --guided
```

### Frontend (Vercel)
```bash
npm run build
vercel --prod
```

## Testing

```bash
# Frontend tests
npm test

# Backend tests
cd backend
python -m pytest
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if needed
5. Submit a pull request
