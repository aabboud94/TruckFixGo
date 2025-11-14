import { RouteStop, type InsertRouteStop } from "@shared/schema";
import LocationService from "./location-service";

interface OptimizationOptions {
  strategy: 'shortest' | 'fastest' | 'most_profitable';
  constraints?: {
    maxDuration?: number; // Maximum route duration in minutes
    maxDistance?: number; // Maximum route distance in miles
    timeWindows?: Map<string, { start: Date; end: Date }>; // Time windows for stops
    priorities?: Map<string, number>; // Priority levels for stops (higher = more important)
  };
}

interface StopWithMetrics extends RouteStop {
  distanceToNext?: number;
  timeToNext?: number;
  profitValue?: number;
}

interface RouteMetrics {
  totalDistance: number;
  totalDuration: number;
  totalProfit: number;
  feasible: boolean;
  violations: string[];
}

class RouteOptimizerService {
  private locationService: LocationService;
  private distanceCache: Map<string, number> = new Map();

  constructor() {
    this.locationService = new LocationService();
  }

  /**
   * Optimize route using appropriate algorithm based on strategy
   */
  async optimizeRoute(
    stops: RouteStop[],
    options: OptimizationOptions
  ): Promise<{
    optimizedStops: RouteStop[];
    metrics: RouteMetrics;
    improvement: {
      distanceSaved: number;
      timeSaved: number;
    };
  }> {
    if (stops.length <= 2) {
      // No optimization needed for 2 or fewer stops
      return {
        optimizedStops: stops,
        metrics: await this.calculateRouteMetrics(stops),
        improvement: { distanceSaved: 0, timeSaved: 0 }
      };
    }

    // Calculate original metrics
    const originalMetrics = await this.calculateRouteMetrics(stops);

    // Build distance matrix
    const distanceMatrix = await this.buildDistanceMatrix(stops);

    let optimizedOrder: number[];
    switch (options.strategy) {
      case 'shortest':
        optimizedOrder = await this.nearestNeighbor(distanceMatrix);
        break;
      case 'fastest':
        optimizedOrder = await this.optimizeForTime(stops, distanceMatrix);
        break;
      case 'most_profitable':
        optimizedOrder = await this.optimizeForProfit(stops, distanceMatrix, options.constraints);
        break;
      default:
        optimizedOrder = await this.nearestNeighbor(distanceMatrix);
    }

    // Apply 2-opt improvement
    optimizedOrder = await this.twoOptImprovement(optimizedOrder, distanceMatrix);

    // Reorder stops based on optimized order
    const optimizedStops = optimizedOrder.map(index => ({
      ...stops[index],
      stopOrder: optimizedOrder.indexOf(index) + 1
    }));

    // Calculate new metrics
    const newMetrics = await this.calculateRouteMetrics(optimizedStops);

    return {
      optimizedStops,
      metrics: newMetrics,
      improvement: {
        distanceSaved: originalMetrics.totalDistance - newMetrics.totalDistance,
        timeSaved: originalMetrics.totalDuration - newMetrics.totalDuration
      }
    };
  }

  /**
   * Build distance matrix between all stops
   */
  private async buildDistanceMatrix(stops: RouteStop[]): Promise<number[][]> {
    const n = stops.length;
    const matrix: number[][] = Array(n).fill(null).map(() => Array(n).fill(0));

    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        const distance = await this.getDistance(stops[i], stops[j]);
        matrix[i][j] = distance;
        matrix[j][i] = distance;
      }
    }

    return matrix;
  }

  /**
   * Get distance between two stops (with caching)
   */
  private async getDistance(stop1: RouteStop, stop2: RouteStop): Promise<number> {
    const cacheKey = `${stop1.id}-${stop2.id}`;
    const reverseCacheKey = `${stop2.id}-${stop1.id}`;

    if (this.distanceCache.has(cacheKey)) {
      return this.distanceCache.get(cacheKey)!;
    }
    if (this.distanceCache.has(reverseCacheKey)) {
      return this.distanceCache.get(reverseCacheKey)!;
    }

    const location1 = stop1.location as { lat: number; lng: number };
    const location2 = stop2.location as { lat: number; lng: number };

    const distance = this.locationService.calculateDistance(
      location1.lat,
      location1.lng,
      location2.lat,
      location2.lng
    );

    this.distanceCache.set(cacheKey, distance);
    return distance;
  }

  /**
   * Nearest Neighbor Algorithm - Simple greedy approach
   */
  private async nearestNeighbor(distanceMatrix: number[][]): Promise<number[]> {
    const n = distanceMatrix.length;
    const visited = new Array(n).fill(false);
    const route: number[] = [];

    // Start from the first stop
    let current = 0;
    visited[current] = true;
    route.push(current);

    // Visit remaining stops
    for (let i = 1; i < n; i++) {
      let nearestIndex = -1;
      let nearestDistance = Infinity;

      for (let j = 0; j < n; j++) {
        if (!visited[j] && distanceMatrix[current][j] < nearestDistance) {
          nearestDistance = distanceMatrix[current][j];
          nearestIndex = j;
        }
      }

      if (nearestIndex !== -1) {
        visited[nearestIndex] = true;
        route.push(nearestIndex);
        current = nearestIndex;
      }
    }

    return route;
  }

  /**
   * 2-Opt Improvement - Local search optimization
   */
  private async twoOptImprovement(route: number[], distanceMatrix: number[][]): Promise<number[]> {
    const n = route.length;
    let improved = true;
    let bestRoute = [...route];
    let bestDistance = this.calculateTotalDistance(bestRoute, distanceMatrix);

    while (improved) {
      improved = false;

      for (let i = 1; i < n - 2; i++) {
        for (let j = i + 1; j < n; j++) {
          if (j - i === 1) continue;

          const newRoute = [...bestRoute];
          // Reverse the route between i and j
          const reversed = newRoute.slice(i, j).reverse();
          newRoute.splice(i, j - i, ...reversed);

          const newDistance = this.calculateTotalDistance(newRoute, distanceMatrix);

          if (newDistance < bestDistance) {
            bestRoute = newRoute;
            bestDistance = newDistance;
            improved = true;
          }
        }
      }
    }

    return bestRoute;
  }

  /**
   * Calculate total distance for a route
   */
  private calculateTotalDistance(route: number[], distanceMatrix: number[][]): number {
    let total = 0;
    for (let i = 0; i < route.length - 1; i++) {
      total += distanceMatrix[route[i]][route[i + 1]];
    }
    return total;
  }

  /**
   * Optimize for time (considering traffic patterns and time windows)
   */
  private async optimizeForTime(
    stops: RouteStop[],
    distanceMatrix: number[][]
  ): Promise<number[]> {
    // For now, use distance as a proxy for time
    // In a real implementation, this would consider:
    // - Traffic patterns at different times
    // - Time windows for deliveries
    // - Service duration at each stop
    const timeMatrix = distanceMatrix.map(row => 
      row.map(distance => distance * 2) // Assume 30 mph average speed
    );

    // Add service time penalties for stops with time windows
    const route = await this.nearestNeighbor(timeMatrix);
    return route;
  }

  /**
   * Optimize for profit (considering job values and costs)
   */
  private async optimizeForProfit(
    stops: RouteStop[],
    distanceMatrix: number[][],
    constraints?: OptimizationOptions['constraints']
  ): Promise<number[]> {
    // Calculate profit value for each stop (mock implementation)
    const stopValues = stops.map((stop, index) => {
      // In a real implementation, this would fetch job values from the database
      const baseValue = 100; // Base value per stop
      const priority = constraints?.priorities?.get(stop.id!) || 1;
      return baseValue * priority;
    });

    // Use a modified nearest neighbor that considers profit/distance ratio
    const n = stops.length;
    const visited = new Array(n).fill(false);
    const route: number[] = [];

    // Start from the highest value stop
    let current = stopValues.indexOf(Math.max(...stopValues));
    visited[current] = true;
    route.push(current);

    // Visit remaining stops based on profit/distance ratio
    for (let i = 1; i < n; i++) {
      let bestIndex = -1;
      let bestRatio = -Infinity;

      for (let j = 0; j < n; j++) {
        if (!visited[j]) {
          const distance = distanceMatrix[current][j] || 1; // Avoid division by zero
          const ratio = stopValues[j] / distance;
          
          if (ratio > bestRatio) {
            bestRatio = ratio;
            bestIndex = j;
          }
        }
      }

      if (bestIndex !== -1) {
        visited[bestIndex] = true;
        route.push(bestIndex);
        current = bestIndex;
      }
    }

    return route;
  }

  /**
   * Calculate comprehensive route metrics
   */
  async calculateRouteMetrics(stops: RouteStop[]): Promise<RouteMetrics> {
    let totalDistance = 0;
    let totalDuration = 0;
    let totalProfit = 0;
    const violations: string[] = [];

    for (let i = 0; i < stops.length - 1; i++) {
      const distance = await this.getDistance(stops[i], stops[i + 1]);
      totalDistance += distance;
      totalDuration += (distance / 30) * 60; // Assume 30 mph average
    }

    // Add service time at each stop
    totalDuration += stops.length * 30; // 30 minutes per stop average

    // Check for violations (time windows, max duration, etc.)
    if (totalDuration > 480) { // 8 hours max
      violations.push('Route exceeds maximum duration of 8 hours');
    }

    return {
      totalDistance,
      totalDuration,
      totalProfit,
      feasible: violations.length === 0,
      violations
    };
  }

  /**
   * Handle dynamic route adjustments when stops are added/removed
   */
  async adjustRoute(
    currentStops: RouteStop[],
    newStop: InsertRouteStop,
    action: 'add' | 'remove'
  ): Promise<RouteStop[]> {
    if (action === 'remove') {
      // Remove the stop and maintain order
      return currentStops
        .filter(stop => stop.jobId !== newStop.jobId)
        .map((stop, index) => ({ ...stop, stopOrder: index + 1 }));
    }

    // Find best insertion point for new stop
    const distanceMatrix = await this.buildDistanceMatrix(currentStops);
    let bestPosition = currentStops.length;
    let minIncrease = Infinity;

    // Convert newStop to RouteStop type for distance calculation
    const tempStop = { ...newStop, id: 'temp' } as RouteStop;

    for (let i = 0; i <= currentStops.length; i++) {
      const testStops = [...currentStops];
      testStops.splice(i, 0, tempStop);
      
      let increase = 0;
      if (i > 0) {
        increase += await this.getDistance(testStops[i - 1], tempStop);
      }
      if (i < currentStops.length) {
        increase += await this.getDistance(tempStop, testStops[i + 1]);
      }
      if (i > 0 && i < currentStops.length) {
        increase -= distanceMatrix[i - 1][i];
      }

      if (increase < minIncrease) {
        minIncrease = increase;
        bestPosition = i;
      }
    }

    // Insert at best position
    const updatedStops = [...currentStops];
    updatedStops.splice(bestPosition, 0, tempStop);
    
    // Update stop orders
    return updatedStops.map((stop, index) => ({ ...stop, stopOrder: index + 1 }));
  }

  /**
   * Estimate time and distance between two locations
   */
  async estimateSegment(
    from: { lat: number; lng: number },
    to: { lat: number; lng: number }
  ): Promise<{
    distance: number;
    duration: number;
    polyline?: string;
  }> {
    const distance = this.locationService.calculateDistance(
      from.lat,
      from.lng,
      to.lat,
      to.lng
    );

    // Estimate duration based on average speed (adjust based on time of day, traffic, etc.)
    const averageSpeedMph = 30;
    const duration = (distance / averageSpeedMph) * 60; // Convert to minutes

    return {
      distance,
      duration,
      // Polyline would be fetched from a routing service in production
      polyline: undefined
    };
  }

  /**
   * Clear distance cache (useful when coordinates are updated)
   */
  clearCache(): void {
    this.distanceCache.clear();
  }
}

// Export singleton instance
export default new RouteOptimizerService();