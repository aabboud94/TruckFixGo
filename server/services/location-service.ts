import { z } from "zod";

// Location data schema
export const LocationSchema = z.object({
  lat: z.number(),
  lng: z.number(),
  address: z.string(),
  formattedAddress: z.string().optional(),
  highwayInfo: z.object({
    highway: z.string(),
    mileMarker: z.string()
  }).optional()
});

export type Location = z.infer<typeof LocationSchema>;

// Highway database with more comprehensive mile marker data
const HIGHWAY_DATABASE = {
  "I-95": {
    name: "Interstate 95",
    states: ["FL", "GA", "SC", "NC", "VA", "MD", "DE", "PA", "NJ", "NY", "CT", "RI", "MA", "NH", "ME"],
    totalMiles: 1924,
    // Comprehensive mile marker coordinates
    markers: generateHighwayMarkers("I-95", [
      { mile: 0, lat: 25.0512, lng: -80.4383, location: "Miami, FL" },
      { mile: 50, lat: 25.9173, lng: -80.2781, location: "Fort Lauderdale, FL" },
      { mile: 100, lat: 26.7153, lng: -80.0534, location: "West Palm Beach, FL" },
      { mile: 200, lat: 27.9975, lng: -80.6081, location: "Fort Pierce, FL" },
      { mile: 300, lat: 29.1875, lng: -81.0484, location: "Daytona Beach, FL" },
      { mile: 400, lat: 30.3322, lng: -81.6557, location: "Jacksonville, FL" },
      { mile: 500, lat: 31.5196, lng: -81.6542, location: "Brunswick, GA" },
      { mile: 600, lat: 32.7765, lng: -79.9311, location: "Charleston, SC" },
      { mile: 700, lat: 33.6891, lng: -78.8867, location: "Myrtle Beach, SC" },
      { mile: 800, lat: 34.9257, lng: -78.6502, location: "Fayetteville, NC" },
      { mile: 900, lat: 36.0726, lng: -79.7920, location: "Greensboro, NC" },
      { mile: 1000, lat: 37.5407, lng: -77.4360, location: "Richmond, VA" },
      { mile: 1100, lat: 38.3047, lng: -77.4609, location: "Fredericksburg, VA" },
      { mile: 1200, lat: 38.9072, lng: -77.0369, location: "Washington, DC" },
      { mile: 1300, lat: 39.9526, lng: -75.1652, location: "Philadelphia, PA" },
      { mile: 1400, lat: 40.7128, lng: -74.0060, location: "New York, NY" },
      { mile: 1500, lat: 41.0534, lng: -73.5387, location: "Stamford, CT" },
      { mile: 1600, lat: 41.8240, lng: -71.4128, location: "Providence, RI" },
      { mile: 1700, lat: 42.3601, lng: -71.0589, location: "Boston, MA" },
      { mile: 1800, lat: 43.0731, lng: -70.7625, location: "Portsmouth, NH" },
      { mile: 1900, lat: 43.6591, lng: -70.2568, location: "Portland, ME" },
    ])
  },
  "I-80": {
    name: "Interstate 80",
    states: ["CA", "NV", "UT", "WY", "NE", "IA", "IL", "IN", "OH", "PA", "NJ"],
    totalMiles: 2900,
    markers: generateHighwayMarkers("I-80", [
      { mile: 0, lat: 37.8044, lng: -122.2708, location: "San Francisco, CA" },
      { mile: 200, lat: 39.5296, lng: -119.8138, location: "Reno, NV" },
      { mile: 500, lat: 40.7608, lng: -111.8910, location: "Salt Lake City, UT" },
      { mile: 800, lat: 41.1400, lng: -104.8202, location: "Cheyenne, WY" },
      { mile: 1000, lat: 41.2565, lng: -95.9345, location: "Omaha, NE" },
      { mile: 1300, lat: 41.6611, lng: -91.5302, location: "Iowa City, IA" },
      { mile: 1500, lat: 41.8781, lng: -87.6298, location: "Chicago, IL" },
      { mile: 1800, lat: 41.5906, lng: -81.5378, location: "Cleveland, OH" },
      { mile: 2100, lat: 40.4406, lng: -79.9959, location: "Pittsburgh, PA" },
      { mile: 2500, lat: 40.9646, lng: -75.1638, location: "Stroudsburg, PA" },
      { mile: 2900, lat: 40.7357, lng: -74.1724, location: "Newark, NJ" },
    ])
  },
  "I-10": {
    name: "Interstate 10",
    states: ["CA", "AZ", "NM", "TX", "LA", "MS", "AL", "FL"],
    totalMiles: 2460,
    markers: generateHighwayMarkers("I-10", [
      { mile: 0, lat: 34.0195, lng: -118.4912, location: "Santa Monica, CA" },
      { mile: 200, lat: 33.4484, lng: -112.0740, location: "Phoenix, AZ" },
      { mile: 400, lat: 32.2217, lng: -110.9265, location: "Tucson, AZ" },
      { mile: 500, lat: 31.7619, lng: -106.4850, location: "El Paso, TX" },
      { mile: 700, lat: 31.7587, lng: -102.5077, location: "Midland, TX" },
      { mile: 900, lat: 30.2672, lng: -97.7431, location: "Austin, TX" },
      { mile: 1000, lat: 29.7604, lng: -95.3698, location: "Houston, TX" },
      { mile: 1200, lat: 30.2241, lng: -92.0198, location: "Lafayette, LA" },
      { mile: 1400, lat: 30.4515, lng: -91.1871, location: "Baton Rouge, LA" },
      { mile: 1600, lat: 30.3965, lng: -88.8853, location: "Mobile, AL" },
      { mile: 1800, lat: 30.4213, lng: -87.2169, location: "Pensacola, FL" },
      { mile: 2000, lat: 30.4383, lng: -84.2807, location: "Tallahassee, FL" },
      { mile: 2200, lat: 29.6516, lng: -82.3248, location: "Gainesville, FL" },
      { mile: 2460, lat: 30.3322, lng: -81.6557, location: "Jacksonville, FL" },
    ])
  },
  "I-40": {
    name: "Interstate 40",
    states: ["CA", "AZ", "NM", "TX", "OK", "AR", "TN", "NC"],
    totalMiles: 2555,
    markers: generateHighwayMarkers("I-40", [
      { mile: 0, lat: 34.7465, lng: -117.1817, location: "Barstow, CA" },
      { mile: 300, lat: 35.1983, lng: -111.6513, location: "Flagstaff, AZ" },
      { mile: 600, lat: 35.0844, lng: -106.6504, location: "Albuquerque, NM" },
      { mile: 800, lat: 35.2220, lng: -101.8313, location: "Amarillo, TX" },
      { mile: 1000, lat: 35.4676, lng: -97.5164, location: "Oklahoma City, OK" },
      { mile: 1200, lat: 35.3733, lng: -94.4288, location: "Fort Smith, AR" },
      { mile: 1400, lat: 35.1175, lng: -89.9711, location: "Memphis, TN" },
      { mile: 1600, lat: 36.1627, lng: -86.7816, location: "Nashville, TN" },
      { mile: 1800, lat: 35.9606, lng: -83.9207, location: "Knoxville, TN" },
      { mile: 2000, lat: 35.5951, lng: -82.5515, location: "Asheville, NC" },
      { mile: 2200, lat: 35.7796, lng: -78.6382, location: "Raleigh, NC" },
      { mile: 2555, lat: 35.5951, lng: -77.4013, location: "Wilmington, NC" },
    ])
  },
  "I-70": {
    name: "Interstate 70",
    states: ["UT", "CO", "KS", "MO", "IL", "IN", "OH", "WV", "PA", "MD"],
    totalMiles: 2151,
    markers: generateHighwayMarkers("I-70", [
      { mile: 0, lat: 38.9910, lng: -110.1607, location: "Cove Fort, UT" },
      { mile: 200, lat: 39.0639, lng: -108.5506, location: "Grand Junction, CO" },
      { mile: 400, lat: 39.7392, lng: -104.9903, location: "Denver, CO" },
      { mile: 600, lat: 39.1141, lng: -101.7113, location: "Goodland, KS" },
      { mile: 800, lat: 38.8807, lng: -99.3268, location: "Hays, KS" },
      { mile: 1000, lat: 39.0997, lng: -94.5786, location: "Kansas City, MO" },
      { mile: 1200, lat: 38.6270, lng: -90.1994, location: "St. Louis, MO" },
      { mile: 1400, lat: 39.7684, lng: -86.1581, location: "Indianapolis, IN" },
      { mile: 1600, lat: 39.9612, lng: -82.9988, location: "Columbus, OH" },
      { mile: 1800, lat: 40.0415, lng: -80.6229, location: "Wheeling, WV" },
      { mile: 2000, lat: 40.4406, lng: -79.9959, location: "Pittsburgh, PA" },
      { mile: 2151, lat: 39.2904, lng: -76.6122, location: "Baltimore, MD" },
    ])
  }
};

// Helper function to generate interpolated markers
function generateHighwayMarkers(highway: string, keyMarkers: Array<{mile: number, lat: number, lng: number, location: string}>) {
  const result: Record<number, {lat: number, lng: number, location?: string}> = {};
  
  // Add key markers
  keyMarkers.forEach(marker => {
    result[marker.mile] = { lat: marker.lat, lng: marker.lng, location: marker.location };
  });
  
  // Interpolate between key markers every 10 miles
  for (let i = 0; i < keyMarkers.length - 1; i++) {
    const start = keyMarkers[i];
    const end = keyMarkers[i + 1];
    const distance = end.mile - start.mile;
    
    for (let mile = start.mile + 10; mile < end.mile; mile += 10) {
      const ratio = (mile - start.mile) / distance;
      result[mile] = {
        lat: start.lat + (end.lat - start.lat) * ratio,
        lng: start.lng + (end.lng - start.lng) * ratio
      };
    }
  }
  
  return result;
}

export class LocationService {
  /**
   * Geocode an address to coordinates (mock implementation)
   * In production, this would use Google Geocoding API
   */
  static async geocodeAddress(address: string): Promise<Location | null> {
    // Simple mock geocoding - in production would use Google Geocoding API
    // For now, return coordinates for major cities if mentioned
    const cityCoordinates: Record<string, {lat: number, lng: number}> = {
      "miami": { lat: 25.7617, lng: -80.1918 },
      "jacksonville": { lat: 30.3322, lng: -81.6557 },
      "orlando": { lat: 28.5383, lng: -81.3792 },
      "tampa": { lat: 27.9506, lng: -82.4572 },
      "atlanta": { lat: 33.7490, lng: -84.3880 },
      "new york": { lat: 40.7128, lng: -74.0060 },
      "chicago": { lat: 41.8781, lng: -87.6298 },
      "los angeles": { lat: 34.0522, lng: -118.2437 },
      "houston": { lat: 29.7604, lng: -95.3698 },
      "phoenix": { lat: 33.4484, lng: -112.0740 },
    };

    const addressLower = address.toLowerCase();
    for (const [city, coords] of Object.entries(cityCoordinates)) {
      if (addressLower.includes(city)) {
        return {
          lat: coords.lat,
          lng: coords.lng,
          address: address,
          formattedAddress: address
        };
      }
    }

    // Default fallback - center of USA
    return {
      lat: 39.8283,
      lng: -98.5795,
      address: address,
      formattedAddress: address
    };
  }

  /**
   * Reverse geocode coordinates to address (mock implementation)
   * In production, this would use Google Geocoding API
   */
  static async reverseGeocode(lat: number, lng: number): Promise<string> {
    // Mock implementation - in production would use Google Geocoding API
    // For now, return formatted coordinates
    return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
  }

  /**
   * Get coordinates from highway and mile marker
   */
  static getHighwayLocation(highway: string, mileMarker: number, direction?: string): Location | null {
    const highwayData = HIGHWAY_DATABASE[highway as keyof typeof HIGHWAY_DATABASE];
    if (!highwayData) {
      return null;
    }

    if (mileMarker < 0 || mileMarker > highwayData.totalMiles) {
      return null;
    }

    const markers = Object.entries(highwayData.markers)
      .map(([mile, coords]) => ({ mile: Number(mile), ...coords }))
      .sort((a, b) => a.mile - b.mile);

    // Find surrounding markers
    let lowerMarker = markers[0];
    let upperMarker = markers[markers.length - 1];

    for (let i = 0; i < markers.length - 1; i++) {
      if (mileMarker >= markers[i].mile && mileMarker <= markers[i + 1].mile) {
        lowerMarker = markers[i];
        upperMarker = markers[i + 1];
        break;
      }
    }

    // Linear interpolation
    const ratio = (mileMarker - lowerMarker.mile) / (upperMarker.mile - lowerMarker.mile);
    const lat = lowerMarker.lat + (upperMarker.lat - lowerMarker.lat) * ratio;
    const lng = lowerMarker.lng + (upperMarker.lng - lowerMarker.lng) * ratio;

    const directionStr = direction ? ` ${direction.charAt(0).toUpperCase() + direction.slice(1)}bound` : "";
    const address = `${highway} Mile ${mileMarker}${directionStr}`;
    
    // Add nearest location reference if available
    let nearestLocation = "";
    if (lowerMarker.location && upperMarker.location) {
      if (ratio < 0.5 && lowerMarker.location) {
        nearestLocation = ` (near ${lowerMarker.location})`;
      } else if (upperMarker.location) {
        nearestLocation = ` (near ${upperMarker.location})`;
      }
    }

    return {
      lat,
      lng,
      address,
      formattedAddress: `${address}${nearestLocation}`,
      highwayInfo: {
        highway,
        mileMarker: mileMarker.toString()
      }
    };
  }

  /**
   * Validate location data
   */
  static validateLocation(location: any): Location | null {
    try {
      return LocationSchema.parse(location);
    } catch (error) {
      console.error("Invalid location data:", error);
      return null;
    }
  }

  /**
   * Calculate distance between two locations (in miles)
   */
  static calculateDistance(loc1: {lat: number, lng: number}, loc2: {lat: number, lng: number}): number {
    const R = 3959; // Earth's radius in miles
    const dLat = (loc2.lat - loc1.lat) * Math.PI / 180;
    const dLng = (loc2.lng - loc1.lng) * Math.PI / 180;
    
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(loc1.lat * Math.PI / 180) * Math.cos(loc2.lat * Math.PI / 180) *
              Math.sin(dLng / 2) * Math.sin(dLng / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;
    
    return Math.round(distance * 10) / 10; // Round to 1 decimal place
  }

  /**
   * Check if location is within service area (mock implementation)
   * In production, this would check against actual service area polygons
   */
  static async isInServiceArea(location: {lat: number, lng: number}): Promise<boolean> {
    // Mock implementation - check if in continental US roughly
    const isInUS = location.lat >= 24 && location.lat <= 49 && 
                   location.lng >= -125 && location.lng <= -66;
    return isInUS;
  }

  /**
   * Get nearby contractors (mock implementation)
   * In production, this would query the database for nearby contractors
   */
  static async getNearbyContractors(location: {lat: number, lng: number}, radiusMiles: number = 50): Promise<any[]> {
    // Mock implementation - return empty array for now
    // In production, would query database with geographic search
    return [];
  }

  /**
   * Format location for display
   */
  static formatLocationDisplay(location: Location): string {
    if (location.highwayInfo) {
      return location.formattedAddress || location.address;
    }
    
    if (location.formattedAddress) {
      return location.formattedAddress;
    }
    
    return location.address;
  }

  /**
   * Get estimated travel time between locations (mock)
   * In production, this would use Google Directions API
   */
  static async getEstimatedTravelTime(origin: {lat: number, lng: number}, destination: {lat: number, lng: number}): Promise<number> {
    // Mock implementation - rough estimate based on distance
    const distance = this.calculateDistance(origin, destination);
    const avgSpeedMph = 45; // Average speed assumption
    const minutes = Math.round((distance / avgSpeedMph) * 60);
    return minutes;
  }
}

export default LocationService;