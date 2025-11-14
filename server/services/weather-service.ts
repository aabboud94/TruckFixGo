import { storage } from '../storage';
import { 
  type WeatherData, 
  type WeatherAlert, 
  type JobWeatherImpact,
  type InsertWeatherData,
  type InsertWeatherAlert,
  type InsertJobWeatherImpact,
  weatherConditionsEnum,
  weatherAlertTypeEnum,
  weatherAlertSeverityEnum,
  weatherImpactLevelEnum
} from '@shared/schema';

// Cache for weather data to minimize "API" calls
const weatherCache = new Map<string, { data: WeatherData; expires: Date }>();
const CACHE_DURATION = 10 * 60 * 1000; // 10 minutes

// Weather conditions mapping for realistic generation
const WEATHER_CONDITIONS_MAP = {
  clear: { temp_modifier: 0, humidity_range: [30, 50], wind_range: [0, 10], precipitation: 0 },
  partly_cloudy: { temp_modifier: -2, humidity_range: [40, 60], wind_range: [5, 15], precipitation: 0 },
  cloudy: { temp_modifier: -5, humidity_range: [50, 70], wind_range: [5, 20], precipitation: 0 },
  overcast: { temp_modifier: -7, humidity_range: [60, 80], wind_range: [10, 25], precipitation: 0 },
  light_rain: { temp_modifier: -8, humidity_range: [70, 85], wind_range: [10, 20], precipitation: 0.1 },
  moderate_rain: { temp_modifier: -10, humidity_range: [75, 90], wind_range: [15, 30], precipitation: 0.5 },
  heavy_rain: { temp_modifier: -12, humidity_range: [80, 95], wind_range: [20, 40], precipitation: 1.5 },
  drizzle: { temp_modifier: -5, humidity_range: [65, 80], wind_range: [5, 15], precipitation: 0.05 },
  thunderstorm: { temp_modifier: -15, humidity_range: [85, 100], wind_range: [25, 50], precipitation: 2.0 },
  light_snow: { temp_modifier: -20, humidity_range: [60, 75], wind_range: [10, 20], precipitation: 0.2 },
  moderate_snow: { temp_modifier: -25, humidity_range: [65, 80], wind_range: [15, 30], precipitation: 0.5 },
  heavy_snow: { temp_modifier: -30, humidity_range: [70, 85], wind_range: [20, 40], precipitation: 1.0 },
  sleet: { temp_modifier: -15, humidity_range: [70, 85], wind_range: [15, 25], precipitation: 0.3 },
  hail: { temp_modifier: -10, humidity_range: [75, 90], wind_range: [30, 50], precipitation: 0.8 },
  fog: { temp_modifier: -3, humidity_range: [85, 100], wind_range: [0, 5], precipitation: 0 },
  mist: { temp_modifier: -2, humidity_range: [75, 90], wind_range: [0, 10], precipitation: 0 }
};

// Job type to weather impact mapping
const JOB_WEATHER_IMPACTS = {
  tire_change: {
    rain: { impact: 'moderate', score: 40, factors: ['Wet conditions', 'Reduced visibility'] },
    snow: { impact: 'high', score: 70, factors: ['Slippery conditions', 'Cold equipment'] },
    thunderstorm: { impact: 'severe', score: 90, factors: ['Safety risk', 'Lightning danger'] },
    fog: { impact: 'low', score: 20, factors: ['Reduced visibility'] },
    extreme_heat: { impact: 'moderate', score: 35, factors: ['Heat stress', 'Equipment overheating'] },
    extreme_cold: { impact: 'high', score: 60, factors: ['Equipment issues', 'Worker safety'] }
  },
  engine_repair: {
    rain: { impact: 'moderate', score: 50, factors: ['Water damage risk', 'Electrical hazards'] },
    snow: { impact: 'high', score: 75, factors: ['Cold start issues', 'Frozen components'] },
    thunderstorm: { impact: 'extreme', score: 95, factors: ['Electrical danger', 'Must postpone'] },
    fog: { impact: 'none', score: 5, factors: [] },
    extreme_heat: { impact: 'moderate', score: 45, factors: ['Overheating risk', 'Fluid evaporation'] },
    extreme_cold: { impact: 'high', score: 80, factors: ['Oil viscosity', 'Battery issues'] }
  },
  emergency_repair: {
    rain: { impact: 'low', score: 25, factors: ['Must proceed despite conditions'] },
    snow: { impact: 'moderate', score: 50, factors: ['Travel delays', 'Safety concerns'] },
    thunderstorm: { impact: 'high', score: 70, factors: ['Safety priority', 'May need shelter'] },
    fog: { impact: 'low', score: 30, factors: ['Navigation difficulty'] },
    extreme_heat: { impact: 'low', score: 30, factors: ['Heat stress management'] },
    extreme_cold: { impact: 'moderate', score: 55, factors: ['Equipment warm-up needed'] }
  }
};

class WeatherService {
  private alertCheckInterval: NodeJS.Timeout | null = null;

  constructor() {
    // Start periodic alert generation (for testing)
    this.startAlertGeneration();
  }

  // Generate realistic base temperature based on time of day and season
  private generateBaseTemperature(date: Date = new Date()): number {
    const hour = date.getHours();
    const month = date.getMonth();
    
    // Base temperature by season (Fahrenheit)
    let seasonBase: number;
    if (month >= 11 || month <= 1) seasonBase = 40; // Winter
    else if (month >= 2 && month <= 4) seasonBase = 60; // Spring
    else if (month >= 5 && month <= 7) seasonBase = 80; // Summer
    else seasonBase = 65; // Fall
    
    // Time of day modifier
    let timeModifier: number;
    if (hour >= 2 && hour < 6) timeModifier = -10; // Early morning
    else if (hour >= 6 && hour < 10) timeModifier = -5; // Morning
    else if (hour >= 10 && hour < 14) timeModifier = 5; // Midday
    else if (hour >= 14 && hour < 18) timeModifier = 8; // Afternoon
    else if (hour >= 18 && hour < 22) timeModifier = 0; // Evening
    else timeModifier = -5; // Night
    
    // Add some randomness
    const randomVariation = (Math.random() - 0.5) * 10;
    
    return seasonBase + timeModifier + randomVariation;
  }

  // Generate random weather condition with seasonal bias
  private generateWeatherCondition(date: Date = new Date()): keyof typeof WEATHER_CONDITIONS_MAP {
    const month = date.getMonth();
    const conditions = Object.keys(WEATHER_CONDITIONS_MAP) as Array<keyof typeof WEATHER_CONDITIONS_MAP>;
    
    // Seasonal biases
    let weights: number[] = [];
    if (month >= 11 || month <= 1) {
      // Winter - more snow, clouds
      weights = conditions.map(c => {
        if (c.includes('snow')) return 3;
        if (c.includes('cloud') || c === 'overcast') return 2;
        if (c === 'clear') return 0.5;
        return 1;
      });
    } else if (month >= 5 && month <= 7) {
      // Summer - more clear, thunderstorms
      weights = conditions.map(c => {
        if (c === 'clear' || c === 'partly_cloudy') return 3;
        if (c === 'thunderstorm') return 1.5;
        if (c.includes('snow')) return 0;
        return 1;
      });
    } else {
      // Spring/Fall - mixed
      weights = conditions.map(() => 1);
    }
    
    // Weighted random selection
    const totalWeight = weights.reduce((a, b) => a + b, 0);
    let random = Math.random() * totalWeight;
    
    for (let i = 0; i < conditions.length; i++) {
      random -= weights[i];
      if (random <= 0) {
        return conditions[i];
      }
    }
    
    return 'partly_cloudy';
  }

  // Generate mock weather data for a location
  async generateWeatherData(
    lat: number, 
    lng: number, 
    isForecast: boolean = false,
    forecastDate?: Date
  ): Promise<InsertWeatherData> {
    const now = forecastDate || new Date();
    const condition = this.generateWeatherCondition(now);
    const conditionData = WEATHER_CONDITIONS_MAP[condition];
    const baseTemp = this.generateBaseTemperature(now);
    
    const temperature = baseTemp + conditionData.temp_modifier;
    const humidity = Math.floor(
      conditionData.humidity_range[0] + 
      Math.random() * (conditionData.humidity_range[1] - conditionData.humidity_range[0])
    );
    const windSpeed = 
      conditionData.wind_range[0] + 
      Math.random() * (conditionData.wind_range[1] - conditionData.wind_range[0]);
    
    // Calculate sunrise/sunset (simplified)
    const sunrise = new Date(now);
    sunrise.setHours(6, 30, 0, 0);
    const sunset = new Date(now);
    sunset.setHours(18, 30, 0, 0);
    
    return {
      latitude: lat.toString(),
      longitude: lng.toString(),
      locationName: `Location ${lat.toFixed(2)}, ${lng.toFixed(2)}`,
      temperature: temperature.toString(),
      feelsLike: (temperature + (windSpeed > 20 ? -5 : 0)).toString(),
      conditions: condition,
      description: this.getWeatherDescription(condition),
      windSpeed: windSpeed.toString(),
      windDirection: Math.floor(Math.random() * 360),
      windGust: (windSpeed * 1.3).toString(),
      precipitation: conditionData.precipitation.toString(),
      precipitationProbability: conditionData.precipitation > 0 ? Math.floor(30 + Math.random() * 50) : 0,
      precipitationType: condition.includes('snow') ? 'snow' : condition.includes('rain') ? 'rain' : null,
      humidity,
      pressure: (29.92 + (Math.random() - 0.5) * 0.5).toString(),
      visibility: condition === 'fog' ? '0.5' : condition === 'mist' ? '2' : '10',
      uvIndex: condition === 'clear' ? 8 : condition === 'partly_cloudy' ? 5 : 2,
      cloudCover: condition === 'clear' ? 0 : condition === 'partly_cloudy' ? 30 : 70,
      sunrise,
      sunset,
      moonPhase: (Math.random()).toString(),
      source: 'mock',
      isForecast,
      forecastFor: isForecast ? forecastDate : null,
      timestamp: new Date(),
      expiresAt: new Date(Date.now() + CACHE_DURATION)
    };
  }

  private getWeatherDescription(condition: keyof typeof WEATHER_CONDITIONS_MAP): string {
    const descriptions: Record<string, string> = {
      clear: 'Clear skies',
      partly_cloudy: 'Partly cloudy',
      cloudy: 'Cloudy',
      overcast: 'Overcast skies',
      light_rain: 'Light rain',
      moderate_rain: 'Moderate rain',
      heavy_rain: 'Heavy rain',
      drizzle: 'Light drizzle',
      thunderstorm: 'Thunderstorm with heavy rain',
      light_snow: 'Light snow',
      moderate_snow: 'Moderate snowfall',
      heavy_snow: 'Heavy snowfall',
      sleet: 'Sleet',
      hail: 'Hail',
      fog: 'Dense fog',
      mist: 'Misty conditions'
    };
    return descriptions[condition] || 'Variable conditions';
  }

  // Get current weather for coordinates
  async getCurrentWeather(lat: number, lng: number): Promise<WeatherData> {
    const cacheKey = `current_${lat}_${lng}`;
    const cached = weatherCache.get(cacheKey);
    
    if (cached && cached.expires > new Date()) {
      return cached.data;
    }
    
    // Generate and save new weather data
    const weatherData = await this.generateWeatherData(lat, lng);
    const saved = await storage.saveWeatherData(weatherData);
    
    // Cache the result
    weatherCache.set(cacheKey, {
      data: saved,
      expires: new Date(Date.now() + CACHE_DURATION)
    });
    
    return saved;
  }

  // Get 5-day forecast for coordinates
  async getForecast(lat: number, lng: number): Promise<WeatherData[]> {
    const cacheKey = `forecast_${lat}_${lng}`;
    const cached = weatherCache.get(cacheKey);
    
    if (cached && cached.expires > new Date()) {
      return cached.data as unknown as WeatherData[];
    }
    
    const forecast: WeatherData[] = [];
    const now = new Date();
    
    for (let i = 0; i < 5; i++) {
      const forecastDate = new Date(now);
      forecastDate.setDate(forecastDate.getDate() + i);
      forecastDate.setHours(12, 0, 0, 0); // Noon forecast
      
      const weatherData = await this.generateWeatherData(lat, lng, true, forecastDate);
      const saved = await storage.saveWeatherData(weatherData);
      forecast.push(saved);
    }
    
    // Cache the result
    weatherCache.set(cacheKey, {
      data: forecast as any,
      expires: new Date(Date.now() + CACHE_DURATION)
    });
    
    return forecast;
  }

  // Generate random weather alerts for testing
  private async generateRandomAlert(): Promise<void> {
    // 10% chance of generating an alert
    if (Math.random() > 0.1) return;
    
    const alertTypes = ['wind', 'rain', 'thunderstorm', 'heat', 'fog', 'snow'];
    const severities = ['advisory', 'watch', 'warning'];
    
    const alertType = alertTypes[Math.floor(Math.random() * alertTypes.length)] as any;
    const severity = severities[Math.floor(Math.random() * severities.length)] as any;
    
    const alertTitles: Record<string, string> = {
      wind: 'High Wind Advisory',
      rain: 'Heavy Rain Warning',
      thunderstorm: 'Severe Thunderstorm Watch',
      heat: 'Excessive Heat Warning',
      fog: 'Dense Fog Advisory',
      snow: 'Winter Storm Watch'
    };
    
    const alertMessages: Record<string, string> = {
      wind: 'Strong winds expected with gusts up to 50 mph. Secure loose objects.',
      rain: 'Heavy rainfall expected. Flash flooding possible in low-lying areas.',
      thunderstorm: 'Severe thunderstorms capable of producing damaging winds and hail.',
      heat: 'Dangerously hot conditions with heat index values up to 110°F.',
      fog: 'Dense fog will reduce visibility to less than a quarter mile.',
      snow: 'Heavy snow expected. Travel could be very difficult to impossible.'
    };
    
    const startTime = new Date();
    const endTime = new Date(startTime.getTime() + (2 + Math.random() * 10) * 60 * 60 * 1000); // 2-12 hours
    
    const alert: InsertWeatherAlert = {
      alertType: alertType,
      severity: severity,
      title: alertTitles[alertType],
      message: alertMessages[alertType],
      affectedAreas: [
        { lat: 40.7128, lng: -74.0060, radius: 50 }, // Example: NYC area
        { lat: 34.0522, lng: -118.2437, radius: 30 } // Example: LA area
      ],
      stateCode: 'NY',
      countyName: 'New York County',
      cityName: 'New York',
      startTime,
      endTime,
      isActive: true,
      instructions: 'Monitor local weather updates and take appropriate precautions.',
      urgency: severity === 'warning' ? 'immediate' : 'expected',
      certainty: severity === 'warning' ? 'observed' : 'likely',
      source: 'mock',
      estimatedImpactRadius: (30 + Math.random() * 70).toString(),
      affectedJobCount: Math.floor(Math.random() * 20)
    };
    
    await storage.saveWeatherAlert(alert);
  }

  // Start periodic alert generation
  private startAlertGeneration(): void {
    // Check every 30 minutes
    this.alertCheckInterval = setInterval(() => {
      this.generateRandomAlert().catch(console.error);
    }, 30 * 60 * 1000);
    
    // Generate one immediately for testing
    this.generateRandomAlert().catch(console.error);
  }

  // Stop alert generation (for cleanup)
  stopAlertGeneration(): void {
    if (this.alertCheckInterval) {
      clearInterval(this.alertCheckInterval);
      this.alertCheckInterval = null;
    }
  }

  // Calculate weather impact score for a job
  async calculateJobWeatherImpact(
    jobId: string,
    jobType: string,
    lat: number,
    lng: number
  ): Promise<InsertJobWeatherImpact> {
    // Get current weather
    const weather = await this.getCurrentWeather(lat, lng);
    const activeAlerts = await storage.getActiveWeatherAlerts();
    
    // Determine weather category
    let weatherCategory: keyof typeof JOB_WEATHER_IMPACTS['tire_change'];
    const temp = parseFloat(weather.temperature);
    const condition = weather.conditions;
    
    if (condition.includes('thunderstorm')) {
      weatherCategory = 'thunderstorm';
    } else if (condition.includes('snow')) {
      weatherCategory = 'snow';
    } else if (condition.includes('rain')) {
      weatherCategory = 'rain';
    } else if (condition === 'fog' || condition === 'mist') {
      weatherCategory = 'fog';
    } else if (temp > 95) {
      weatherCategory = 'extreme_heat';
    } else if (temp < 20) {
      weatherCategory = 'extreme_cold';
    } else {
      // Good weather - minimal impact
      return {
        jobId,
        weatherDataId: weather.id,
        weatherAlertId: activeAlerts.length > 0 ? activeAlerts[0].id : null,
        impactLevel: 'none',
        impactScore: '5',
        safetyRisk: false,
        delayRisk: false,
        equipmentRisk: false,
        visibilityIssue: condition === 'fog' || condition === 'mist',
        impactFactors: [],
        recommendedActions: ['Proceed as normal'],
        contractorNotified: false,
        contractorAcknowledged: false,
        customerNotified: false
      };
    }
    
    // Get job-specific impact
    const jobTypeKey = jobType.toLowerCase().replace(/\s+/g, '_');
    const impactData = JOB_WEATHER_IMPACTS[jobTypeKey as keyof typeof JOB_WEATHER_IMPACTS] || 
                      JOB_WEATHER_IMPACTS.emergency_repair;
    const impact = impactData[weatherCategory];
    
    // Determine impact level enum value
    let impactLevel: 'none' | 'low' | 'moderate' | 'high' | 'severe' | 'extreme';
    if (impact.score < 10) impactLevel = 'none';
    else if (impact.score < 30) impactLevel = 'low';
    else if (impact.score < 50) impactLevel = 'moderate';
    else if (impact.score < 70) impactLevel = 'high';
    else if (impact.score < 90) impactLevel = 'severe';
    else impactLevel = 'extreme';
    
    // Generate recommended actions
    const recommendedActions: string[] = [];
    if (impact.score > 30) recommendedActions.push('Monitor weather conditions closely');
    if (impact.score > 50) recommendedActions.push('Consider rescheduling if possible');
    if (impact.score > 70) recommendedActions.push('Take extra safety precautions');
    if (weatherCategory === 'thunderstorm') recommendedActions.push('Seek shelter if lightning detected');
    if (weatherCategory === 'snow' || weatherCategory === 'extreme_cold') recommendedActions.push('Allow extra time for equipment warm-up');
    
    return {
      jobId,
      weatherDataId: weather.id,
      weatherAlertId: activeAlerts.length > 0 ? activeAlerts[0].id : null,
      impactLevel,
      impactScore: impact.score.toString(),
      safetyRisk: impact.score > 60,
      delayRisk: impact.score > 40,
      equipmentRisk: weatherCategory === 'extreme_cold' || weatherCategory === 'extreme_heat',
      visibilityIssue: weatherCategory === 'fog' || condition === 'heavy_rain' || condition === 'heavy_snow',
      impactFactors: impact.factors.map(f => ({ factor: f, severity: impactLevel, description: f })),
      recommendedActions,
      contractorNotified: false,
      contractorAcknowledged: false,
      customerNotified: false
    };
  }

  // Get weather for a specific job
  async getJobWeather(jobId: string): Promise<{
    current: WeatherData | null;
    impact: JobWeatherImpact | null;
    alerts: WeatherAlert[];
  }> {
    const job = await storage.getJob(jobId);
    if (!job || !job.latitude || !job.longitude) {
      return { current: null, impact: null, alerts: [] };
    }
    
    const lat = parseFloat(job.latitude);
    const lng = parseFloat(job.longitude);
    
    const current = await this.getCurrentWeather(lat, lng);
    const alerts = await storage.getActiveWeatherAlerts();
    
    // Check if we already have an impact assessment
    let impact = await storage.getJobWeatherImpact(jobId);
    
    // If no impact assessment or it's old, create a new one
    if (!impact || 
        !impact.createdAt || 
        new Date(impact.createdAt).getTime() < Date.now() - CACHE_DURATION) {
      const impactData = await this.calculateJobWeatherImpact(
        jobId, 
        job.serviceType || 'emergency_repair',
        lat,
        lng
      );
      impact = await storage.recordJobWeatherImpact(impactData);
    }
    
    return { current, impact, alerts };
  }

  // Refresh all weather data
  async refreshAllWeatherData(): Promise<{ updated: number; errors: number }> {
    let updated = 0;
    let errors = 0;
    
    // Clear cache
    weatherCache.clear();
    
    // Get all active jobs
    const jobs = await storage.getActiveJobs();
    
    for (const job of jobs) {
      try {
        if (job.latitude && job.longitude) {
          const lat = parseFloat(job.latitude);
          const lng = parseFloat(job.longitude);
          
          // Update weather data
          await this.getCurrentWeather(lat, lng);
          
          // Update impact assessment
          await this.calculateJobWeatherImpact(
            job.id,
            job.serviceType || 'emergency_repair',
            lat,
            lng
          );
          
          updated++;
        }
      } catch (error) {
        console.error(`Failed to update weather for job ${job.id}:`, error);
        errors++;
      }
    }
    
    // Generate a potential alert
    await this.generateRandomAlert();
    
    return { updated, errors };
  }
}

// Create singleton instance
const weatherService = new WeatherService();

export default weatherService;