# F1 Race Strategy Simulator

A Formula 1 race strategy simulator that helps you plan, simulate, and optimize race strategies with real data, weather conditions, and AI recommendations.

**Live Demo:** [https://f1-race-sim.vercel.app](https://f1-race-sim.vercel.app)

---

## Getting Started

1. **Choose a Track** - Pick from the available F1 circuits
2. **Sign In** - Use Google authentication to access all features
3. **Build Your Strategy** - Set pit stop laps, tire compounds, and driving style
4. **Save & Run** - Save your strategy and run the simulation
5. **Get AI Tips** - Receive strategy recommendations from AI
6. **Compare Results** - Test multiple strategies side by side
7. **Check Weather** - See how weather affects your race

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
- **User Authentication** - Secure Google Sign-In with NextAuth.js

## Setup

### Prerequisites
- Node.js 18+
- Python 3.11+ (backend)
- AWS Account (deployment)
- Google Cloud Account (OAuth credentials)

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

3. **Environment setup**
```bash
cp env.example .env.local
# Add your API keys and NextAuth.js configuration
GOOGLE_CLIENT_ID=your_google_client_id
NEXTAUTH_SECRET=your_nextauth_secret
NEXT_PUBLIC_OPENWEATHER_API_KEY=your_weather_api_key
```

4. **Google OAuth setup**
- Create Google OAuth credentials
- Add redirect URIs for development and production
- See [NextAuth.js Setup Guide](docs/nextauth-setup.md) for detailed instructions

5. **Start dev servers**
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
- **NextAuth.js** - Google authentication

## How It Works

1. Sign in with your Google account
2. Select a track from the carousel
3. Configure your strategy (pit stops, tires, driver style)
4. Save and run the simulation
5. Get AI recommendations
6. Compare different strategies

## Architecture

### Frontend
- React 18 + TypeScript
- Tailwind CSS
- Zustand state management
- Swiper.js carousel
- ApexCharts visualization
- NextAuth.js authentication

### Backend
- FastAPI with Python
- Google Gemini AI
- AWS Lambda deployment
- Rate limiting (3 requests/day per endpoint)

### Authentication
- NextAuth.js with Google OAuth
- Protected routes for core features
- User session management

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

### NextAuth.js
- Configure OAuth redirect URIs in Google Cloud Console
- Update environment variables in Vercel
- Test authentication flow

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

## Documentation

- [API Setup Guide](docs/api-setup.md)
- [AWS Setup Guide](docs/aws-setup.md)
- [NextAuth.js Setup Guide](docs/nextauth-setup.md)
- [Testing Guide](TESTING.md)
