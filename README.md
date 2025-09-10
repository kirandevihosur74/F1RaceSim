# F1 Race Strategy Simulator

A comprehensive Formula 1 race strategy simulator that helps you plan, simulate, and optimize race strategies with real data, weather conditions, AI recommendations, and advanced analytics.

**Live Demo:** [https://f1-race-sim.vercel.app](https://f1-race-sim.vercel.app)

---

## 🚀 Features

### Core Functionality
- **Track Selection** - Choose from 23+ F1 circuits with real data
- **Strategy Builder** - Create and edit multiple race strategies
- **Race Simulation** - Run detailed simulations with realistic results
- **AI Recommendations** - Get strategy advice from Google Gemini AI
- **Weather Integration** - Real-time weather data with fallback simulation
- **Multi-Car Racing** - Simulate up to 20 cars with overtaking events
- **Strategy Comparison** - Compare up to 5 strategies side by side
- **Interactive Charts** - Visualize results with ApexCharts and Recharts

### User Management & Analytics
- **Google Authentication** - Secure sign-in with NextAuth.js
- **Usage Tracking** - Monitor daily usage across all features
- **Plan Management** - Free, Pro, and Business tier support
- **Waitlist System** - Join waitlist for premium plans
- **Admin Dashboard** - Comprehensive user and system analytics
- **PDF Reports** - Generate detailed simulation reports

### Advanced Features
- **Real-time Weather** - Track conditions and grip levels
- **Tire Strategy** - Multiple compounds with degradation modeling
- **Pit Stop Optimization** - Strategic timing and tire changes
- **Driver Styles** - Aggressive, Balanced, and Conservative options
- **Risk Analysis** - Comprehensive strategy risk assessment
- **Performance Metrics** - Lap times, fuel consumption, position tracking

---

## 🎯 Getting Started

1. **Choose a Track** - Pick from available F1 circuits
2. **Sign In** - Use Google authentication to access all features
3. **Build Your Strategy** - Set pit stop laps, tire compounds, and driving style
4. **Save & Run** - Save your strategy and run the simulation
5. **Get AI Tips** - Receive strategy recommendations from AI
6. **Compare Results** - Test multiple strategies side by side
7. **Check Weather** - See how weather affects your race

**Note:** Free plan includes 3 daily simulations. Upgrade to Pro for unlimited access.

---

## 🏗️ Architecture

### Frontend Stack
- **React 18** + **TypeScript** - Modern component architecture
- **Next.js 14** - Full-stack React framework with API routes
- **Tailwind CSS** - Utility-first styling with dark mode support
- **Zustand** - Lightweight state management
- **FontAwesome** - Professional icon library
- **ApexCharts** + **Recharts** - Interactive data visualization
- **NextAuth.js** - Secure authentication with Google OAuth

### Backend & Infrastructure
- **FastAPI** - High-performance Python API
- **AWS DynamoDB** - NoSQL database for user data and usage tracking
- **AWS Lambda** - Serverless function deployment
- **Google Gemini AI** - Advanced strategy recommendations
- **OpenWeatherMap API** - Real-time weather data
- **Ergast API** - F1 circuit and race data

### Data Management
- **User Profiles** - Comprehensive user data storage
- **Usage Tracking** - Daily limits and feature monitoring
- **Plan Management** - Subscription and billing integration
- **Waitlist System** - Premium plan pre-registration
- **Admin Analytics** - System health and user insights

---

## 🛠️ Setup & Installation

### Prerequisites
- **Node.js 18+** - Frontend development
- **Python 3.11+** - Backend API
- **AWS Account** - Database and deployment
- **Google Cloud Account** - OAuth credentials

### Quick Start

1. **Clone and Install**
```bash
git clone https://github.com/kirandevihosur74/F1RaceSim.git
cd F1RaceSim
npm install
```

2. **Backend Setup**
```bash
cd backend
python -m venv venv311
source venv311/bin/activate  # Windows: venv311\Scripts\activate
pip install -r requirements.txt
```

3. **Environment Configuration**
```bash
cp env.example .env.local
```

Add your configuration:
```bash
# NextAuth.js Configuration
NEXTAUTH_SECRET=your-nextauth-secret-here
NEXTAUTH_URL=http://localhost:3000

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# AWS Configuration
AWS_REGION=us-west-1
AWS_ACCESS_KEY_ID=your-aws-access-key-id
AWS_SECRET_ACCESS_KEY=your-aws-secret-access-key

# DynamoDB Configuration
METADATA_TABLE=f1-strategy-metadata-dev

# API Keys
F1_API_KEY=your-f1-api-key
OPENWEATHER_API_KEY=your-openweather-api-key
```

4. **Google OAuth Setup**
- Create Google OAuth credentials in [Google Cloud Console](https://console.cloud.google.com/)
- Add authorized redirect URIs:
  - `http://localhost:3000/api/auth/callback/google` (development)
  - `https://yourdomain.com/api/auth/callback/google` (production)
- See [NextAuth.js Setup Guide](docs/nextauth-setup.md) for detailed instructions

5. **Start Development Servers**
```bash
# Terminal 1: Frontend
npm run dev

# Terminal 2: Backend
cd backend
python main.py
```

Visit `http://localhost:3000` to see the application.

---

## 📊 Plan Features & Limits

### Free Plan
- ✅ 3 simulations per day
- ✅ 5 saved strategies
- ✅ 1 AI recommendation per day
- ✅ Basic weather data
- ✅ Strategy comparison (2 strategies)

### Pro Plan (Waitlist)
- ✅ Unlimited simulations
- ✅ 50 saved strategies
- ✅ Unlimited AI recommendations
- ✅ Advanced weather analytics
- ✅ Strategy comparison (5 strategies)
- ✅ PDF report generation
- ✅ Priority support

### Business Plan (Waitlist)
- ✅ Everything in Pro
- ✅ Unlimited strategies
- ✅ Team collaboration
- ✅ Advanced analytics
- ✅ API access
- ✅ Custom integrations

---

## 🚀 Deployment

### Frontend (Vercel)
```bash
npm run build
vercel --prod
```

### Backend (AWS Lambda)
```bash
cd backend
sam build
sam deploy --guided
```

### Environment Variables
Configure these in your deployment platform:
- `NEXTAUTH_SECRET` - Secure random string
- `NEXTAUTH_URL` - Your production domain
- `GOOGLE_CLIENT_ID` - Google OAuth client ID
- `GOOGLE_CLIENT_SECRET` - Google OAuth client secret
- `AWS_ACCESS_KEY_ID` - AWS credentials
- `AWS_SECRET_ACCESS_KEY` - AWS credentials
- `METADATA_TABLE` - DynamoDB table name

---

## 🧪 Testing

### Frontend Tests
```bash
# Run all tests
npm test

# Watch mode
npm run test:watch

# Coverage report
npm run test:coverage

# E2E tests
npm run test:e2e
```

### Backend Tests
```bash
cd backend
python -m pytest
```

---

## 📁 Project Structure

```
F1RaceSim/
├── app/                    # Next.js 14 app directory
│   ├── api/               # API routes
│   │   ├── auth/          # Authentication endpoints
│   │   ├── users/         # User management
│   │   ├── admin/         # Admin dashboard APIs
│   │   └── simulate-race/ # Simulation endpoints
│   ├── admin/             # Admin dashboard pages
│   ├── pricing/           # Pricing page
│   └── docs/              # Documentation pages
├── components/            # React components
│   ├── ui/               # Reusable UI components
│   └── *.tsx             # Feature components
├── lib/                  # Utility libraries
│   ├── hooks/            # Custom React hooks
│   ├── auth.ts           # NextAuth configuration
│   ├── dynamodb.ts       # Database utilities
│   ├── pricing.ts        # Plan management
│   └── usageTracking.ts  # Usage monitoring
├── store/                # Zustand state management
├── backend/              # Python FastAPI backend
├── docs/                 # Documentation
└── infra/                # AWS infrastructure
```

---

## 🔧 API Endpoints

### Authentication
- `POST /api/auth/[...nextauth]` - Google OAuth flow

### User Management
- `GET /api/users/usage` - Get user usage statistics
- `POST /api/users/usage` - Track feature usage
- `POST /api/users/waitlist` - Join premium waitlist
- `GET /api/users/plan` - Get user subscription plan

### Simulations
- `POST /api/simulate-race` - Run race simulation
- `POST /api/strategy-comparison` - Compare strategies
- `POST /api/strategy-recommendation` - Get AI recommendations

### Admin
- `GET /api/admin/users` - User analytics
- `GET /api/admin/system-health` - System status

---

## 📚 Documentation

- [API Setup Guide](docs/api-setup.md) - Backend API configuration
- [AWS Setup Guide](docs/aws-setup.md) - AWS infrastructure setup
- [NextAuth.js Setup Guide](docs/nextauth-setup.md) - Authentication setup
- [Database Schema](docs/database-schema.md) - Database structure
- [DynamoDB Schema](docs/dynamodb-schema.md) - NoSQL table design
- [Usage Tracking](docs/usage-tracking-implementation.md) - Feature monitoring
- [Admin Dashboard Setup](docs/admin-dashboard-setup.md) - Admin panel configuration

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines
- Follow TypeScript best practices
- Write tests for new features
- Update documentation for API changes
- Use conventional commit messages
- Ensure all tests pass before submitting

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🆘 Support

- **Issues**: [GitHub Issues](https://github.com/kirandevihosur74/F1RaceSim/issues)
- **Email**: kirandevihosur74@gmail.com
- **Documentation**: Check the `/docs` folder for detailed guides

---

## 🎉 Acknowledgments

- **Ergast API** - F1 circuit and race data
- **OpenWeatherMap** - Weather data integration
- **Google Gemini** - AI strategy recommendations
- **Formula 1** - For the amazing sport that inspired this project

---

**Built with ❤️ for F1 fans and strategy enthusiasts**