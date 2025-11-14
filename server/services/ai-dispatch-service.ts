import { storage } from '../storage';
import { 
  type Job, 
  type ContractorProfile, 
  type AiAssignmentScore,
  type AssignmentPreferences 
} from '@shared/schema';
import OpenAI from "openai";
import LocationService from './location-service';
import { availabilityService } from './availability-service';

// OpenAI configuration using Replit's AI Integration
const hasAIKey = process.env.AI_INTEGRATIONS_OPENAI_API_KEY && process.env.AI_INTEGRATIONS_OPENAI_BASE_URL;
const openai = hasAIKey ? new OpenAI({
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY
}) : null;

interface ScoringFactors {
  skills_match: number;
  distance: number;
  response_time: number;
  completion_rate: number;
  customer_satisfaction: number;
  workload_balance: number;
  availability_score: number;
  equipment_match: number;
  price_competitiveness: number;
  time_of_day_performance: number;
  weather_suitability: number;
  complexity_handling: number;
}

interface AssignmentResult {
  contractorId: string;
  score: number;
  factors: ScoringFactors;
  recommendation: string;
  confidence: number;
}

interface ContractorMetrics {
  totalJobs: number;
  completedJobs: number;
  averageRating: number;
  responseTime: number; // minutes
  completionRate: number;
  customerSatisfactionScore: number;
  todayJobCount: number;
  weekJobCount: number;
  currentWorkload: number;
  lastJobCompletedAt?: Date;
}

class AIDispatchService {
  // Weight configuration for different factors
  private readonly FACTOR_WEIGHTS = {
    skills_match: 0.25,
    distance: 0.20,
    response_time: 0.15,
    completion_rate: 0.10,
    customer_satisfaction: 0.10,
    workload_balance: 0.05,
    availability_score: 0.05,
    equipment_match: 0.03,
    price_competitiveness: 0.02,
    time_of_day_performance: 0.02,
    weather_suitability: 0.02,
    complexity_handling: 0.01
  };

  // Threshold configurations
  private readonly MAX_DISTANCE_MILES = 100;
  private readonly MAX_DAILY_JOBS = 10;
  private readonly MIN_SCORE_THRESHOLD = 60;
  private readonly AUTO_ACCEPT_THRESHOLD = 85;

  /**
   * Calculate AI assignment scores for all eligible contractors for a job
   */
  async calculateAIAssignmentScores(jobId: string): Promise<AssignmentResult[]> {
    try {
      const job = await storage.getJob(jobId);
      if (!job) {
        throw new Error('Job not found');
      }

      // Get all available contractors
      const availableContractors = await this.getEligibleContractors(job);
      
      if (availableContractors.length === 0) {
        console.log('[AI Dispatch] No eligible contractors found for job', jobId);
        return [];
      }

      // Calculate scores for each contractor
      const scoringPromises = availableContractors.map(contractor => 
        this.scoreContractor(job, contractor)
      );

      const scores = await Promise.all(scoringPromises);

      // Sort by score descending
      scores.sort((a, b) => b.score - a.score);

      // Save scores to database
      for (const result of scores) {
        await storage.saveAiAssignmentScore({
          jobId,
          contractorId: result.contractorId,
          score: result.score.toString(),
          factors: result.factors,
          assignmentRecommendation: result.recommendation,
          confidenceLevel: result.confidence.toString()
        });
      }

      return scores;
    } catch (error) {
      console.error('[AI Dispatch] Error calculating scores:', error);
      throw error;
    }
  }

  /**
   * Get the optimal contractor for a job using AI scoring
   */
  async getOptimalContractor(jobId: string): Promise<AssignmentResult | null> {
    const scores = await this.calculateAIAssignmentScores(jobId);
    
    if (scores.length === 0) {
      return null;
    }

    // Return the top scorer if above threshold
    const topScore = scores[0];
    if (topScore.score >= this.MIN_SCORE_THRESHOLD) {
      return topScore;
    }

    console.log('[AI Dispatch] Top score below threshold:', topScore.score);
    return null;
  }

  /**
   * Get eligible contractors for a job
   */
  private async getEligibleContractors(job: Job): Promise<ContractorProfile[]> {
    // Get all active contractors
    const contractors = await storage.getAvailableContractors();
    
    // Filter by basic eligibility
    const eligible = [];
    for (const contractor of contractors) {
      // Check if contractor is available
      const isAvailable = await availabilityService.isContractorAvailable(
        contractor.userId,
        new Date()
      );

      if (!isAvailable) {
        continue;
      }

      // Check distance if location is available
      if (contractor.baseLocationLat && contractor.baseLocationLon && job.location) {
        const jobLocation = job.location as any;
        const distance = LocationService.calculateDistance(
          Number(contractor.baseLocationLat),
          Number(contractor.baseLocationLon),
          jobLocation.lat,
          jobLocation.lng
        );

        if (distance > this.MAX_DISTANCE_MILES) {
          continue;
        }
      }

      eligible.push(contractor);
    }

    return eligible;
  }

  /**
   * Score a contractor for a specific job
   */
  private async scoreContractor(job: Job, contractor: ContractorProfile): Promise<AssignmentResult> {
    const factors = await this.calculateScoringFactors(job, contractor);
    const score = this.calculateWeightedScore(factors);
    const recommendation = await this.generateRecommendation(job, contractor, factors, score);
    
    return {
      contractorId: contractor.userId,
      score,
      factors,
      recommendation,
      confidence: this.calculateConfidence(factors)
    };
  }

  /**
   * Calculate all scoring factors for a contractor
   */
  private async calculateScoringFactors(job: Job, contractor: ContractorProfile): Promise<ScoringFactors> {
    const metrics = await this.getContractorMetrics(contractor.userId);
    const preferences = await storage.getAssignmentPreferences(contractor.userId);
    const jobComplexity = await this.analyzeJobComplexity(job);

    // Skills match score
    const skillsMatch = await this.calculateSkillsMatch(job, contractor, jobComplexity);

    // Distance score
    const distanceScore = await this.calculateDistanceScore(job, contractor);

    // Response time score
    const responseTimeScore = this.calculateResponseTimeScore(metrics.responseTime);

    // Completion rate score
    const completionRateScore = this.calculateCompletionRateScore(metrics.completionRate);

    // Customer satisfaction score
    const customerSatisfactionScore = metrics.customerSatisfactionScore;

    // Workload balance score
    const workloadBalanceScore = this.calculateWorkloadBalance(metrics, preferences);

    // Availability score
    const availabilityScore = await this.calculateAvailabilityScore(contractor, job);

    // Equipment match score
    const equipmentMatchScore = this.calculateEquipmentMatch(job, contractor);

    // Price competitiveness
    const priceCompetitivenessScore = await this.calculatePriceCompetitiveness(contractor, job);

    // Time of day performance
    const timeOfDayPerformance = this.calculateTimeOfDayPerformance(contractor, new Date());

    // Weather suitability
    const weatherSuitability = await this.calculateWeatherSuitability(contractor);

    // Complexity handling
    const complexityHandling = this.calculateComplexityHandling(contractor, jobComplexity);

    return {
      skills_match: skillsMatch,
      distance: distanceScore,
      response_time: responseTimeScore,
      completion_rate: completionRateScore,
      customer_satisfaction: customerSatisfactionScore,
      workload_balance: workloadBalanceScore,
      availability_score: availabilityScore,
      equipment_match: equipmentMatchScore,
      price_competitiveness: priceCompetitivenessScore,
      time_of_day_performance: timeOfDayPerformance,
      weather_suitability: weatherSuitability,
      complexity_handling: complexityHandling
    };
  }

  /**
   * Calculate skills match score
   */
  private async calculateSkillsMatch(job: Job, contractor: ContractorProfile, jobComplexity: string): Promise<number> {
    if (!contractor.specializations) {
      return 50; // Default score if no specializations
    }

    const specializations = contractor.specializations as any;
    const serviceType = job.serviceType;

    // Map service type to specialization categories
    const serviceSpecializationMap: Record<string, string[]> = {
      'tire_repair': ['tires'],
      'tire_replacement': ['tires'],
      'engine_repair': ['engine_repair'],
      'transmission': ['transmission'],
      'electrical': ['electrical'],
      'brakes': ['brakes'],
      'pm_service': ['engine_repair', 'brakes', 'tires'],
      'refrigeration': ['refrigeration']
    };

    const requiredSpecializations = serviceSpecializationMap[serviceType] || [];
    if (requiredSpecializations.length === 0) {
      return 75; // Default score for unspecialized jobs
    }

    let totalScore = 0;
    let count = 0;

    for (const spec of requiredSpecializations) {
      if (specializations[spec]) {
        const specData = specializations[spec];
        let score = 0;
        
        // Score based on expertise level
        switch (specData.level) {
          case 'expert': score = 100; break;
          case 'advanced': score = 85; break;
          case 'intermediate': score = 70; break;
          case 'beginner': score = 50; break;
          default: score = 40;
        }

        // Bonus for years of experience
        score += Math.min(specData.years * 2, 20);

        // Bonus for certifications
        score += Math.min(specData.certifications?.length * 5, 15);

        totalScore += Math.min(score, 100);
        count++;
      } else {
        totalScore += 30; // Low score if missing specialization
        count++;
      }
    }

    return count > 0 ? Math.round(totalScore / count) : 50;
  }

  /**
   * Calculate distance score
   */
  private async calculateDistanceScore(job: Job, contractor: ContractorProfile): Promise<number> {
    if (!contractor.baseLocationLat || !contractor.baseLocationLon || !job.location) {
      return 50; // Default if location not available
    }

    const jobLocation = job.location as any;
    const distance = LocationService.calculateDistance(
      Number(contractor.baseLocationLat),
      Number(contractor.baseLocationLon),
      jobLocation.lat,
      jobLocation.lng
    );

    // Score based on distance (closer is better)
    if (distance <= 10) return 100;
    if (distance <= 20) return 90;
    if (distance <= 30) return 80;
    if (distance <= 40) return 70;
    if (distance <= 50) return 60;
    if (distance <= 75) return 40;
    if (distance <= 100) return 20;
    return 0;
  }

  /**
   * Calculate response time score
   */
  private calculateResponseTimeScore(responseTime: number): number {
    // Response time in minutes
    if (responseTime <= 15) return 100;
    if (responseTime <= 30) return 90;
    if (responseTime <= 45) return 80;
    if (responseTime <= 60) return 70;
    if (responseTime <= 90) return 50;
    if (responseTime <= 120) return 30;
    return 10;
  }

  /**
   * Calculate completion rate score
   */
  private calculateCompletionRateScore(completionRate: number): number {
    return Math.round(completionRate);
  }

  /**
   * Calculate workload balance
   */
  private calculateWorkloadBalance(metrics: ContractorMetrics, preferences: AssignmentPreferences | null): number {
    const maxDaily = preferences?.maxDailyJobs || this.MAX_DAILY_JOBS;
    const maxWeekly = preferences?.maxWeeklyJobs || (this.MAX_DAILY_JOBS * 7);

    // Check daily workload
    const dailyUtilization = (metrics.todayJobCount / maxDaily) * 100;
    
    // Check weekly workload
    const weeklyUtilization = (metrics.weekJobCount / maxWeekly) * 100;

    // Fatigue factor - reduce score if contractor has been working too much
    let fatigueScore = 100;
    if (metrics.lastJobCompletedAt) {
      const timeSinceLastJob = Date.now() - metrics.lastJobCompletedAt.getTime();
      const hoursSinceLastJob = timeSinceLastJob / (1000 * 60 * 60);
      
      if (hoursSinceLastJob < 1) fatigueScore = 60; // Just finished a job
      else if (hoursSinceLastJob < 2) fatigueScore = 70;
      else if (hoursSinceLastJob < 4) fatigueScore = 85;
    }

    // Calculate balanced score (lower utilization is better)
    const utilizationScore = Math.max(0, 100 - Math.max(dailyUtilization, weeklyUtilization * 0.5));
    
    return Math.round((utilizationScore * 0.7 + fatigueScore * 0.3));
  }

  /**
   * Calculate availability score
   */
  private async calculateAvailabilityScore(contractor: ContractorProfile, job: Job): Promise<number> {
    const now = new Date();
    
    // Check if contractor is currently online
    if (!contractor.isOnline) {
      return 20; // Low score if offline
    }

    // Check heartbeat recency
    if (contractor.lastHeartbeatAt) {
      const timeSinceHeartbeat = now.getTime() - new Date(contractor.lastHeartbeatAt).getTime();
      const minutesSinceHeartbeat = timeSinceHeartbeat / (1000 * 60);
      
      if (minutesSinceHeartbeat > 30) return 30; // Stale heartbeat
      if (minutesSinceHeartbeat > 15) return 60;
      if (minutesSinceHeartbeat > 5) return 80;
    }

    // Check availability schedule
    const isScheduleAvailable = await availabilityService.isContractorAvailable(
      contractor.userId,
      now
    );

    return isScheduleAvailable ? 100 : 40;
  }

  /**
   * Calculate equipment match score
   */
  private calculateEquipmentMatch(job: Job, contractor: ContractorProfile): number {
    // Check if contractor has required equipment for the job
    if (job.serviceType === 'mobile_truck_wash') {
      if (contractor.hasMobileWaterSource && contractor.hasWastewaterRecovery) {
        return 100;
      } else if (contractor.hasMobileWaterSource) {
        return 70;
      }
      return 30;
    }

    // Default score for jobs without special equipment requirements
    return 80;
  }

  /**
   * Calculate price competitiveness
   */
  private async calculatePriceCompetitiveness(contractor: ContractorProfile, job: Job): Promise<number> {
    // For now, return a default score
    // In future, this could analyze contractor's typical pricing vs market rates
    return 75;
  }

  /**
   * Calculate time of day performance
   */
  private calculateTimeOfDayPerformance(contractor: ContractorProfile, jobTime: Date): number {
    if (!contractor.timeOfDayPerformance) {
      return 75; // Default score
    }

    const performance = contractor.timeOfDayPerformance as any;
    const hour = jobTime.getHours();

    let timeOfDay: string;
    if (hour >= 6 && hour < 12) timeOfDay = 'morning';
    else if (hour >= 12 && hour < 17) timeOfDay = 'afternoon';
    else if (hour >= 17 && hour < 22) timeOfDay = 'evening';
    else timeOfDay = 'night';

    return Math.round((performance[timeOfDay] || 0.75) * 100);
  }

  /**
   * Calculate weather suitability
   */
  private async calculateWeatherSuitability(contractor: ContractorProfile): Promise<number> {
    // For now, return default score
    // In future, this could check current weather and contractor's performance in different conditions
    return 85;
  }

  /**
   * Calculate complexity handling capability
   */
  private calculateComplexityHandling(contractor: ContractorProfile, jobComplexity: string): number {
    if (!contractor.jobComplexityHandling) {
      return 70; // Default score
    }

    const complexityPerformance = contractor.jobComplexityHandling as any;
    const score = (complexityPerformance[jobComplexity] || 0.7) * 100;
    
    return Math.round(score);
  }

  /**
   * Analyze job complexity using AI
   */
  private async analyzeJobComplexity(job: Job): Promise<string> {
    if (!openai) {
      // Fallback to simple complexity analysis
      if (job.jobType === 'emergency') return 'emergency';
      if (job.serviceType?.includes('engine') || job.serviceType?.includes('transmission')) return 'complex';
      if (job.serviceType?.includes('tire') || job.serviceType?.includes('jump')) return 'simple';
      return 'moderate';
    }

    try {
      const response = await openai.chat.completions.create({
        model: "gpt-5",
        messages: [
          {
            role: "system",
            content: "Analyze the complexity of this truck repair job and respond with only one word: simple, moderate, complex, or emergency"
          },
          {
            role: "user",
            content: `Service: ${job.serviceType}\nDescription: ${job.description || 'N/A'}\nType: ${job.jobType}`
          }
        ],
        max_completion_tokens: 10,
        temperature: 0.3
      });

      const complexity = response.choices[0]?.message?.content?.toLowerCase().trim();
      if (['simple', 'moderate', 'complex', 'emergency'].includes(complexity || '')) {
        return complexity!;
      }
      return 'moderate';
    } catch (error) {
      console.error('[AI Dispatch] Error analyzing complexity:', error);
      return 'moderate';
    }
  }

  /**
   * Calculate weighted score from factors
   */
  private calculateWeightedScore(factors: ScoringFactors): number {
    let totalScore = 0;
    let totalWeight = 0;

    for (const [factor, value] of Object.entries(factors)) {
      const weight = this.FACTOR_WEIGHTS[factor as keyof ScoringFactors];
      totalScore += value * weight;
      totalWeight += weight;
    }

    return Math.round(totalScore / totalWeight);
  }

  /**
   * Calculate confidence level for the scoring
   */
  private calculateConfidence(factors: ScoringFactors): number {
    // Calculate variance in scores
    const scores = Object.values(factors);
    const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
    const variance = scores.reduce((sum, score) => sum + Math.pow(score - avg, 2), 0) / scores.length;
    
    // Lower variance = higher confidence
    const varianceScore = Math.max(0, 1 - (variance / 2500)); // Normalize variance
    
    // Check for critical factors
    const criticalFactorsScore = (
      factors.skills_match > 70 &&
      factors.distance > 50 &&
      factors.availability_score > 60
    ) ? 1 : 0.7;

    return varianceScore * 0.5 + criticalFactorsScore * 0.5;
  }

  /**
   * Generate AI recommendation for assignment
   */
  private async generateRecommendation(
    job: Job,
    contractor: ContractorProfile,
    factors: ScoringFactors,
    score: number
  ): Promise<string> {
    if (!openai) {
      // Fallback to template-based recommendation
      return this.generateTemplateRecommendation(factors, score);
    }

    try {
      const response = await openai.chat.completions.create({
        model: "gpt-5",
        messages: [
          {
            role: "system",
            content: "Generate a brief, professional explanation for why this contractor should or should not be assigned to this job. Be concise and focus on key factors."
          },
          {
            role: "user",
            content: JSON.stringify({
              score,
              factors,
              contractorName: contractor.businessName || contractor.legalName,
              jobType: job.serviceType,
              isRecommended: score >= this.MIN_SCORE_THRESHOLD
            })
          }
        ],
        max_completion_tokens: 100,
        temperature: 0.5
      });

      return response.choices[0]?.message?.content || this.generateTemplateRecommendation(factors, score);
    } catch (error) {
      console.error('[AI Dispatch] Error generating recommendation:', error);
      return this.generateTemplateRecommendation(factors, score);
    }
  }

  /**
   * Generate template-based recommendation
   */
  private generateTemplateRecommendation(factors: ScoringFactors, score: number): string {
    const strengths = [];
    const weaknesses = [];

    // Identify strengths and weaknesses
    if (factors.skills_match >= 80) strengths.push('excellent skills match');
    else if (factors.skills_match < 60) weaknesses.push('limited expertise for this service');

    if (factors.distance >= 80) strengths.push('very close to job location');
    else if (factors.distance < 50) weaknesses.push('significant travel distance');

    if (factors.completion_rate >= 90) strengths.push('outstanding completion rate');
    else if (factors.completion_rate < 70) weaknesses.push('below-average completion rate');

    if (factors.customer_satisfaction >= 85) strengths.push('highly rated by customers');
    else if (factors.customer_satisfaction < 70) weaknesses.push('customer satisfaction concerns');

    if (factors.workload_balance >= 80) strengths.push('good availability');
    else if (factors.workload_balance < 50) weaknesses.push('heavy current workload');

    // Build recommendation
    let recommendation = `Score: ${score}/100. `;
    
    if (strengths.length > 0) {
      recommendation += `Strengths: ${strengths.join(', ')}. `;
    }
    
    if (weaknesses.length > 0) {
      recommendation += `Concerns: ${weaknesses.join(', ')}. `;
    }

    if (score >= 85) {
      recommendation += 'Highly recommended for this job.';
    } else if (score >= 70) {
      recommendation += 'Good candidate for this job.';
    } else if (score >= 60) {
      recommendation += 'Acceptable match with some concerns.';
    } else {
      recommendation += 'Not recommended - consider other contractors.';
    }

    return recommendation;
  }

  /**
   * Get contractor performance metrics
   */
  private async getContractorMetrics(contractorId: string): Promise<ContractorMetrics> {
    const profile = await storage.getContractorProfile(contractorId);
    
    // Get job statistics
    const jobs = await storage.findJobs({ 
      contractorId,
      limit: 1000 
    });

    const completedJobs = jobs.filter(j => j.status === 'completed');
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - 7);

    const todayJobs = jobs.filter(j => new Date(j.createdAt) >= todayStart);
    const weekJobs = jobs.filter(j => new Date(j.createdAt) >= weekStart);

    // Calculate average response time
    let totalResponseTime = 0;
    let responseCount = 0;
    for (const job of completedJobs) {
      if (job.acceptedAt && job.createdAt) {
        const responseTime = new Date(job.acceptedAt).getTime() - new Date(job.createdAt).getTime();
        totalResponseTime += responseTime / (1000 * 60); // Convert to minutes
        responseCount++;
      }
    }

    const avgResponseTime = responseCount > 0 ? totalResponseTime / responseCount : 30;

    // Get the most recent completed job
    const lastCompletedJob = completedJobs
      .sort((a, b) => new Date(b.completedAt || 0).getTime() - new Date(a.completedAt || 0).getTime())[0];

    return {
      totalJobs: jobs.length,
      completedJobs: completedJobs.length,
      averageRating: Number(profile?.averageRating) || 0,
      responseTime: avgResponseTime,
      completionRate: jobs.length > 0 ? (completedJobs.length / jobs.length) * 100 : 0,
      customerSatisfactionScore: Number(profile?.customerSatisfactionScore) || 75,
      todayJobCount: todayJobs.length,
      weekJobCount: weekJobs.length,
      currentWorkload: todayJobs.filter(j => ['assigned', 'en_route', 'on_site'].includes(j.status)).length,
      lastJobCompletedAt: lastCompletedJob?.completedAt ? new Date(lastCompletedJob.completedAt) : undefined
    };
  }

  /**
   * Update contractor specializations
   */
  async updateContractorSpecializations(contractorId: string, specializations: any): Promise<void> {
    await storage.updateContractorProfile(contractorId, { specializations });
  }

  /**
   * Get contractor performance pattern analysis
   */
  async getContractorPerformancePattern(contractorId: string): Promise<any> {
    const metrics = await this.getContractorMetrics(contractorId);
    const profile = await storage.getContractorProfile(contractorId);

    return {
      metrics,
      patterns: {
        timeOfDay: profile?.timeOfDayPerformance || {},
        weather: profile?.weatherPerformance || {},
        complexity: profile?.jobComplexityHandling || {}
      },
      specializations: profile?.specializations || {},
      recommendations: await this.generatePerformanceRecommendations(contractorId, metrics)
    };
  }

  /**
   * Generate performance recommendations for contractor
   */
  private async generatePerformanceRecommendations(contractorId: string, metrics: ContractorMetrics): Promise<string[]> {
    const recommendations = [];

    if (metrics.responseTime > 60) {
      recommendations.push('Consider improving response time to job assignments');
    }

    if (metrics.completionRate < 85) {
      recommendations.push('Focus on completing more assigned jobs to improve reliability score');
    }

    if (metrics.customerSatisfactionScore < 80) {
      recommendations.push('Work on customer service skills to improve satisfaction ratings');
    }

    if (metrics.averageRating < 4) {
      recommendations.push('Review customer feedback to identify areas for improvement');
    }

    return recommendations;
  }

  /**
   * Record assignment outcome for learning
   */
  async recordAssignmentOutcome(
    jobId: string,
    success: boolean,
    metrics: {
      responseTime?: number;
      completionTime?: number;
      customerRating?: number;
      issuesEncountered?: string[];
    }
  ): Promise<void> {
    try {
      // Get the assignment score record
      const scores = await storage.getAiAssignmentScores(jobId);
      const job = await storage.getJob(jobId);
      
      if (!job || !job.contractorId || scores.length === 0) {
        return;
      }

      // Find the score for the assigned contractor
      const assignedScore = scores.find(s => s.contractorId === job.contractorId);
      if (!assignedScore) {
        return;
      }

      // Calculate performance score based on outcome
      let performanceScore = 50; // Base score
      
      if (success) {
        performanceScore = 80;
        
        // Adjust based on metrics
        if (metrics.responseTime && metrics.responseTime < 30) performanceScore += 5;
        if (metrics.customerRating && metrics.customerRating >= 4.5) performanceScore += 10;
        if (!metrics.issuesEncountered || metrics.issuesEncountered.length === 0) performanceScore += 5;
      } else {
        performanceScore = 30;
        if (metrics.issuesEncountered && metrics.issuesEncountered.length > 2) performanceScore -= 10;
      }

      // Update the assignment score with outcome
      await storage.updateAiAssignmentScore(assignedScore.id, {
        wasAssigned: true,
        assignmentOutcome: success ? 'success' : 'failed',
        outcomeRecordedAt: new Date(),
        performanceScore: performanceScore.toString()
      });

      // Update contractor performance patterns
      await this.updateContractorPerformancePatterns(job.contractorId, job, success, metrics);
      
    } catch (error) {
      console.error('[AI Dispatch] Error recording assignment outcome:', error);
    }
  }

  /**
   * Update contractor performance patterns based on job outcome
   */
  private async updateContractorPerformancePatterns(
    contractorId: string,
    job: Job,
    success: boolean,
    metrics: any
  ): Promise<void> {
    const profile = await storage.getContractorProfile(contractorId);
    if (!profile) return;

    // Update time of day performance
    const hour = new Date().getHours();
    let timeOfDay: string;
    if (hour >= 6 && hour < 12) timeOfDay = 'morning';
    else if (hour >= 12 && hour < 17) timeOfDay = 'afternoon';
    else if (hour >= 17 && hour < 22) timeOfDay = 'evening';
    else timeOfDay = 'night';

    const currentTimePerformance = (profile.timeOfDayPerformance as any) || {};
    const currentScore = currentTimePerformance[timeOfDay] || 0.75;
    
    // Weighted average with new outcome (10% weight for new data)
    const newScore = success ? 1 : 0;
    currentTimePerformance[timeOfDay] = currentScore * 0.9 + newScore * 0.1;

    // Update complexity handling
    const complexity = await this.analyzeJobComplexity(job);
    const currentComplexityHandling = (profile.jobComplexityHandling as any) || {};
    const currentComplexityScore = currentComplexityHandling[complexity] || 0.75;
    currentComplexityHandling[complexity] = currentComplexityScore * 0.9 + newScore * 0.1;

    // Save updated patterns
    await storage.updateContractorProfile(contractorId, {
      timeOfDayPerformance: currentTimePerformance,
      jobComplexityHandling: currentComplexityHandling
    });
  }

  /**
   * Get assignment effectiveness analytics
   */
  async getAssignmentEffectiveness(period: 'day' | 'week' | 'month' = 'week'): Promise<any> {
    const startDate = new Date();
    switch (period) {
      case 'day':
        startDate.setDate(startDate.getDate() - 1);
        break;
      case 'week':
        startDate.setDate(startDate.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(startDate.getMonth() - 1);
        break;
    }

    // Get all AI assignment scores from the period
    const allScores = await storage.getAiAssignmentScoresInPeriod(startDate, new Date());
    
    // Calculate metrics
    const totalAssignments = allScores.filter(s => s.wasAssigned).length;
    const successfulAssignments = allScores.filter(s => s.assignmentOutcome === 'success').length;
    const failedAssignments = allScores.filter(s => s.assignmentOutcome === 'failed').length;
    const declinedAssignments = allScores.filter(s => s.assignmentOutcome === 'declined').length;
    
    // Calculate average scores
    const assignedScores = allScores.filter(s => s.wasAssigned);
    const averageAssignedScore = assignedScores.length > 0
      ? assignedScores.reduce((sum, s) => sum + Number(s.score), 0) / assignedScores.length
      : 0;

    // Calculate score accuracy (correlation between score and success)
    const successScores = allScores.filter(s => s.assignmentOutcome === 'success');
    const averageSuccessScore = successScores.length > 0
      ? successScores.reduce((sum, s) => sum + Number(s.score), 0) / successScores.length
      : 0;

    const failureScores = allScores.filter(s => s.assignmentOutcome === 'failed');
    const averageFailureScore = failureScores.length > 0
      ? failureScores.reduce((sum, s) => sum + Number(s.score), 0) / failureScores.length
      : 0;

    return {
      period,
      totalAssignments,
      successfulAssignments,
      failedAssignments,
      declinedAssignments,
      successRate: totalAssignments > 0 ? (successfulAssignments / totalAssignments) * 100 : 0,
      averageAssignedScore,
      averageSuccessScore,
      averageFailureScore,
      scoreAccuracy: averageSuccessScore - averageFailureScore, // Higher difference = better accuracy
      recommendations: this.generateSystemRecommendations({
        successRate: totalAssignments > 0 ? (successfulAssignments / totalAssignments) * 100 : 0,
        scoreAccuracy: averageSuccessScore - averageFailureScore
      })
    };
  }

  /**
   * Generate system-wide recommendations
   */
  private generateSystemRecommendations(metrics: { successRate: number; scoreAccuracy: number }): string[] {
    const recommendations = [];

    if (metrics.successRate < 70) {
      recommendations.push('Consider adjusting minimum score threshold for assignments');
      recommendations.push('Review contractor qualification requirements');
    }

    if (metrics.scoreAccuracy < 10) {
      recommendations.push('AI scoring model may need recalibration');
      recommendations.push('Collect more outcome data to improve predictions');
    }

    if (metrics.successRate > 90) {
      recommendations.push('System performing well - consider expanding to more job types');
    }

    return recommendations;
  }
}

// Export singleton instance
export const aiDispatchService = new AIDispatchService();