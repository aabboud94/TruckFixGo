import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef } from 'react';
import { SelectWeatherData, SelectWeatherAlert } from '@shared/schema';
import { apiRequest } from '@/lib/queryClient';

// Weather data types
interface WeatherData extends SelectWeatherData {
  alerts?: SelectWeatherAlert[];
  impactScore?: number;
}

interface WeatherForecast {
  daily: {
    date: Date;
    temperature: number;
    temperatureLow: number;
    temperatureHigh: number;
    conditions: string;
    precipitationChance: number;
    windSpeed: number;
  }[];
}

interface JobWeatherData {
  current: WeatherData;
  forecast: WeatherForecast;
  impactScore: number;
  warnings: string[];
}

// Hook to get current weather for coordinates
export function useWeather(lat?: number, lng?: number) {
  return useQuery({
    queryKey: ['/api/weather/current', lat, lng],
    queryFn: async () => {
      if (lat === undefined || lng === undefined) {
        return null;
      }
      const response = await apiRequest(`/api/weather/current/${lat}/${lng}`, 'GET');
      return response as WeatherData;
    },
    enabled: lat !== undefined && lng !== undefined,
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
  });
}

// Hook to get weather forecast for coordinates
export function useWeatherForecast(lat?: number, lng?: number) {
  return useQuery({
    queryKey: ['/api/weather/forecast', lat, lng],
    queryFn: async () => {
      if (lat === undefined || lng === undefined) {
        return null;
      }
      const response = await apiRequest(`/api/weather/forecast/${lat}/${lng}`, 'GET');
      return response as WeatherForecast;
    },
    enabled: lat !== undefined && lng !== undefined,
    staleTime: 30 * 60 * 1000, // 30 minutes
    gcTime: 60 * 60 * 1000, // 1 hour
  });
}

// Hook to get active weather alerts
export function useWeatherAlerts(lat?: number, lng?: number) {
  const queryClient = useQueryClient();
  const wsRef = useRef<WebSocket | null>(null);

  // Query for weather alerts
  const query = useQuery({
    queryKey: ['/api/weather/alerts', lat, lng],
    queryFn: async () => {
      let url = '/api/weather/alerts';
      if (lat !== undefined && lng !== undefined) {
        url += `?lat=${lat}&lng=${lng}`;
      }
      const response = await apiRequest(url, 'GET');
      return response as SelectWeatherAlert[];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 15 * 60 * 1000, // 15 minutes
  });

  // Subscribe to WebSocket for real-time alerts
  useEffect(() => {
    // Get WebSocket URL from environment
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws`;

    // Connect to WebSocket
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log('Connected to weather alerts WebSocket');
    };

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        
        if (message.type === 'weather:alert') {
          // Update the cache with new alert
          queryClient.setQueryData(
            ['/api/weather/alerts', lat, lng],
            (old: SelectWeatherAlert[] | undefined) => {
              if (!old) return [message.payload];
              
              // Add new alert if not already present
              const exists = old.some(alert => alert.id === message.payload.id);
              if (!exists) {
                return [message.payload, ...old];
              }
              
              // Update existing alert
              return old.map(alert => 
                alert.id === message.payload.id ? message.payload : alert
              );
            }
          );
        }
      } catch (error) {
        console.error('Error processing weather alert:', error);
      }
    };

    ws.onerror = (error) => {
      console.error('Weather alerts WebSocket error:', error);
    };

    ws.onclose = () => {
      console.log('Weather alerts WebSocket closed');
    };

    // Cleanup on unmount
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [queryClient, lat, lng]);

  return query;
}

// Hook to get weather for a specific job
export function useJobWeather(jobId?: string) {
  const queryClient = useQueryClient();
  const wsRef = useRef<WebSocket | null>(null);

  // Query for job weather
  const query = useQuery({
    queryKey: ['/api/weather/job', jobId],
    queryFn: async () => {
      if (!jobId) return null;
      const response = await apiRequest(`/api/weather/job/${jobId}`, 'GET');
      return response as JobWeatherData;
    },
    enabled: !!jobId,
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
  });

  // Subscribe to WebSocket for real-time updates
  useEffect(() => {
    if (!jobId) return;

    // Get WebSocket URL from environment
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws`;

    // Connect to WebSocket
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log(`Connected to weather updates for job ${jobId}`);
    };

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        
        if (message.type === 'weather:update' && message.payload.jobId === jobId) {
          // Update the cache with new weather data
          queryClient.setQueryData(
            ['/api/weather/job', jobId],
            (old: JobWeatherData | undefined) => {
              if (!old) {
                return {
                  current: message.payload.weather,
                  forecast: old?.forecast || { daily: [] },
                  impactScore: old?.impactScore || 0,
                  warnings: old?.warnings || []
                };
              }
              
              return {
                ...old,
                current: message.payload.weather
              };
            }
          );
        }
      } catch (error) {
        console.error('Error processing weather update:', error);
      }
    };

    ws.onerror = (error) => {
      console.error('Weather updates WebSocket error:', error);
    };

    ws.onclose = () => {
      console.log('Weather updates WebSocket closed');
    };

    // Cleanup on unmount
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [queryClient, jobId]);

  return query;
}

// Hook to manually refresh weather data (admin only)
export function useRefreshWeather() {
  const queryClient = useQueryClient();

  const refreshWeather = async () => {
    const response = await apiRequest('/api/weather/refresh', 'POST');

    // Invalidate all weather queries after refresh
    await queryClient.invalidateQueries({
      predicate: (query) => {
        const key = query.queryKey[0] as string;
        return key?.startsWith('/api/weather');
      }
    });

    return response;
  };

  return refreshWeather;
}

// Utility function to get weather icon based on conditions
export function getWeatherIcon(conditions: string): string {
  const condition = conditions.toLowerCase();
  
  if (condition.includes('sunny') || condition.includes('clear')) {
    return 'sun';
  } else if (condition.includes('partly cloudy')) {
    return 'cloud-sun';
  } else if (condition.includes('cloudy') || condition.includes('overcast')) {
    return 'cloud';
  } else if (condition.includes('rain') || condition.includes('drizzle')) {
    return 'cloud-rain';
  } else if (condition.includes('storm') || condition.includes('thunder')) {
    return 'cloud-lightning';
  } else if (condition.includes('snow')) {
    return 'snowflake';
  } else if (condition.includes('fog') || condition.includes('mist')) {
    return 'cloud-fog';
  } else if (condition.includes('wind')) {
    return 'wind';
  } else {
    return 'cloud';
  }
}

// Utility function to get weather alert severity color
export function getAlertSeverityColor(severity: string): string {
  switch (severity.toLowerCase()) {
    case 'extreme':
      return 'text-red-600 dark:text-red-400';
    case 'severe':
      return 'text-orange-600 dark:text-orange-400';
    case 'moderate':
      return 'text-yellow-600 dark:text-yellow-400';
    case 'minor':
      return 'text-blue-600 dark:text-blue-400';
    default:
      return 'text-gray-600 dark:text-gray-400';
  }
}

// Utility function to format weather impact warnings
export function formatWeatherImpactWarning(impactScore: number, conditions: string): string | null {
  if (impactScore >= 80) {
    return `Severe weather conditions (${conditions}) may significantly impact job operations`;
  } else if (impactScore >= 60) {
    return `Moderate weather conditions (${conditions}) may affect job timeline`;
  } else if (impactScore >= 40) {
    return `Minor weather conditions (${conditions}) - proceed with caution`;
  }
  return null;
}