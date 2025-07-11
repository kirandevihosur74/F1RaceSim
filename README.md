# F1 Race Strategy Simulator

An AI-powered Formula 1 race strategy simulator for fans and strategists. Plan, simulate, and optimize F1 race strategies with real data, advanced weather, and AI recommendations.

## 🏎️ Features

### Core Simulation
- **Track Selector Carousel**: Modern Swiper.js carousel for intuitive track selection
- **Dynamic Strategy Configuration**: Add, edit, and compare multiple strategies
- **Separate Save & Run**: "Save Strategy" and "Run Simulation" are distinct actions
- **Simulation Results**: Interactive charts powered by React-ApexCharts
- **AI Strategy Recommendations**: Powered by Google Gemini AI (via FastAPI backend)
- **Toast Notifications**: User feedback for actions and errors
- **Clean UI/UX**: Redundant elements removed, full-width charts, and modern layout

### Data & Weather
- **Hybrid Data**: 5 local tracks (Monaco, Silverstone, Spa, Monza, Suzuka) + Ergast API for all circuits
- **Real & Simulated Weather**: OpenWeatherMap API integration, with fallback to simulated weather
- **Weather Impact**: Lap-by-lap forecast, grip, tire degradation, and strategy adjustments

### Multi-Car & Comparison
- **Multi-Car Simulation**: Simulate up to 20 cars with individual strategies
- **Strategy Comparison**: Compare up to 5 strategies, with risk and performance analysis

### AI & Backend
- **FastAPI Backend**: Deployed on AWS Lambda via AWS SAM
- **Gemini AI**: AI-powered strategy recommendations
- **Rate Limiting**: 5 requests/day per endpoint, with admin exemption
- **Robust Error Handling**: Graceful handling of rate limits, timeouts, and backend errors

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Python 3.11+ (for backend)
- AWS Account (for deployment)

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/kirandevihosur74/F1RaceSim.git
cd F1RaceSim
```

2. **Install frontend dependencies**
```bash
npm install
```

3. **Install backend dependencies**
```bash
cd backend
python -m venv venv311
source venv311/bin/activate  # On Windows: venv311\Scripts\activate
pip install -r requirements.txt
```

4. **Set up environment variables**
```bash
cp .env.example .env.local
# Add your API keys (optional)
NEXT_PUBLIC_OPENWEATHER_API_KEY=your_weather_api_key
```

5. **Start the development server**
```bash
# Terminal 1: Frontend
npm run dev

# Terminal 2: Backend
cd backend
python main.py
```

## 🌐 API Integration

- **Ergast API**: F1 data for all circuits
- **OpenWeatherMap API**: Real-time weather (optional)
- **Local Data**: 5 major circuits
- **Hybrid System**: Uses local data first, falls back to API

## 🏁 Usage

1. **Select a Track**
2. **Configure Strategy**: Add/edit pit stops, tires, driver style
3. **Save Strategy**: Save your configuration
4. **Run Simulation**: See results in interactive charts
5. **Get AI Recommendation**: Use Gemini AI for strategy advice
6. **Compare Strategies**: Analyze multiple strategies side-by-side

## 🏗️ Architecture

### Frontend (Next.js)
- **React 18**
- **TypeScript**
- **Tailwind CSS**
- **Zustand** (state management)
- **Swiper.js** (carousel)
- **React-ApexCharts** (visualization)
- **react-hot-toast** (notifications)

### Backend (Python/FastAPI)
- **FastAPI**
- **Google Gemini AI**
- **AWS Lambda** (serverless)
- **Rate Limiting** (slowapi)
- **Admin Exemption** for rate limits

### Data Flow
```
Frontend → Next.js API Routes → FastAPI Backend (AWS Lambda) → Gemini AI & External APIs
```

## 🚀 Deployment

### AWS Deployment
```bash
cd backend
sam build
sam deploy --guided
```

### Frontend Deployment
```bash
npm run build
vercel --prod
```

### Environment Setup
- **AWS Secrets Manager**: Store API keys
- **CORS**: Allow frontend-backend communication
- **API Gateway**: Lambda endpoints

## 📊 Key Components
- **TrackSelector**: Swiper.js carousel for tracks
- **WeatherForecast**: Real/simulated weather, lap-by-lap
- **RaceStrategyForm**: Dynamic, multi-strategy config
- **SimulationResultsChart**: Interactive ApexCharts
- **StrategyRecommendations**: Gemini AI-powered advice
- **StrategyComparison**: Multi-strategy analysis
- **Toast Notifications**: User feedback for all actions

## 🧪 Testing
```bash
# Frontend tests
npm test

# Backend tests
cd backend
python -m pytest
```

## 📈 Performance & UX
- **Hybrid Data Loading**
- **API Rate Limiting**
- **Graceful Error Handling**
- **Modern, Responsive UI**
- **User Feedback via Toasts**

## 🤝 Contributing
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License
MIT License

## 🌟 Mission & Credits
- **Mission:** F1 Race Sim: Smarter Strategy, Better Racing
- **About:** Built for F1 fans & data-driven strategists
- **GitHub:** [View on GitHub](https://github.com/kirandevihosur74/F1RaceSim)
- **AI:** Powered by Google Gemini
- **Data:** Ergast API, OpenWeatherMap
- **© {CURRENT_YEAR} F1 Race Sim 