import { 
  PricingRule, 
  ServicePricing, 
  FleetPricingOverride,
  Job,
  FleetAccount,
  ContractorProfile,
  type InsertPricingRule
} from "@shared/schema";
import { storage } from "./storage";

// Type definitions for pricing calculations
export interface PricingConditions {
  timeOfDay?: { start: string; end: string };
  dayOfWeek?: string[];
  dateRange?: { start: Date; end: Date };
  location?: {
    type: 'zone' | 'distance' | 'state' | 'city' | 'coordinates';
    value: string | number | { lat: number; lng: number; radius: number };
  };
  urgency?: {
    type: 'immediate' | 'within_hours' | 'scheduled';
    hours?: number;
  };
  demand?: {
    activeJobs: number;
    availableContractors: number;
    surgeZone?: string;
  };
  customerType?: 'new' | 'returning' | 'vip' | 'fleet';
  fleetTier?: 'standard' | 'silver' | 'gold' | 'platinum';
  volume?: {
    period: 'day' | 'week' | 'month';
    count: number;
  };
  serviceType?: string[];
  vehicleCount?: number;
  referralCode?: string;
  loyaltyPoints?: number;
}

export interface PricingRuleApplied {
  ruleId: string;
  ruleName: string;
  ruleType: string;
  multiplier?: number;
  fixedAmount?: number;
  impact: number;
}

export interface PricingBreakdown {
  basePrice: number;
  distanceCharge?: number;
  timeCharge?: number;
  rulesApplied: PricingRuleApplied[];
  subtotal: number;
  surgeAmount?: number;
  discountAmount?: number;
  taxAmount: number;
  totalAmount: number;
  confidence: 'high' | 'medium' | 'low';
  priceRange?: { min: number; max: number };
  expiresAt?: Date;
  locked: boolean;
}

export interface PricingContext {
  jobType: 'emergency' | 'scheduled';
  serviceTypeId: string;
  location: { lat: number; lng: number; address?: string };
  scheduledFor?: Date;
  customerId?: string;
  fleetAccountId?: string;
  vehicleCount?: number;
  estimatedDuration?: number;
  estimatedDistance?: number;
  referralCode?: string;
  isFirstTime?: boolean;
  loyaltyPoints?: number;
}

class PricingEngine {
  private cache: Map<string, { breakdown: PricingBreakdown; expiresAt: Date }> = new Map();
  private surgeZones: Map<string, number> = new Map();
  private holidays: Date[] = [];
  private baseLocations: { lat: number; lng: number; name: string }[] = [];
  
  constructor() {
    // Initialize holidays (should be loaded from config)
    this.holidays = [
      new Date('2025-12-25'), // Christmas
      new Date('2025-01-01'), // New Year
      new Date('2025-07-04'), // Independence Day
      new Date('2025-11-28'), // Thanksgiving
      // Add more holidays as needed
    ];

    // Initialize base locations (should be loaded from config)
    this.baseLocations = [
      { lat: 40.7128, lng: -74.0060, name: 'NYC Hub' },
      { lat: 34.0522, lng: -118.2437, name: 'LA Hub' },
      { lat: 41.8781, lng: -87.6298, name: 'Chicago Hub' },
      // Add more base locations as needed
    ];

    // Start surge monitoring
    this.startSurgeMonitoring();
  }

  /**
   * Calculate the final price for a job based on all active pricing rules
   */
  async calculatePrice(context: PricingContext): Promise<PricingBreakdown> {
    // Check cache first
    const cacheKey = this.getCacheKey(context);
    const cached = this.cache.get(cacheKey);
    if (cached && cached.expiresAt > new Date()) {
      return { ...cached.breakdown, locked: false };
    }

    // Get base pricing
    const basePricing = await storage.getCurrentPricing(context.serviceTypeId);
    if (!basePricing) {
      throw new Error(`No pricing found for service type ${context.serviceTypeId}`);
    }

    let basePrice = parseFloat(basePricing.basePrice);
    let totalAmount = basePrice;
    const rulesApplied: PricingRuleApplied[] = [];

    // Apply distance-based pricing
    if (context.estimatedDistance && basePricing.perMileRate) {
      const distanceCharge = context.estimatedDistance * parseFloat(basePricing.perMileRate);
      totalAmount += distanceCharge;
    }

    // Apply time-based pricing
    if (context.estimatedDuration && basePricing.perHourRate) {
      const timeCharge = (context.estimatedDuration / 60) * parseFloat(basePricing.perHourRate);
      totalAmount += timeCharge;
    }

    // Get all active pricing rules
    const rules = await storage.getActivePricingRules();
    const now = new Date();
    
    // Sort rules by priority
    const sortedRules = rules.sort((a, b) => b.priority - a.priority);

    // Apply each rule
    for (const rule of sortedRules) {
      if (await this.shouldApplyRule(rule, context, now)) {
        const impact = await this.applyRule(rule, totalAmount, context);
        if (impact !== 0) {
          rulesApplied.push({
            ruleId: rule.id,
            ruleName: rule.name,
            ruleType: rule.ruleType,
            multiplier: rule.multiplier ? parseFloat(rule.multiplier) : undefined,
            fixedAmount: rule.fixedAmount ? parseFloat(rule.fixedAmount) : undefined,
            impact
          });
          totalAmount += impact;
        }
      }
    }

    // Apply fleet pricing overrides if applicable
    if (context.fleetAccountId) {
      const overrides = await storage.getFleetPricingOverrides(context.fleetAccountId);
      const override = overrides.find(o => o.serviceTypeId === context.serviceTypeId);
      if (override) {
        if (override.flatRateOverride) {
          totalAmount = parseFloat(override.flatRateOverride);
        } else if (override.discountPercentage) {
          const discount = totalAmount * (parseFloat(override.discountPercentage) / 100);
          totalAmount -= discount;
          rulesApplied.push({
            ruleId: 'fleet-override',
            ruleName: 'Fleet Account Discount',
            ruleType: 'fleet_discount',
            multiplier: 1 - (parseFloat(override.discountPercentage) / 100),
            impact: -discount
          });
        }
      }
    }

    // Apply surge pricing if active
    const surgeMultiplier = await this.getSurgeMultiplier(context);
    let surgeAmount = 0;
    if (surgeMultiplier > 1) {
      surgeAmount = totalAmount * (surgeMultiplier - 1);
      totalAmount += surgeAmount;
      rulesApplied.push({
        ruleId: 'surge',
        ruleName: 'Surge Pricing',
        ruleType: 'demand_based',
        multiplier: surgeMultiplier,
        impact: surgeAmount
      });
    }

    // Apply minimum charge
    if (basePricing.minimumCharge && totalAmount < parseFloat(basePricing.minimumCharge)) {
      totalAmount = parseFloat(basePricing.minimumCharge);
    }

    // Calculate tax (assume 8% for now, should be configurable by location)
    const taxRate = 0.08;
    const taxAmount = totalAmount * taxRate;

    // Create price breakdown
    const breakdown: PricingBreakdown = {
      basePrice,
      distanceCharge: context.estimatedDistance ? context.estimatedDistance * parseFloat(basePricing.perMileRate || '0') : undefined,
      timeCharge: context.estimatedDuration ? (context.estimatedDuration / 60) * parseFloat(basePricing.perHourRate || '0') : undefined,
      rulesApplied,
      subtotal: totalAmount,
      surgeAmount: surgeAmount > 0 ? surgeAmount : undefined,
      discountAmount: rulesApplied.reduce((sum, r) => r.impact < 0 ? sum + Math.abs(r.impact) : sum, 0) || undefined,
      taxAmount,
      totalAmount: totalAmount + taxAmount,
      confidence: this.getConfidenceLevel(context),
      priceRange: this.getPriceRange(totalAmount, context),
      expiresAt: new Date(Date.now() + 5 * 60 * 1000), // 5 minutes
      locked: false
    };

    // Cache the result
    this.cache.set(cacheKey, {
      breakdown,
      expiresAt: new Date(Date.now() + 5 * 60 * 1000)
    });

    // Store for auditing
    await this.auditPricingDecision(context, breakdown);

    return breakdown;
  }

  /**
   * Check if a rule should be applied based on its conditions
   */
  private async shouldApplyRule(rule: PricingRule, context: PricingContext, now: Date): Promise<boolean> {
    // Check if rule is active
    if (!rule.isActive) return false;

    // Check date range
    if (rule.startDate && new Date(rule.startDate) > now) return false;
    if (rule.endDate && new Date(rule.endDate) < now) return false;

    const conditions = rule.conditions as PricingConditions;
    if (!conditions) return false;

    // Check time of day
    if (conditions.timeOfDay) {
      const currentTime = now.toTimeString().slice(0, 5);
      if (currentTime < conditions.timeOfDay.start || currentTime > conditions.timeOfDay.end) {
        return false;
      }
    }

    // Check day of week
    if (conditions.dayOfWeek && conditions.dayOfWeek.length > 0) {
      const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const currentDay = days[now.getDay()];
      if (!conditions.dayOfWeek.includes(currentDay)) {
        return false;
      }
    }

    // Check location
    if (conditions.location && context.location) {
      if (!this.checkLocationCondition(conditions.location, context.location)) {
        return false;
      }
    }

    // Check urgency
    if (conditions.urgency) {
      if (!this.checkUrgencyCondition(conditions.urgency, context)) {
        return false;
      }
    }

    // Check customer type
    if (conditions.customerType) {
      if (context.isFirstTime && conditions.customerType !== 'new') return false;
      if (!context.isFirstTime && conditions.customerType === 'new') return false;
      if (context.fleetAccountId && conditions.customerType !== 'fleet') return false;
    }

    // Check fleet tier
    if (conditions.fleetTier && context.fleetAccountId) {
      const fleet = await storage.getFleetAccount(context.fleetAccountId);
      if (fleet?.pricingTier !== conditions.fleetTier) return false;
    }

    // Check service type
    if (conditions.serviceType && conditions.serviceType.length > 0) {
      if (!conditions.serviceType.includes(context.serviceTypeId)) return false;
    }

    return true;
  }

  /**
   * Apply a rule and calculate its impact on price
   */
  private async applyRule(rule: PricingRule, currentAmount: number, context: PricingContext): Promise<number> {
    let impact = 0;

    if (rule.multiplier) {
      const multiplier = parseFloat(rule.multiplier);
      impact = currentAmount * (multiplier - 1);
    }

    if (rule.fixedAmount) {
      const fixedAmount = parseFloat(rule.fixedAmount);
      impact = impact + fixedAmount;
    }

    // Apply caps if configured
    const maxImpact = currentAmount * 2; // Max 200% increase
    if (impact > maxImpact) {
      impact = maxImpact;
    }

    return impact;
  }

  /**
   * Check if location conditions are met
   */
  private checkLocationCondition(condition: any, location: { lat: number; lng: number }): boolean {
    if (condition.type === 'distance') {
      const nearestBase = this.getNearestBaseDistance(location);
      return nearestBase > (condition.value as number);
    }

    if (condition.type === 'zone') {
      // Check if location is in specified zone
      // This would need integration with a geocoding service
      return true; // Placeholder
    }

    if (condition.type === 'coordinates' && condition.value) {
      const { lat, lng, radius } = condition.value as any;
      const distance = this.calculateDistance(location, { lat, lng });
      return distance <= radius;
    }

    return false;
  }

  /**
   * Check if urgency conditions are met
   */
  private checkUrgencyCondition(condition: any, context: PricingContext): boolean {
    if (context.jobType !== 'emergency' && condition.type === 'immediate') {
      return false;
    }

    if (condition.type === 'scheduled' && context.jobType === 'scheduled') {
      const hoursUntil = context.scheduledFor 
        ? (context.scheduledFor.getTime() - Date.now()) / (1000 * 60 * 60)
        : 0;
      
      if (condition.hours && hoursUntil > condition.hours) {
        return true;
      }
    }

    if (condition.type === 'within_hours' && context.jobType === 'emergency') {
      return true;
    }

    return false;
  }

  /**
   * Get surge multiplier based on demand
   */
  async getSurgeMultiplier(context: PricingContext): Promise<number> {
    // Check zone-based surge
    const zoneKey = this.getZoneKey(context.location);
    const zoneSurge = this.surgeZones.get(zoneKey) || 1;
    
    // Get demand-based surge
    const stats = await this.getDemandStats(context.location);
    let demandSurge = 1;
    
    if (stats.availableContractors === 0) {
      demandSurge = 2.5; // Max surge
    } else {
      const ratio = stats.activeJobs / stats.availableContractors;
      if (ratio > 5) demandSurge = 2.5;
      else if (ratio > 3) demandSurge = 2.0;
      else if (ratio > 2) demandSurge = 1.5;
      else if (ratio > 1.5) demandSurge = 1.25;
    }

    // Return the higher of the two
    const finalSurge = Math.max(zoneSurge, demandSurge);
    
    // Apply surge cap
    const surgeCap = 3.0; // Maximum 3x surge
    return Math.min(finalSurge, surgeCap);
  }

  /**
   * Get demand statistics for surge calculation
   */
  private async getDemandStats(location: { lat: number; lng: number }): Promise<{
    activeJobs: number;
    availableContractors: number;
  }> {
    // This would query real-time data
    // For now, return mock data
    const activeJobs = await storage.findJobs({
      status: 'assigned',
      limit: 1000
    });

    const contractors = await storage.findContractors({
      isAvailable: true,
      limit: 1000
    });

    // Filter by proximity (within 50 miles)
    const nearbyJobs = activeJobs.length; // Simplified
    const nearbyContractors = contractors.filter(c => {
      if (c.currentLocation) {
        const loc = c.currentLocation as any;
        const distance = this.calculateDistance(location, { lat: loc.lat, lng: loc.lng });
        return distance <= 50;
      }
      return false;
    }).length;

    return {
      activeJobs: nearbyJobs,
      availableContractors: nearbyContractors
    };
  }

  /**
   * Calculate distance between two points
   */
  private calculateDistance(point1: { lat: number; lng: number }, point2: { lat: number; lng: number }): number {
    const R = 3959; // Earth's radius in miles
    const dLat = this.toRad(point2.lat - point1.lat);
    const dLon = this.toRad(point2.lng - point1.lng);
    const lat1 = this.toRad(point1.lat);
    const lat2 = this.toRad(point2.lat);

    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.sin(dLon/2) * Math.sin(dLon/2) * Math.cos(lat1) * Math.cos(lat2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  private toRad(deg: number): number {
    return deg * (Math.PI/180);
  }

  /**
   * Get nearest base distance
   */
  private getNearestBaseDistance(location: { lat: number; lng: number }): number {
    let minDistance = Infinity;
    for (const base of this.baseLocations) {
      const distance = this.calculateDistance(location, base);
      if (distance < minDistance) {
        minDistance = distance;
      }
    }
    return minDistance;
  }

  /**
   * Get confidence level for price estimate
   */
  private getConfidenceLevel(context: PricingContext): 'high' | 'medium' | 'low' {
    if (!context.estimatedDistance || !context.estimatedDuration) {
      return 'low';
    }
    if (context.jobType === 'scheduled' && context.scheduledFor) {
      return 'high';
    }
    return 'medium';
  }

  /**
   * Get price range estimate
   */
  private getPriceRange(baseAmount: number, context: PricingContext): { min: number; max: number } {
    const confidence = this.getConfidenceLevel(context);
    let variance = 0;
    
    if (confidence === 'high') variance = 0.1; // ±10%
    else if (confidence === 'medium') variance = 0.2; // ±20%
    else variance = 0.3; // ±30%

    return {
      min: baseAmount * (1 - variance),
      max: baseAmount * (1 + variance)
    };
  }

  /**
   * Generate cache key for pricing context
   */
  private getCacheKey(context: PricingContext): string {
    return `${context.serviceTypeId}_${context.jobType}_${context.location.lat}_${context.location.lng}_${context.customerId || 'guest'}`;
  }

  /**
   * Get zone key for location
   */
  private getZoneKey(location: { lat: number; lng: number }): string {
    // Simplified zone calculation - would use real geocoding
    const latZone = Math.floor(location.lat / 0.1);
    const lngZone = Math.floor(location.lng / 0.1);
    return `${latZone}_${lngZone}`;
  }

  /**
   * Store pricing decision for auditing
   */
  private async auditPricingDecision(context: PricingContext, breakdown: PricingBreakdown): Promise<void> {
    // Store in database for compliance and analytics
    // This would be implemented with a dedicated audit table
    console.log('Pricing audit:', { context, breakdown });
  }

  /**
   * Lock a price for a confirmed booking
   */
  async lockPrice(jobId: string, breakdown: PricingBreakdown): Promise<void> {
    breakdown.locked = true;
    // Store locked price with job
    await storage.updateJob(jobId, {
      estimatedCost: breakdown.totalAmount.toString()
    });
  }

  /**
   * Start monitoring for surge conditions
   */
  private startSurgeMonitoring(): void {
    setInterval(async () => {
      // Monitor each zone for surge conditions
      const zones = await this.identifySurgeZones();
      for (const [zoneKey, multiplier] of zones) {
        this.surgeZones.set(zoneKey, multiplier);
      }
    }, 60000); // Check every minute
  }

  /**
   * Identify zones that need surge pricing
   */
  private async identifySurgeZones(): Promise<Map<string, number>> {
    const zones = new Map<string, number>();
    // This would analyze real-time data by geographic zones
    // Placeholder implementation
    return zones;
  }

  /**
   * Test pricing rules with sample scenarios
   */
  async testPricingRules(scenarios: PricingContext[]): Promise<PricingBreakdown[]> {
    const results: PricingBreakdown[] = [];
    for (const scenario of scenarios) {
      const breakdown = await this.calculatePrice(scenario);
      results.push(breakdown);
    }
    return results;
  }

  /**
   * Get pricing analytics
   */
  async getPricingAnalytics(startDate: Date, endDate: Date): Promise<{
    averagePrice: number;
    ruleEffectiveness: Map<string, number>;
    surgeFrequency: number;
    priceElasticity: number;
  }> {
    // This would analyze historical pricing data
    return {
      averagePrice: 250,
      ruleEffectiveness: new Map([
        ['rush-hour', 0.15],
        ['weekend', 0.10],
        ['night', 0.20]
      ]),
      surgeFrequency: 0.12,
      priceElasticity: -1.2
    };
  }

  /**
   * Create predefined pricing rules
   */
  async createDefaultPricingRules(): Promise<void> {
    const defaultRules: Partial<InsertPricingRule>[] = [
      {
        name: 'Rush Hour Emergency',
        description: 'Peak hours surcharge for emergency services',
        ruleType: 'time_based',
        conditions: {
          timeOfDay: { start: '06:00', end: '09:00' },
          urgency: { type: 'immediate' }
        } as any,
        multiplier: '1.5',
        priority: 100,
        isActive: true
      },
      {
        name: 'Night Service Premium',
        description: 'Premium pricing for night-time services',
        ruleType: 'time_based',
        conditions: {
          timeOfDay: { start: '22:00', end: '06:00' }
        } as any,
        multiplier: '1.25',
        priority: 90,
        isActive: true
      },
      {
        name: 'Weekend Surcharge',
        description: 'Additional charge for weekend services',
        ruleType: 'time_based',
        conditions: {
          dayOfWeek: ['Saturday', 'Sunday']
        } as any,
        multiplier: '1.15',
        priority: 80,
        isActive: true
      },
      {
        name: 'Immediate Service Premium',
        description: 'Premium for immediate emergency service',
        ruleType: 'urgency_based',
        conditions: {
          urgency: { type: 'immediate' }
        } as any,
        multiplier: '1.5',
        priority: 110,
        isActive: true
      },
      {
        name: 'Advance Booking Discount',
        description: 'Discount for services scheduled 24+ hours in advance',
        ruleType: 'urgency_based',
        conditions: {
          urgency: { type: 'scheduled', hours: 24 }
        } as any,
        multiplier: '0.95',
        priority: 70,
        isActive: true
      },
      {
        name: 'Remote Area Surcharge',
        description: 'Additional charge for remote locations',
        ruleType: 'location_based',
        conditions: {
          location: { type: 'distance', value: 50 }
        } as any,
        fixedAmount: '100',
        priority: 85,
        isActive: true
      },
      {
        name: 'First Time Customer Discount',
        description: 'Welcome discount for new customers',
        ruleType: 'customer_based',
        conditions: {
          customerType: 'new'
        } as any,
        multiplier: '0.9',
        priority: 60,
        isActive: true
      },
      {
        name: 'Fleet Gold Tier Discount',
        description: 'Discount for gold tier fleet accounts',
        ruleType: 'fleet_based',
        conditions: {
          customerType: 'fleet',
          fleetTier: 'gold'
        } as any,
        multiplier: '0.85',
        priority: 95,
        isActive: true
      }
    ];

    for (const rule of defaultRules) {
      await storage.createPricingRule(rule as InsertPricingRule);
    }
  }
}

// Export singleton instance
const pricingEngine = new PricingEngine();
export default pricingEngine;