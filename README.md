# F1 Race Strategy Simulator

AI-powered Formula 1 race strategy simulator. Plan, simulate, and optimize F1 race strategies with real data, weather, and AI recommendations.

**Live Demo:** [https://f1-race-sim.vercel.app](https://f1-race-sim.vercel.app)

---

## How to Use

1. **Pick a Track**
   - Use the carousel to select a Formula 1 circuit
2. **Set Up Strategy**
   - Choose pit stop laps, tire compounds for each stint, and driver style
   - Add or remove pit stops and tires as needed
   - Name your strategy
3. **Save Strategy**
   - Click "Save Strategy" to store your config
4. **Run Simulation**
   - Click "Run Simulation" to see results
   - View charts showing lap times, tire wear, and race progress
5. **Get AI Advice**
   - Click "Get AI Strategy Recommendation" for expert tips
6. **Compare Strategies**
   - Add multiple strategies and compare performance
7. **Check Weather**
   - See real or simulated weather data and its impact

**Note: There's a rate limit on APIs. If you hit it, try again later or contact @kirandevihosur74@gmail.com**

---

## Features

- **Track Selection**: Modern carousel for picking circuits
- **Strategy Builder**: Create and edit multiple strategies
- **Simulation Engine**: Run races and see results
- **AI Recommendations**: Get strategy advice from Google Gemini
- **Weather System**: Real weather data with fallback simulation
- **Multi-Car Racing**: Simulate up to 20 cars
- **Strategy Comparison**: Compare up to 5 strategies side-by-side
- **Interactive Charts**: Visualize results with ApexCharts

## Quick Start

### Requirements
- Node.js 18+
- Python 3.11+ (for backend)
- AWS Account (for deployment)

### Setup

1. **Clone the repo**
```bash
git clone https://github.com/kirandevihosur74/F1RaceSim.git
cd F1RaceSim
```

2. **Install frontend deps**
```bash
npm install
```

3. **Install backend deps**
```bash
cd backend
python -m venv venv311
source venv311/bin/activate  # Windows: venv311\Scripts\activate
pip install -r requirements.txt
```

4. **Environment setup**
```bash
cp .env.example .env.local
# Add your API keys (optional)
NEXT_PUBLIC_OPENWEATHER_API_KEY=your_weather_api_key
```

5. **Start dev servers**
```bash
# Terminal 1: Frontend
npm run dev

# Terminal 2: Backend
cd backend
python main.py
```

## APIs Used

- **Ergast API**: F1 circuit data
- **OpenWeatherMap API**: Real-time weather

## Usage

1. Pick a track from the carousel
2. Configure your strategy (pit stops, tires, driver style)
3. Save your strategy
4. Run the simulation
5. Get AI recommendations
6. Compare multiple strategies

## Architecture

### Frontend
- React 18 + TypeScript
- Tailwind CSS for styling
- Zustand for state management
- Swiper.js for track carousel
- ApexCharts for data visualization

### Backend
- FastAPI with Python
- Google Gemini AI integration
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

1. Fork the repo
2. Create a feature branch
3. Make your changes
4. Add tests if needed
5. Submit a pull request
