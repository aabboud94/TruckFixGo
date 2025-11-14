import { storage } from '../storage';
import LocationService from './location-service';
import type { 
  FuelStation, 
  InsertFuelStation,
  FuelPrice, 
  InsertFuelPrice,
  FuelPriceHistory,
  InsertFuelPriceHistory,
  RouteFuelStop,
  InsertRouteFuelStop,
  FuelPriceAlert,
  InsertFuelPriceAlert,
  FuelPriceAggregate,
  InsertFuelPriceAggregate,
  Job
} from '@shared/schema';

// Major truck stop brands and their typical locations
const TRUCK_STOP_BRANDS = {
  pilot: { name: 'Pilot', likelihood: 0.2, priceMod: 0 },
  flying_j: { name: 'Flying J', likelihood: 0.15, priceMod: -0.02 },
  loves: { name: "Love's", likelihood: 0.15, priceMod: -0.01 },
  ta_travel: { name: 'TA Travel Centers', likelihood: 0.1, priceMod: 0.02 },
  petro: { name: 'Petro', likelihood: 0.1, priceMod: 0.01 },
  speedway: { name: 'Speedway', likelihood: 0.1, priceMod: -0.03 },
  shell: { name: 'Shell', likelihood: 0.05, priceMod: 0.05 },
  chevron: { name: 'Chevron', likelihood: 0.05, priceMod: 0.04 },
  exxon: { name: 'Exxon', likelihood: 0.05, priceMod: 0.03 },
  bp: { name: 'BP', likelihood: 0.04, priceMod: 0.02 },
  other: { name: 'Independent', likelihood: 0.01, priceMod: -0.05 }
};

// Base fuel prices by region (state)
const REGIONAL_PRICE_BASE = {
  'CA': { diesel: 4.20, regular: 3.60, premium: 3.90, def: 3.00 },
  'TX': { diesel: 3.50, regular: 3.00, premium: 3.30, def: 2.80 },
  'FL': { diesel: 3.70, regular: 3.20, premium: 3.50, def: 2.85 },
  'NY': { diesel: 4.00, regular: 3.40, premium: 3.70, def: 2.95 },
  'IL': { diesel: 3.80, regular: 3.30, premium: 3.60, def: 2.90 },
  'DEFAULT': { diesel: 3.75, regular: 3.25, premium: 3.55, def: 2.85 }
};

class FuelPriceService {
  private priceUpdateInterval?: NodeJS.Timeout;
  private alertCheckInterval?: NodeJS.Timeout;

  constructor() {
    // Initialize price updates every hour
    this.startPriceUpdates();
  }

  // Initialize service and create sample fuel stations
  async initialize(): Promise<void> {
    console.log('Initializing Fuel Price Service...');
    
    // Generate sample fuel stations if none exist
    const existingStations = await storage.getAllFuelStations();
    if (existingStations.length === 0) {
      await this.generateSampleFuelStations();
    }
    
    // Initialize current fuel prices
    await this.updateAllFuelPrices();
  }

  // Generate sample fuel stations across major routes
  private async generateSampleFuelStations(): Promise<void> {
    const sampleCities = [
      { city: 'Los Angeles', state: 'CA', lat: 34.0522, lng: -118.2437 },
      { city: 'Phoenix', state: 'AZ', lat: 33.4484, lng: -112.0740 },
      { city: 'Houston', state: 'TX', lat: 29.7604, lng: -95.3698 },
      { city: 'Dallas', state: 'TX', lat: 32.7767, lng: -96.7970 },
      { city: 'San Antonio', state: 'TX', lat: 29.4241, lng: -98.4936 },
      { city: 'Chicago', state: 'IL', lat: 41.8781, lng: -87.6298 },
      { city: 'Atlanta', state: 'GA', lat: 33.7490, lng: -84.3880 },
      { city: 'Miami', state: 'FL', lat: 25.7617, lng: -80.1918 },
      { city: 'Orlando', state: 'FL', lat: 28.5383, lng: -81.3792 },
      { city: 'New York', state: 'NY', lat: 40.7128, lng: -74.0060 }
    ];

    for (const location of sampleCities) {
      // Generate 3-5 fuel stations per city
      const numStations = Math.floor(Math.random() * 3) + 3;
      
      for (let i = 0; i < numStations; i++) {
        const brand = this.selectRandomBrand();
        const brandInfo = TRUCK_STOP_BRANDS[brand as keyof typeof TRUCK_STOP_BRANDS];
        
        // Add random offset to location (within ~10 miles)
        const latOffset = (Math.random() - 0.5) * 0.3;
        const lngOffset = (Math.random() - 0.5) * 0.3;
        
        const station: InsertFuelStation = {
          name: `${brandInfo.name} - ${location.city} ${i + 1}`,
          brand: brand as any,
          stationCode: `${brand.toUpperCase()}-${location.state}-${location.city.substring(0, 3).toUpperCase()}-${i + 1}`,
          address: `${1000 + i * 100} Highway ${Math.floor(Math.random() * 99) + 1}`,
          city: location.city,
          state: location.state,
          zipCode: String(10000 + Math.floor(Math.random() * 89999)),
          latitude: String(location.lat + latOffset),
          longitude: String(location.lng + lngOffset),
          hasDiesel: true,
          hasRegular: Math.random() > 0.2,
          hasPremium: Math.random() > 0.5,
          hasDef: true,
          hasTruckParking: Math.random() > 0.3,
          hasShowers: Math.random() > 0.4,
          hasRestaurant: Math.random() > 0.5,
          hasScales: Math.random() > 0.6,
          hasRepairShop: Math.random() > 0.7,
          is24Hours: Math.random() > 0.3,
          phone: `(${Math.floor(Math.random() * 900) + 100}) ${Math.floor(Math.random() * 900) + 100}-${Math.floor(Math.random() * 9000) + 1000}`,
          isActive: true,
          amenities: this.generateAmenities()
        };
        
        await storage.saveFuelStation(station);
      }
    }
    
    console.log(`Generated ${sampleCities.length * 4} sample fuel stations`);
  }

  // Select a random brand based on likelihood
  private selectRandomBrand(): string {
    const random = Math.random();
    let cumulative = 0;
    
    for (const [brand, info] of Object.entries(TRUCK_STOP_BRANDS)) {
      cumulative += info.likelihood;
      if (random < cumulative) {
        return brand;
      }
    }
    
    return 'other';
  }

  // Generate random amenities for a station
  private generateAmenities(): string[] {
    const allAmenities = [
      'WiFi',
      'ATM',
      'CAT Scale',
      'Truck Wash',
      'Laundry',
      'TV Lounge',
      'Game Room',
      'Exercise Room',
      'Pet Area',
      'Convenience Store',
      'Fast Food',
      'Restaurant',
      'Showers',
      'Parking',
      'Truck Service',
      'Tire Service',
      'Oil Change',
      'RV Dump'
    ];
    
    const numAmenities = Math.floor(Math.random() * 8) + 3;
    const amenities: string[] = [];
    
    while (amenities.length < numAmenities) {
      const amenity = allAmenities[Math.floor(Math.random() * allAmenities.length)];
      if (!amenities.includes(amenity)) {
        amenities.push(amenity);
      }
    }
    
    return amenities;
  }

  // Start periodic price updates
  private startPriceUpdates(): void {
    // Update prices every hour
    this.priceUpdateInterval = setInterval(async () => {
      await this.updateAllFuelPrices();
      await this.checkPriceAlerts();
    }, 60 * 60 * 1000); // 1 hour
    
    // Check alerts every 15 minutes
    this.alertCheckInterval = setInterval(async () => {
      await this.checkPriceAlerts();
    }, 15 * 60 * 1000); // 15 minutes
  }

  // Update fuel prices for all stations
  async updateAllFuelPrices(): Promise<void> {
    const stations = await storage.getAllFuelStations();
    
    for (const station of stations) {
      await this.updateStationPrices(station);
    }
    
    // Update regional aggregates
    await this.updateRegionalAggregates();
  }

  // Update prices for a specific station
  async updateStationPrices(station: FuelStation): Promise<void> {
    const fuelTypes = ['diesel', 'regular', 'premium', 'def'] as const;
    const brandInfo = TRUCK_STOP_BRANDS[station.brand as keyof typeof TRUCK_STOP_BRANDS];
    const regionalBase = REGIONAL_PRICE_BASE[station.state as keyof typeof REGIONAL_PRICE_BASE] || REGIONAL_PRICE_BASE.DEFAULT;
    
    for (const fuelType of fuelTypes) {
      // Skip if station doesn't have this fuel type
      if (fuelType === 'diesel' && !station.hasDiesel) continue;
      if (fuelType === 'regular' && !station.hasRegular) continue;
      if (fuelType === 'premium' && !station.hasPremium) continue;
      if (fuelType === 'def' && !station.hasDef) continue;
      
      // Get current price for comparison
      const currentPrice = await storage.getCurrentFuelPrice(station.id, fuelType);
      
      // Calculate new price with variations
      const basePrice = regionalBase[fuelType];
      const brandModifier = brandInfo.priceMod;
      const timeOfDayMod = this.getTimeOfDayModifier();
      const randomMod = (Math.random() - 0.5) * 0.1; // +/- $0.05
      
      const newPrice = basePrice + brandModifier + timeOfDayMod + randomMod;
      const roundedPrice = Math.round(newPrice * 100) / 100; // Round to cents
      
      // Calculate price change
      const priceChange = currentPrice ? roundedPrice - Number(currentPrice.pricePerGallon) : 0;
      const priceChangePercent = currentPrice ? (priceChange / Number(currentPrice.pricePerGallon)) * 100 : 0;
      
      // Mark current price as not current
      if (currentPrice) {
        await storage.updateFuelPriceStatus(currentPrice.id, false);
      }
      
      // Save new price
      const newFuelPrice: InsertFuelPrice = {
        stationId: station.id,
        fuelType: fuelType as any,
        pricePerGallon: String(roundedPrice),
        source: 'mock',
        previousPrice: currentPrice ? currentPrice.pricePerGallon : undefined,
        priceChange: String(priceChange),
        priceChangePercent: String(priceChangePercent),
        isCurrent: true,
        isVerified: true
      };
      
      await storage.saveFuelPrice(newFuelPrice);
      
      // Save to history
      const history: InsertFuelPriceHistory = {
        stationId: station.id,
        fuelType: fuelType as any,
        pricePerGallon: String(roundedPrice),
        timestamp: new Date(),
        source: 'mock'
      };
      
      await storage.saveFuelPriceHistory(history);
    }
  }

  // Get time of day price modifier
  private getTimeOfDayModifier(): number {
    const hour = new Date().getHours();
    
    // Higher prices during peak hours (6-9 AM, 4-7 PM)
    if ((hour >= 6 && hour <= 9) || (hour >= 16 && hour <= 19)) {
      return 0.05; // $0.05 higher
    }
    
    // Lower prices during night hours (11 PM - 5 AM)
    if (hour >= 23 || hour <= 5) {
      return -0.03; // $0.03 lower
    }
    
    return 0;
  }

  // Get fuel prices near a location
  async getFuelPricesNearLocation(lat: number, lng: number, radius: number): Promise<any[]> {
    const stations = await storage.getFuelStationsNearLocation(lat, lng, radius);
    const results = [];
    
    for (const station of stations) {
      const prices = await storage.getStationCurrentPrices(station.id);
      const distance = LocationService.calculateDistance(lat, lng, Number(station.latitude), Number(station.longitude));
      
      results.push({
        station,
        prices,
        distance,
        savings: this.calculateSavings(prices)
      });
    }
    
    // Sort by distance
    results.sort((a, b) => a.distance - b.distance);
    
    return results;
  }

  // Calculate savings compared to average
  private calculateSavings(prices: FuelPrice[]): Record<string, number> {
    const savings: Record<string, number> = {};
    
    for (const price of prices) {
      // Get average price for this fuel type
      const avgPrice = this.getAveragePriceForFuelType(price.fuelType);
      savings[price.fuelType] = avgPrice - Number(price.pricePerGallon);
    }
    
    return savings;
  }

  // Get average price for a fuel type (simplified)
  private getAveragePriceForFuelType(fuelType: string): number {
    const averages = {
      diesel: 3.85,
      regular: 3.35,
      premium: 3.65,
      def: 2.90
    };
    
    return averages[fuelType as keyof typeof averages] || 3.50;
  }

  // Find cheapest fuel stops along a route
  async findCheapestFuelStops(startLat: number, startLng: number, endLat: number, endLng: number, fuelType: string): Promise<RouteFuelStop[]> {
    // Get stations along the route (simplified - just get stations near start, middle, and end)
    const midLat = (startLat + endLat) / 2;
    const midLng = (startLng + endLng) / 2;
    
    const startStations = await this.getFuelPricesNearLocation(startLat, startLng, 20);
    const midStations = await this.getFuelPricesNearLocation(midLat, midLng, 20);
    const endStations = await this.getFuelPricesNearLocation(endLat, endLng, 20);
    
    const allStations = [...startStations, ...midStations, ...endStations];
    
    // Filter by fuel type and sort by price
    const filteredStations = allStations
      .filter(s => s.prices.some((p: FuelPrice) => p.fuelType === fuelType))
      .sort((a, b) => {
        const priceA = a.prices.find((p: FuelPrice) => p.fuelType === fuelType)?.pricePerGallon || 999;
        const priceB = b.prices.find((p: FuelPrice) => p.fuelType === fuelType)?.pricePerGallon || 999;
        return Number(priceA) - Number(priceB);
      });
    
    // Take top 3 cheapest stations
    const recommendedStations = filteredStations.slice(0, 3);
    
    // Create route fuel stops
    const fuelStops: InsertRouteFuelStop[] = [];
    const routeDistance = LocationService.calculateDistance(startLat, startLng, endLat, endLng);
    
    for (let i = 0; i < recommendedStations.length; i++) {
      const station = recommendedStations[i];
      const price = station.prices.find((p: FuelPrice) => p.fuelType === fuelType);
      
      if (price) {
        const distanceFromStart = LocationService.calculateDistance(
          startLat, 
          startLng, 
          Number(station.station.latitude), 
          Number(station.station.longitude)
        );
        
        const stop: InsertRouteFuelStop = {
          stationId: station.station.id,
          sequenceNumber: i + 1,
          distanceFromStart: String(distanceFromStart),
          recommendedFuelType: fuelType as any,
          estimatedGallonsNeeded: String(routeDistance / 6), // Assume 6 MPG
          estimatedCost: String((routeDistance / 6) * Number(price.pricePerGallon)),
          savingsVsAverage: String(station.savings[fuelType] * (routeDistance / 6)),
          optimizationScore: String(100 - (i * 10)), // Simple scoring
          scoreFactors: {
            price: 100 - (i * 10),
            detour: 90 - (station.distance * 2),
            amenities: Object.keys(station.station.amenities || {}).length * 5
          },
          isRecommended: i === 0,
          isMandatory: false
        };
        
        fuelStops.push(stop);
      }
    }
    
    return fuelStops as any;
  }

  // Calculate fuel cost for a route
  async calculateRouteFuelCost(distance: number, vehicleMpg: number, fuelType: string, state?: string): Promise<{
    gallonsNeeded: number;
    averagePricePerGallon: number;
    totalCost: number;
    cheapestCost: number;
    potentialSavings: number;
  }> {
    const gallonsNeeded = distance / vehicleMpg;
    
    // Get average price for the region
    const regionalBase = state && REGIONAL_PRICE_BASE[state as keyof typeof REGIONAL_PRICE_BASE] 
      ? REGIONAL_PRICE_BASE[state as keyof typeof REGIONAL_PRICE_BASE]
      : REGIONAL_PRICE_BASE.DEFAULT;
    
    const averagePricePerGallon = regionalBase[fuelType as keyof typeof regionalBase] || 3.50;
    const totalCost = gallonsNeeded * averagePricePerGallon;
    
    // Calculate cheapest possible cost (10% below average)
    const cheapestPricePerGallon = averagePricePerGallon * 0.9;
    const cheapestCost = gallonsNeeded * cheapestPricePerGallon;
    const potentialSavings = totalCost - cheapestCost;
    
    return {
      gallonsNeeded,
      averagePricePerGallon,
      totalCost,
      cheapestCost,
      potentialSavings
    };
  }

  // Get regional price trends
  async getRegionalPriceTrends(state: string, fuelType?: string): Promise<FuelPriceAggregate[]> {
    return storage.getRegionalPriceTrends(state, fuelType);
  }

  // Update regional aggregates
  private async updateRegionalAggregates(): Promise<void> {
    const states = Object.keys(REGIONAL_PRICE_BASE);
    const fuelTypes = ['diesel', 'regular', 'premium', 'def'];
    
    for (const state of states) {
      if (state === 'DEFAULT') continue;
      
      for (const fuelType of fuelTypes) {
        const stations = await storage.getFuelStationsByState(state);
        
        if (stations.length === 0) continue;
        
        const prices: number[] = [];
        
        for (const station of stations) {
          const price = await storage.getCurrentFuelPrice(station.id, fuelType);
          if (price) {
            prices.push(Number(price.pricePerGallon));
          }
        }
        
        if (prices.length > 0) {
          const avgPrice = prices.reduce((a, b) => a + b, 0) / prices.length;
          const minPrice = Math.min(...prices);
          const maxPrice = Math.max(...prices);
          
          const aggregate: InsertFuelPriceAggregate = {
            state,
            periodStart: new Date(new Date().setMinutes(0, 0, 0)),
            periodEnd: new Date(new Date().setMinutes(59, 59, 999)),
            periodType: 'hourly',
            fuelType: fuelType as any,
            avgPrice: String(avgPrice),
            minPrice: String(minPrice),
            maxPrice: String(maxPrice),
            sampleSize: prices.length,
            stationCount: stations.length
          };
          
          await storage.saveFuelPriceAggregate(aggregate);
        }
      }
    }
  }

  // Check and trigger price alerts
  private async checkPriceAlerts(): Promise<void> {
    const alerts = await storage.getActiveFuelAlerts();
    
    for (const alert of alerts) {
      if (alert.alertType === 'price_drop') {
        // Check if any station in the area has dropped below threshold
        const stations = await this.getFuelPricesNearLocation(
          Number(alert.latitude),
          Number(alert.longitude),
          Number(alert.radius)
        );
        
        for (const station of stations) {
          const price = station.prices.find((p: FuelPrice) => p.fuelType === alert.fuelType);
          
          if (price && Number(price.pricePerGallon) <= Number(alert.priceThreshold)) {
            await this.triggerAlert(alert, station.station, price);
          }
        }
      } else if (alert.alertType === 'price_surge') {
        // Check for significant price increases
        const recentChanges = await storage.getRecentPriceChanges(alert.fuelType);
        
        for (const change of recentChanges) {
          if (Number(change.priceChangePercent) >= Number(alert.percentChangeThreshold)) {
            await this.triggerAlert(alert, undefined, change);
          }
        }
      }
    }
  }

  // Trigger a fuel price alert
  private async triggerAlert(alert: FuelPriceAlert, station?: FuelStation, price?: FuelPrice): Promise<void> {
    await storage.triggerFuelAlert(alert.id, {
      triggeredAt: new Date(),
      triggeredByStationId: station?.id,
      triggeredPrice: price?.pricePerGallon,
      message: this.generateAlertMessage(alert, station, price)
    });
    
    // Emit WebSocket event for real-time updates
    // This will be implemented in the WebSocket service
  }

  // Generate alert message
  private generateAlertMessage(alert: FuelPriceAlert, station?: FuelStation, price?: FuelPrice): string {
    if (alert.alertType === 'price_drop' && station && price) {
      return `Price Alert: ${price.fuelType} fuel at ${station.name} has dropped to $${price.pricePerGallon}/gal`;
    } else if (alert.alertType === 'price_surge' && price) {
      return `Price Alert: ${price.fuelType} fuel prices have increased by ${price.priceChangePercent}%`;
    }
    
    return 'Fuel price alert triggered';
  }

  // Stop service
  stop(): void {
    if (this.priceUpdateInterval) {
      clearInterval(this.priceUpdateInterval);
    }
    if (this.alertCheckInterval) {
      clearInterval(this.alertCheckInterval);
    }
  }
}

// Export singleton instance
export const fuelPriceService = new FuelPriceService();
export default fuelPriceService;