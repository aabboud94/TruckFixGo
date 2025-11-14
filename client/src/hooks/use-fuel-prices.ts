import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useState, useEffect } from 'react';
import type { FuelStation, FuelPrice, FuelPriceAlert, FuelPriceAggregate } from '@shared/schema';

// Types for fuel tracking
interface NearbyFuelPrice {
  station: FuelStation;
  price: FuelPrice;
  distance: number;
  savings?: number;
  recommended?: boolean;
}

interface FuelCostCalculation {
  totalDistance: number;
  totalGallonsNeeded: number;
  estimatedCost: number;
  averagePricePerGallon: number;
  recommendedStops: Array<{
    station: FuelStation;
    price: FuelPrice;
    gallonsToFill: number;
    cost: number;
    distanceFromRoute: number;
  }>;
  savingsVsAverage: number;
}

interface RegionalTrend {
  region: string;
  fuelType: string;
  currentAverage: number;
  weeklyChange: number;
  monthlyChange: number;
  trend: 'increasing' | 'decreasing' | 'stable';
  forecast: Array<{
    date: string;
    predictedPrice: number;
  }>;
}

// Hook to get nearby fuel prices
export function useFuelPrices(lat?: number, lng?: number, radius?: number, fuelType?: string) {
  return useQuery({
    queryKey: ['/api/fuel/prices', lat, lng, radius, fuelType],
    queryFn: async () => {
      if (!lat || !lng || !radius) return null;
      
      const params = new URLSearchParams();
      if (fuelType) params.append('fuelType', fuelType);
      params.append('limit', '20');
      
      const response = await fetch(
        `/api/fuel/prices/${lat}/${lng}/${radius}?${params.toString()}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include'
        }
      );
      
      if (!response.ok) throw new Error('Failed to fetch fuel prices');
      return response.json() as Promise<NearbyFuelPrice[]>;
    },
    enabled: !!lat && !!lng && !!radius,
    staleTime: 5 * 60 * 1000, // Consider data stale after 5 minutes
    refetchInterval: 10 * 60 * 1000, // Refetch every 10 minutes
  });
}

// Hook to get fuel price trends for a region
export function useFuelTrends(region?: string, fuelType?: string) {
  return useQuery({
    queryKey: ['/api/fuel/trends', region, fuelType],
    queryFn: async () => {
      if (!region) return null;
      
      const params = new URLSearchParams();
      if (fuelType) params.append('fuelType', fuelType);
      
      const response = await fetch(
        `/api/fuel/trends/${region}?${params.toString()}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include'
        }
      );
      
      if (!response.ok) throw new Error('Failed to fetch fuel trends');
      return response.json() as Promise<RegionalTrend>;
    },
    enabled: !!region,
    staleTime: 60 * 60 * 1000, // Consider data stale after 1 hour
  });
}

// Hook to calculate fuel cost for a route
export function useRouteFuelCost() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (params: {
      origin: { lat: number; lng: number };
      destination: { lat: number; lng: number };
      vehicleId?: string;
      fuelType?: 'diesel' | 'regular' | 'premium';
      distanceMiles?: number;
      mpg?: number;
      tankCapacity?: number;
      currentFuelLevel?: number;
    }) => {
      return apiRequest('/api/fuel/calculate-cost', {
        method: 'POST',
        body: JSON.stringify(params),
      });
    },
    onSuccess: (data) => {
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['/api/fuel/prices'] });
    },
  });
}

// Hook to get price history for a station
export function useFuelPriceHistory(stationId?: string, fuelType?: string, days: number = 30) {
  return useQuery({
    queryKey: ['/api/fuel/station', stationId, 'history', fuelType, days],
    queryFn: async () => {
      if (!stationId) return null;
      
      const params = new URLSearchParams();
      if (fuelType) params.append('fuelType', fuelType);
      params.append('days', days.toString());
      
      const response = await fetch(
        `/api/fuel/station/${stationId}/history?${params.toString()}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include'
        }
      );
      
      if (!response.ok) throw new Error('Failed to fetch price history');
      return response.json();
    },
    enabled: !!stationId,
    staleTime: 15 * 60 * 1000, // Consider data stale after 15 minutes
  });
}

// Hook to get and manage fuel price alerts
export function useFuelAlerts() {
  const queryClient = useQueryClient();
  
  const alertsQuery = useQuery({
    queryKey: ['/api/fuel/alerts'],
    queryFn: async () => {
      const response = await fetch('/api/fuel/alerts', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include'
      });
      
      if (!response.ok) throw new Error('Failed to fetch fuel alerts');
      return response.json() as Promise<FuelPriceAlert[]>;
    },
  });
  
  const createAlert = useMutation({
    mutationFn: async (alert: {
      alertType: 'price_drop' | 'price_spike' | 'threshold' | 'comparison' | 'route_optimization';
      severity: 'low' | 'medium' | 'high' | 'critical';
      fuelType?: 'diesel' | 'regular' | 'premium';
      stationId?: string;
      state?: string;
      thresholdPrice?: string;
      thresholdPercent?: string;
      radius?: number;
      location?: { lat: number; lng: number };
      expiresAt?: string;
    }) => {
      return apiRequest('/api/fuel/alerts', {
        method: 'POST',
        body: JSON.stringify(alert),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/fuel/alerts'] });
    },
  });
  
  return {
    alerts: alertsQuery.data,
    isLoading: alertsQuery.isLoading,
    createAlert: createAlert.mutate,
    isCreating: createAlert.isPending,
  };
}

// Hook to get all fuel stations
export function useFuelStations(state?: string) {
  return useQuery({
    queryKey: ['/api/fuel/stations', state],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (state) params.append('state', state);
      
      const response = await fetch(
        `/api/fuel/stations${params.toString() ? '?' + params.toString() : ''}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include'
        }
      );
      
      if (!response.ok) throw new Error('Failed to fetch fuel stations');
      return response.json() as Promise<FuelStation[]>;
    },
    staleTime: 60 * 60 * 1000, // Consider data stale after 1 hour
  });
}

// Hook to get station details with current prices
export function useFuelStation(stationId?: string) {
  return useQuery({
    queryKey: ['/api/fuel/station', stationId],
    queryFn: async () => {
      if (!stationId) return null;
      
      const response = await fetch(`/api/fuel/station/${stationId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include'
      });
      
      if (!response.ok) throw new Error('Failed to fetch station details');
      return response.json() as Promise<FuelStation & { prices: FuelPrice[] }>;
    },
    enabled: !!stationId,
    staleTime: 5 * 60 * 1000, // Consider data stale after 5 minutes
  });
}

// Hook to subscribe to real-time fuel price updates via WebSocket
export function useFuelPriceUpdates(onPriceUpdate?: (update: any) => void, onAlert?: (alert: any) => void) {
  const [isConnected, setIsConnected] = useState(false);
  
  useEffect(() => {
    let ws: WebSocket | null = null;
    
    const connect = () => {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/ws`;
      
      ws = new WebSocket(wsUrl);
      
      ws.onopen = () => {
        setIsConnected(true);
        console.log('WebSocket connected for fuel price updates');
      };
      
      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          
          if (message.type === 'FUEL_PRICE_UPDATE' && onPriceUpdate) {
            onPriceUpdate(message.payload);
          } else if (message.type === 'FUEL_ALERT' && onAlert) {
            onAlert(message.payload);
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };
      
      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        setIsConnected(false);
      };
      
      ws.onclose = () => {
        setIsConnected(false);
        console.log('WebSocket disconnected');
        
        // Reconnect after 5 seconds
        setTimeout(connect, 5000);
      };
    };
    
    connect();
    
    return () => {
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
    };
  }, [onPriceUpdate, onAlert]);
  
  return { isConnected };
}

// Hook to get recommended fuel stops for a route
export function useRouteFuelStops(routeId?: string) {
  return useQuery({
    queryKey: ['/api/fuel/route', routeId, 'stops'],
    queryFn: async () => {
      if (!routeId) return null;
      
      const response = await fetch(`/api/fuel/route/${routeId}/stops`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include'
      });
      
      if (!response.ok) throw new Error('Failed to fetch route fuel stops');
      return response.json();
    },
    enabled: !!routeId,
    staleTime: 10 * 60 * 1000, // Consider data stale after 10 minutes
  });
}