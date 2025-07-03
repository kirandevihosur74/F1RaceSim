# 🏎️ F1 Race Simulator

An AI-powered web application for simulating Formula 1 race strategies, predicting outcomes, and receiving intelligent strategy recommendations.

## 🎯 Features

- **Race Strategy Simulation**: Configure pit stops, tire compounds, and driver behavior
- **AI-Powered Recommendations**: Get intelligent strategy suggestions using OpenAI GPT-4o
- **Real-time Visualization**: Interactive charts showing lap times and tire wear
- **Historical Data Integration**: Automated data collection from F1 APIs
- **Cloud-Native Architecture**: Serverless backend with AWS Lambda and S3

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Next.js       │    │   FastAPI       │    │   AWS Services  │
│   Frontend      │◄──►│   Backend       │◄──►│   Lambda/S3/DB  │
│                 │    │                 │    │                 │
│ • React/TS      │    │ • Python        │    │ • Lambda        │
│ • Tailwind CSS  │    │ • FastAPI       │    │ • S3 Storage    │
│ • Zustand       │    │ • OpenAI        │    │ • DynamoDB      │
│ • Recharts      │    │ • Simulation    │    │ • API Gateway   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   n8n Workflows │    │   OpenAI GPT-4o │    │   Monitoring    │
│                 │    │                 │    │                 │
│ • Data Fetching │    │ • Strategy AI   │    │ • CloudWatch    │
│ • Notifications │    │ • Analysis      │    │ • Logs          │
│ • Automation    │    │ • Recommendations│   │ • Metrics       │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm
- Python 3.9+
- AWS CLI configured
- OpenAI API key

### Frontend Setup

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

### Backend Setup

```bash
# Navigate to backend directory
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Set environment variables
export OPENAI_API_KEY="your-openai-api-key"

# Run locally
python main.py
```

### AWS Deployment

```bash
# Install AWS SAM CLI
npm install -g aws-sam-cli

# Build and deploy
cd infra
sam build
sam deploy --guided

# Set up environment variables
aws secretsmanager create-secret \
  --name openai-api-key \
  --secret-string '{"api_key":"your-openai-api-key"}'
```

## 📁 Project Structure

```
f1racesim/
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   │   ├── simulation.py
│   │   └── strategy.py
│   ├── main.py
│   └── requirements.txt
├── workflows/             # n8n automation
│   ├── fetch-race-data.json
│   └── simulation-trigger.json
├── infra/                 # AWS infrastructure
│   └── template.yaml
└── package.json
```

## 🔧 Configuration

### Environment Variables

Create a `.env.local` file in the root directory:

```env
# Frontend
NEXT_PUBLIC_API_URL=http://localhost:8000

# Backend
OPENAI_API_KEY=your-openai-api-key
AWS_ACCESS_KEY_ID=your-aws-access-key
AWS_SECRET_ACCESS_KEY=your-aws-secret-key
AWS_REGION=us-east-1

# AWS Resources
SIMULATION_BUCKET=f1-race-simulator-dev-123456789
METADATA_TABLE=f1-strategy-metadata-dev
```

### API Endpoints

#### Simulation Endpoint
```http
POST /api/simulate-race
Content-Type: application/json

{
  "strategy": {
    "pit_stops": [15, 35],
    "tires": ["Medium", "Hard", "Soft"],
    "driver_style": "balanced"
  },
  "weather": "dry"
}
```

#### Strategy Recommendation Endpoint
```http
POST /api/strategy-recommendation
Content-Type: application/json

{
  "scenario": "Pit stops at laps 15, 35, using Medium → Hard → Soft, driver style: balanced"
}
```

## 🎮 Usage

1. **Configure Strategy**: Set pit stop laps, tire compounds, and driver style
2. **Run Simulation**: Click "Run Simulation" to generate lap-by-lap results
3. **View Results**: Analyze lap times, tire wear, and performance metrics
4. **Get AI Recommendations**: Receive intelligent strategy suggestions
5. **Compare Strategies**: Run multiple simulations to find optimal approach

## 🔄 Automation Workflows

### Data Collection (n8n)
- **Schedule**: Weekly execution
- **Source**: Ergast F1 API
- **Storage**: AWS S3
- **Notifications**: Slack integration

### Simulation Trigger (n8n)
- **Trigger**: HTTP webhook from frontend
- **Processing**: AWS Lambda simulation
- **Storage**: S3 results + DynamoDB metadata
- **Notifications**: Success/error alerts

## 🧪 Simulation Logic

The race simulation engine considers:

- **Tire Compounds**: Soft, Medium, Hard, Intermediate, Wet
- **Driver Styles**: Aggressive, Balanced, Conservative
- **Weather Conditions**: Dry, Wet, Intermediate
- **Dynamic Factors**: Fuel load, tire wear, track conditions
- **Random Variation**: Realistic lap time fluctuations

### Key Parameters

```python
# Base lap time (seconds)
base_lap_time = 85.0

# Tire wear impact
tire_wear_impact = wear * compound_rate * driver_multiplier

# Fuel load impact
fuel_impact = lap_number * 0.02

# Weather multipliers
weather_multipliers = {
    "dry": 1.0,
    "wet": 1.15,
    "intermediate": 1.08
}
```

## 🚀 Deployment

### Vercel (Frontend)
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

### AWS Lambda (Backend)
```bash
# Deploy with SAM
sam build && sam deploy

# Or use Terraform
cd infra/terraform
terraform init
terraform plan
terraform apply
```

## 📊 Monitoring

- **CloudWatch Logs**: Lambda function execution logs
- **CloudWatch Metrics**: API Gateway performance
- **S3 Analytics**: Storage usage and access patterns
- **DynamoDB Metrics**: Database performance

## 🔒 Security

- **API Gateway**: Request throttling and authentication
- **IAM Roles**: Least privilege access
- **S3 Buckets**: Private with lifecycle policies
- **Secrets Manager**: Secure API key storage

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request


## 🆘 Support

- **Issues**: GitHub Issues
- **Documentation**: This README
- **API Docs**: `/docs` endpoint when running locally

## 🎯 Roadmap

- [ ] Multi-car simulation
- [ ] Real-time weather integration
- [ ] Advanced tire modeling
- [ ] Machine learning optimization
- [ ] Mobile app
- [ ] Team collaboration features