# API Setup Guide

This guide explains how to set up the hybrid API approach for the F1 Race Strategy Simulator.

## Overview

The application uses a hybrid approach that combines:
- **Local Data**: Pre-configured track data for 5 major F1 circuits
- **Jolpi API**: F1 data from Jolpi API when available
- **Fallback**: Automatic fallback to local data when API is unavailable

## Data Sources

### 1. Jolpi API (F1 Data)
- **URL**: https://api.jolpi.ca/ergast/f1
- **Purpose**: Circuit information, lap records, race results
- **Cost**: Free
- **Status**: Active F1 data API
- **Data**: All F1 circuits, historical data, lap times

### 2. OpenWeatherMap API (Weather Data)
- **URL**: https://api.openweathermap.org/data/2.5/weather
- **Purpose**: Real-time weather conditions at track locations
- **Cost**: Free tier available (1000 calls/day)
- **Rate Limits**: 60 calls/minute for free tier
- **Data**: Temperature, humidity, wind speed, conditions

## Environment Variables

Create a `.env.local` file in your project root:

```bash
# OpenWeatherMap API Key (Optional)
NEXT_PUBLIC_OPENWEATHER_API_KEY=your_api_key_here

# Other optional variables
NEXT_PUBLIC_JOLPI_BASE_URL=https://api.jolpi.ca/ergast/f1
NEXT_PUBLIC_WEATHER_BASE_URL=https://api.openweathermap.org/data/2.5
```

## API Key Setup

### OpenWeatherMap API Key
1. Go to [OpenWeatherMap](https://openweathermap.org/)
2. Sign up for a free account
3. Navigate to "API keys" section
4. Copy your API key
5. Add it to `.env.local`

**Note**: The application works without the weather API key, but will use simulated weather data instead.

## How the Hybrid System Works

### Track Data Flow
1. **Local Priority**: Known tracks (Monaco, Silverstone, Spa, Monza, Suzuka) use local data
2. **API Enhancement**: Unknown tracks fetch from Jolpi API
3. **Default Values**: Missing data (sectors, tire degradation) uses sensible defaults
4. **Graceful Fallback**: Automatic fallback to local data when API is unavailable

### Weather Data Flow
1. **API First**: If OpenWeatherMap API key is available, fetch real weather
2. **Simulated Fallback**: Generate realistic weather based on track location
3. **Forecast Generation**: Create lap-by-lap weather forecast

### API Status Indicators
- **Green Dot**: Using API data
- **Yellow Dot**: Using local/simulated data
- **Error Banner**: API unavailable, showing fallback status

## API Endpoints

### Frontend API Routes
- `GET /api/tracks?action=list` - Get all tracks
- `GET /api/tracks?action=details&track_id=X` - Get track details
- `GET /api/tracks?action=weather&track_id=X` - Get weather data
- `GET /api/tracks?action=status` - Check API availability

### External APIs
- `GET https://api.jolpi.ca/ergast/f1/circuits.json` - All circuits
- `GET https://api.jolpi.ca/ergast/f1/circuits/{id}/fastest/1/drivers.json` - Fastest lap
- `GET https://api.openweathermap.org/data/2.5/weather?lat=X&lon=Y&appid=KEY` - Weather

## Error Handling

The system gracefully handles API failures:

1. **Network Errors**: Automatic fallback to local data
2. **API Unavailable**: Uses local data when Jolpi API is down
3. **Rate Limits**: Exponential backoff and retry
4. **Invalid Data**: Validation and default values
5. **Missing API Keys**: Simulated data generation

## Performance Considerations

### Caching
- Track data is cached in the store
- Weather data is refreshed on track change
- API status is checked periodically

### Rate Limiting
- OpenWeatherMap: 60 calls/minute (free tier)
- Jolpi API: No documented limits
- Implement exponential backoff for failures

### Data Size
- Local track data: ~5KB
- API responses: ~1-10KB per request
- Weather forecast: ~2KB per track

## Testing the Hybrid System

### Test API Availability
```bash
# Check if Jolpi API is working
curl "https://api.jolpi.ca/ergast/f1/circuits.json"

# Check weather API (requires key)
curl "https://api.openweathermap.org/data/2.5/weather?lat=52.0736&lon=-1.0167&appid=YOUR_KEY"
```

### Test Fallback Behavior
1. Disconnect internet
2. Refresh the application
3. Verify local data is used
4. Check status indicators

### Test API Toggle
1. Use "Toggle API" button in TrackSelector
2. Verify data source changes
3. Check status indicators update

## Troubleshooting

### Common Issues

**Jolpi API Not Available**
- Check internet connection
- Verify API endpoint is accessible
- Check if Jolpi API is experiencing downtime
- Local data provides comprehensive fallback

**Weather Data Missing**
- Verify OpenWeatherMap API key
- Check API key permissions
- Ensure coordinates are correct

**Track Data Incomplete**
- Jolpi API may not have all track details
- Local data is prioritized for known tracks
- Default values are used for missing data

### Debug Information

Enable debug logging in the browser console:
```javascript
// Check API status
console.log('API Status:', await fetch('/api/tracks?action=status').then(r => r.json()))

// Check track data
console.log('Track Data:', await fetch('/api/tracks?action=list').then(r => r.json()))

// Test API connectivity
console.log('API Test:', await F1APIService.testAPIConnectivity())
```

## Alternative Data Sources

If Jolpi API becomes unavailable, consider these alternatives:

### Free Options
- **FastF1 Library**: Python library with F1 data
- **F1 API**: Unofficial F1 data APIs
- **Sports APIs**: General sports data providers

### Paid Options
- **Official F1 API**: Requires partnership
- **Sports Data Providers**: ESPN, Sportradar, etc.
- **Custom Solutions**: Build your own data collection

## Future Enhancements

### Additional APIs
- **F1 Live Timing**: Real-time race data
- **Weather Radar**: Precipitation probability
- **Track Telemetry**: Sector times, tire wear

### Data Improvements
- **Historical Weather**: Track-specific weather patterns
- **Driver Data**: Individual driver characteristics
- **Car Data**: Team-specific performance data

### Performance Optimizations
- **Service Workers**: Offline data caching
- **CDN**: Static data distribution
- **WebSockets**: Real-time updates 