# F1 Race Strategy Simulator

An AI-powered Formula 1 race strategy simulator with real-time data integration and advanced simulation features.

## 🏎️ Features

### Core Simulation
- **Race Strategy Planning**: Plan pit stops, tire strategies, and driver styles
- **Real-time Simulation**: Dynamic lap-by-lap race simulation
- **AI Strategy Recommendations**: Powered by Google Gemini AI
- **Visual Results**: Interactive charts and race progression

### Real Track Data (Hybrid Approach)
- **5 Local Tracks**: Monaco, Silverstone, Spa, Monza, Suzuka with detailed data
- **API Integration**: Ergast API for all F1 circuits worldwide
- **Automatic Fallback**: Seamless transition between API and local data
- **Track Characteristics**: Circuit length, lap records, weather sensitivity, overtaking difficulty

### Advanced Weather Modeling
- **Real Weather Data**: OpenWeatherMap API integration
- **Simulated Weather**: Track-specific weather patterns when API unavailable
- **Dynamic Forecast**: Lap-by-lap weather changes
- **Weather Impact**: Grip levels, tire degradation, strategy adjustments

### Multi-Car Simulation
- **Multiple Cars**: Simulate up to 20 cars simultaneously
- **Overtaking Logic**: Realistic overtaking based on track difficulty
- **Traffic Management**: Car positioning and gap calculations
- **Individual Strategies**: Different strategies per car

### Strategy Comparison Tool
- **Multiple Strategies**: Compare up to 5 different strategies
- **Risk Analysis**: Probability-based outcome analysis
- **Optimization Suggestions**: AI-powered strategy improvements
- **Performance Metrics**: Detailed comparison of lap times, tire wear, fuel consumption

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- Python 3.11+ (for backend)
- AWS Account (for deployment)

### Installation

1. **Clone the repository**
```bash
git clone <repository-url>
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
# Create .env.local file
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

### Data Sources
- **Jolpi API**: F1 data from Jolpi API (https://api.jolpi.ca/ergast/f1)
- **OpenWeatherMap API**: Real-time weather data (optional)
- **Local Data**: Curated data for 5 major circuits

### Hybrid System
The application uses a smart hybrid approach:
1. **Local Priority**: Known tracks use detailed local data
2. **API Enhancement**: Unknown tracks fetch from Jolpi API
3. **Weather Integration**: Real weather when available, simulated otherwise
4. **Graceful Fallback**: Automatic fallback to local data
5. **Reliable API**: Uses Jolpi API for F1 data

### API Status Indicators
- 🟢 **Green**: Using API data
- 🟡 **Yellow**: Using local/simulated data
- ⚠️ **Warning**: API unavailable, showing fallback status

## 🏁 Usage

### Basic Simulation
1. **Select a Track**: Choose from available F1 circuits
2. **Configure Strategy**: Set pit stops, tires, and driver style
3. **Run Simulation**: Execute the race simulation
4. **Analyze Results**: View lap times, tire wear, and race progression

### Advanced Features
1. **Weather Analysis**: Check weather forecast and impact
2. **Multi-Car Racing**: Simulate multiple cars with different strategies
3. **Strategy Comparison**: Compare multiple strategies side-by-side
4. **AI Recommendations**: Get AI-powered strategy suggestions

## 🏗️ Architecture

### Frontend (Next.js)
- **React 18**: Modern React with hooks
- **TypeScript**: Type-safe development
- **Tailwind CSS**: Utility-first styling
- **Zustand**: State management
- **Chart.js**: Data visualization

### Backend (Python/FastAPI)
- **FastAPI**: High-performance API framework
- **Google Gemini AI**: Strategy recommendations
- **AWS Lambda**: Serverless deployment
- **AWS Secrets Manager**: Secure API key storage

### Data Flow
```
Frontend → Next.js API Routes → Python Backend → External APIs
                ↓
            Zustand Store ← Hybrid Data (Local + API)
```

## 🚀 Deployment

### AWS Deployment
```bash
# Deploy backend to AWS Lambda
cd backend
sam build
sam deploy --guided

# Deploy frontend to Vercel
npm run build
vercel --prod
```

### Environment Setup
1. **AWS Secrets Manager**: Store API keys securely
2. **CORS Configuration**: Allow frontend-backend communication
3. **API Gateway**: Configure Lambda function endpoints

## 📊 Features in Detail

### Track Data
- **Circuit Information**: Length, laps, lap records
- **Sector Analysis**: Individual sector times and characteristics
- **Tire Degradation**: Track-specific tire wear patterns
- **Weather Sensitivity**: How weather affects each track
- **Overtaking Difficulty**: Realistic overtaking simulation

### Weather System
- **Real-time Data**: Current weather conditions
- **Forecast Generation**: Lap-by-lap weather changes
- **Impact Analysis**: How weather affects strategy
- **Track Temperature**: Separate air and track temperatures

### Multi-Car Simulation
- **Car Positioning**: Realistic grid positions
- **Overtaking Logic**: Based on track difficulty and car performance
- **Traffic Management**: Gap calculations and car interactions
- **Individual Strategies**: Different pit strategies per car

### Strategy Comparison
- **Risk Assessment**: Probability-based outcome analysis
- **Performance Metrics**: Detailed lap time analysis
- **Optimization Suggestions**: AI-powered improvements
- **Visual Comparison**: Side-by-side strategy analysis

## 🔧 Development

### Project Structure
```
F1RaceSim/
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   └── globals.css        # Global styles
├── backend/               # Python backend
│   ├── api/              # API modules
│   └── requirements.txt   # Python dependencies
├── components/            # React components
├── store/                # Zustand store
├── lib/                  # Utility libraries
└── docs/                 # Documentation
```

### Key Components
- **TrackSelector**: Track selection with API status
- **WeatherForecast**: Weather visualization and analysis
- **RaceStrategyForm**: Strategy configuration
- **SimulationResultsChart**: Results visualization
- **StrategyComparison**: Multi-strategy analysis

### Testing
```bash
# Frontend tests
npm test

# Backend tests
cd backend
python -m pytest
```

## 📈 Performance

### Optimization Features
- **Hybrid Data Loading**: Smart caching and fallback
- **Lazy Loading**: Components load on demand
- **API Rate Limiting**: Respectful API usage
- **Error Handling**: Graceful degradation

### Data Efficiency
- **Local Caching**: Track data cached in store
- **API Optimization**: Minimal API calls
- **Compression**: Optimized bundle sizes
- **CDN Ready**: Static assets optimized

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🙏 Acknowledgments

- **Jolpi API**: F1 data (https://api.jolpi.ca/ergast/f1)
- **OpenWeatherMap**: Weather data
- **Google Gemini**: AI strategy recommendations
- **F1 Community**: Inspiration and feedback

## 📞 Support

For questions or issues:
1. Check the [documentation](docs/)
2. Review [API setup guide](docs/api-setup.md)
3. Open an issue on GitHub

---

**Built with ❤️ for the F1 community**