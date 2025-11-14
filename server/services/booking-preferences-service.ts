import { db } from "../db";
import { 
  bookingPreferences,
  contractorBlacklist,
  favoriteContractors,
  bookingTemplates,
  contractorProfiles,
  users,
  jobs,
  jobBids,
  notifications,
  type BookingPreferences,
  type InsertBookingPreferences,
  type ContractorBlacklist,
  type InsertContractorBlacklist,
  type FavoriteContractor,
  type InsertFavoriteContractor,
  type BookingTemplate,
  type InsertBookingTemplate,
  type Job,
  type JobBid,
  type User,
  type ContractorProfile
} from "@shared/schema";
import { eq, and, isNull, desc, inArray, ne, gte, or, lte, sql } from "drizzle-orm";
import { pushNotificationService } from "./push-notification-service";
import { emailService } from "./email-service";

class BookingPreferencesService {
  // ==================== BOOKING PREFERENCES ====================
  
  /**
   * Get or create booking preferences for a user
   */
  async getOrCreatePreferences(userId: string): Promise<BookingPreferences> {
    const [existing] = await db
      .select()
      .from(bookingPreferences)
      .where(eq(bookingPreferences.userId, userId))
      .limit(1);
    
    if (existing) {
      return existing;
    }
    
    // Create default preferences
    const [newPreferences] = await db
      .insert(bookingPreferences)
      .values({
        userId,
        autoAcceptBids: false,
        notificationPreferences: {
          email: true,
          sms: true,
          push: true,
          frequency: 'immediate',
          types: ['job_update', 'bid_received', 'payment']
        }
      })
      .returning();
    
    return newPreferences;
  }
  
  /**
   * Update user booking preferences
   */
  async updatePreferences(
    userId: string,
    updates: Partial<InsertBookingPreferences>
  ): Promise<BookingPreferences | null> {
    const [updated] = await db
      .update(bookingPreferences)
      .set({
        ...updates,
        updatedAt: new Date()
      })
      .where(eq(bookingPreferences.userId, userId))
      .returning();
    
    return updated || null;
  }
  
  // ==================== FAVORITE CONTRACTORS ====================
  
  /**
   * Add a contractor to user's favorites
   */
  async addFavoriteContractor(
    userId: string,
    contractorId: string,
    notes?: string,
    priority?: number
  ): Promise<FavoriteContractor> {
    // Check if already favorited
    const [existing] = await db
      .select()
      .from(favoriteContractors)
      .where(
        and(
          eq(favoriteContractors.userId, userId),
          eq(favoriteContractors.contractorId, contractorId)
        )
      )
      .limit(1);
    
    if (existing) {
      // Update existing favorite
      const [updated] = await db
        .update(favoriteContractors)
        .set({ 
          notes: notes || existing.notes,
          priority: priority !== undefined ? priority : existing.priority
        })
        .where(eq(favoriteContractors.id, existing.id))
        .returning();
      
      return updated;
    }
    
    // Add new favorite
    const [favorite] = await db
      .insert(favoriteContractors)
      .values({
        userId,
        contractorId,
        notes,
        priority: priority || 0
      })
      .returning();
    
    return favorite;
  }
  
  /**
   * Remove a contractor from favorites
   */
  async removeFavoriteContractor(
    userId: string,
    contractorId: string
  ): Promise<boolean> {
    const result = await db
      .delete(favoriteContractors)
      .where(
        and(
          eq(favoriteContractors.userId, userId),
          eq(favoriteContractors.contractorId, contractorId)
        )
      );
    
    return !!result.rowCount;
  }
  
  /**
   * Get user's favorite contractors
   */
  async getFavoriteContractors(userId: string): Promise<Array<{
    favorite: FavoriteContractor;
    contractor: User;
    profile: ContractorProfile | null;
  }>> {
    const favorites = await db
      .select({
        favorite: favoriteContractors,
        contractor: users,
        profile: contractorProfiles
      })
      .from(favoriteContractors)
      .innerJoin(users, eq(favoriteContractors.contractorId, users.id))
      .leftJoin(contractorProfiles, eq(users.id, contractorProfiles.userId))
      .where(eq(favoriteContractors.userId, userId))
      .orderBy(desc(favoriteContractors.priority), favoriteContractors.favoritedAt);
    
    return favorites;
  }
  
  // ==================== CONTRACTOR BLACKLIST ====================
  
  /**
   * Blacklist a contractor
   */
  async blacklistContractor(
    userId: string,
    contractorId: string,
    reason?: string
  ): Promise<ContractorBlacklist> {
    // Check if already blacklisted
    const [existing] = await db
      .select()
      .from(contractorBlacklist)
      .where(
        and(
          eq(contractorBlacklist.userId, userId),
          eq(contractorBlacklist.contractorId, contractorId),
          isNull(contractorBlacklist.unblockedAt)
        )
      )
      .limit(1);
    
    if (existing) {
      return existing;
    }
    
    // Add to blacklist
    const [blacklisted] = await db
      .insert(contractorBlacklist)
      .values({
        userId,
        contractorId,
        reason
      })
      .returning();
    
    // Remove from favorites if exists
    await this.removeFavoriteContractor(userId, contractorId);
    
    return blacklisted;
  }
  
  /**
   * Remove a contractor from blacklist
   */
  async unblacklistContractor(
    userId: string,
    contractorId: string
  ): Promise<boolean> {
    const result = await db
      .update(contractorBlacklist)
      .set({ unblockedAt: new Date() })
      .where(
        and(
          eq(contractorBlacklist.userId, userId),
          eq(contractorBlacklist.contractorId, contractorId),
          isNull(contractorBlacklist.unblockedAt)
        )
      );
    
    return !!result.rowCount;
  }
  
  /**
   * Get user's blacklisted contractors
   */
  async getBlacklistedContractors(userId: string): Promise<ContractorBlacklist[]> {
    return await db
      .select()
      .from(contractorBlacklist)
      .where(
        and(
          eq(contractorBlacklist.userId, userId),
          isNull(contractorBlacklist.unblockedAt)
        )
      );
  }
  
  /**
   * Check if a contractor is blacklisted by a user
   */
  async isContractorBlacklisted(
    userId: string,
    contractorId: string
  ): Promise<boolean> {
    const [blacklisted] = await db
      .select()
      .from(contractorBlacklist)
      .where(
        and(
          eq(contractorBlacklist.userId, userId),
          eq(contractorBlacklist.contractorId, contractorId),
          isNull(contractorBlacklist.unblockedAt)
        )
      )
      .limit(1);
    
    return !!blacklisted;
  }
  
  // ==================== BOOKING TEMPLATES ====================
  
  /**
   * Create a booking template
   */
  async createBookingTemplate(
    template: InsertBookingTemplate
  ): Promise<BookingTemplate> {
    // If this is set as default, unset other defaults
    if (template.isDefault) {
      await db
        .update(bookingTemplates)
        .set({ isDefault: false })
        .where(eq(bookingTemplates.userId, template.userId));
    }
    
    const [created] = await db
      .insert(bookingTemplates)
      .values(template)
      .returning();
    
    return created;
  }
  
  /**
   * Update a booking template
   */
  async updateBookingTemplate(
    templateId: string,
    updates: Partial<InsertBookingTemplate>
  ): Promise<BookingTemplate | null> {
    // Handle default flag
    if (updates.isDefault) {
      const [template] = await db
        .select()
        .from(bookingTemplates)
        .where(eq(bookingTemplates.id, templateId))
        .limit(1);
      
      if (template) {
        await db
          .update(bookingTemplates)
          .set({ isDefault: false })
          .where(
            and(
              eq(bookingTemplates.userId, template.userId),
              ne(bookingTemplates.id, templateId)
            )
          );
      }
    }
    
    const [updated] = await db
      .update(bookingTemplates)
      .set({
        ...updates,
        updatedAt: new Date()
      })
      .where(eq(bookingTemplates.id, templateId))
      .returning();
    
    return updated || null;
  }
  
  /**
   * Delete a booking template
   */
  async deleteBookingTemplate(templateId: string): Promise<boolean> {
    const result = await db
      .delete(bookingTemplates)
      .where(eq(bookingTemplates.id, templateId));
    
    return !!result.rowCount;
  }
  
  /**
   * Get user's booking templates
   */
  async getUserBookingTemplates(userId: string): Promise<BookingTemplate[]> {
    return await db
      .select()
      .from(bookingTemplates)
      .where(eq(bookingTemplates.userId, userId))
      .orderBy(desc(bookingTemplates.isDefault), desc(bookingTemplates.usageCount));
  }
  
  /**
   * Get a specific booking template
   */
  async getBookingTemplate(templateId: string): Promise<BookingTemplate | null> {
    const [template] = await db
      .select()
      .from(bookingTemplates)
      .where(eq(bookingTemplates.id, templateId))
      .limit(1);
    
    return template || null;
  }
  
  /**
   * Record template usage
   */
  async recordTemplateUsage(templateId: string): Promise<void> {
    await db
      .update(bookingTemplates)
      .set({
        usageCount: sql`${bookingTemplates.usageCount} + 1`,
        lastUsedAt: new Date()
      })
      .where(eq(bookingTemplates.id, templateId));
  }
  
  /**
   * Apply a booking template to create job data
   */
  async applyBookingTemplate(templateId: string): Promise<Partial<Job>> {
    const template = await this.getBookingTemplate(templateId);
    if (!template) {
      throw new Error('Template not found');
    }
    
    // Record usage
    await this.recordTemplateUsage(templateId);
    
    // Convert template to job data
    const jobData: Partial<Job> = {
      serviceTypeId: template.serviceType || undefined,
      vehicleId: template.vehicleId || undefined,
      specialInstructions: template.specialInstructions || undefined,
      locationLat: template.locationPreferences?.lat ? 
        String(template.locationPreferences.lat) : undefined,
      locationLng: template.locationPreferences?.lng ? 
        String(template.locationPreferences.lng) : undefined,
      locationAddress: template.locationPreferences?.address || undefined
    };
    
    return jobData;
  }
  
  // ==================== PREFERENCE APPLICATION ====================
  
  /**
   * Filter contractors based on user preferences and blacklist
   */
  async filterContractorsByPreferences(
    userId: string,
    contractors: Array<{ user: User; profile: ContractorProfile }>
  ): Promise<Array<{ user: User; profile: ContractorProfile; isFavorite: boolean }>> {
    const preferences = await this.getOrCreatePreferences(userId);
    const blacklist = await this.getBlacklistedContractors(userId);
    const favorites = await this.getFavoriteContractors(userId);
    
    const blacklistedIds = blacklist.map(b => b.contractorId);
    const favoriteIds = favorites.map(f => f.favorite.contractorId);
    
    // Filter out blacklisted contractors
    let filtered = contractors.filter(c => !blacklistedIds.includes(c.user.id));
    
    // Apply rating filter if set
    if (preferences.minContractorRating) {
      filtered = filtered.filter(c => 
        c.profile.averageRating && 
        parseFloat(c.profile.averageRating) >= parseFloat(preferences.minContractorRating!)
      );
    }
    
    // Add favorite flag and sort favorites first
    const result = filtered.map(c => ({
      ...c,
      isFavorite: favoriteIds.includes(c.user.id)
    }));
    
    // Sort favorites first, then by rating
    result.sort((a, b) => {
      if (a.isFavorite && !b.isFavorite) return -1;
      if (!a.isFavorite && b.isFavorite) return 1;
      
      const ratingA = parseFloat(a.profile.averageRating || '0');
      const ratingB = parseFloat(b.profile.averageRating || '0');
      return ratingB - ratingA;
    });
    
    return result;
  }
  
  /**
   * Check if a bid should be auto-accepted based on preferences
   */
  async shouldAutoAcceptBid(
    userId: string,
    bid: JobBid,
    contractorProfile: ContractorProfile
  ): Promise<boolean> {
    const preferences = await this.getOrCreatePreferences(userId);
    
    if (!preferences.autoAcceptBids) {
      return false;
    }
    
    // Check if contractor is blacklisted
    const isBlacklisted = await this.isContractorBlacklisted(userId, bid.contractorId);
    if (isBlacklisted) {
      return false;
    }
    
    // Check price threshold
    if (preferences.maxAutoAcceptPrice) {
      const bidAmount = parseFloat(bid.amount);
      const maxPrice = parseFloat(preferences.maxAutoAcceptPrice);
      if (bidAmount > maxPrice) {
        return false;
      }
    }
    
    // Check contractor rating
    if (preferences.minContractorRating && contractorProfile.averageRating) {
      const rating = parseFloat(contractorProfile.averageRating);
      const minRating = parseFloat(preferences.minContractorRating);
      if (rating < minRating) {
        return false;
      }
    }
    
    // Check response time
    if (preferences.maxResponseTimeMinutes) {
      const bidTime = new Date(bid.createdAt);
      const jobTime = new Date(); // Should get actual job creation time
      const responseMinutes = (bidTime.getTime() - jobTime.getTime()) / (1000 * 60);
      if (responseMinutes > preferences.maxResponseTimeMinutes) {
        return false;
      }
    }
    
    return true;
  }
  
  /**
   * Send notification based on user preferences
   */
  async sendNotificationByPreference(
    userId: string,
    type: string,
    title: string,
    message: string,
    data?: any
  ): Promise<void> {
    const preferences = await this.getOrCreatePreferences(userId);
    const notifPrefs = preferences.notificationPreferences as any;
    
    if (!notifPrefs || !notifPrefs.types?.includes(type)) {
      return;
    }
    
    // Check frequency settings
    if (notifPrefs.frequency === 'never') {
      return;
    }
    
    // Send notifications based on channel preferences
    const promises: Promise<any>[] = [];
    
    if (notifPrefs.email) {
      const user = await db
        .select()
        .from(users)
        .where(eq(users.id, userId))
        .limit(1)
        .then(r => r[0]);
      
      if (user?.email) {
        promises.push(
          emailService.sendEmail(
            user.email,
            title,
            message,
            `<h2>${title}</h2><p>${message}</p>`
          )
        );
      }
    }
    
    if (notifPrefs.sms && preferences.notificationPhone) {
      // SMS service would be called here
      // promises.push(smsService.sendSMS(preferences.notificationPhone, message));
    }
    
    if (notifPrefs.push) {
      promises.push(
        pushNotificationService.sendToUser(userId, {
          title,
          body: message,
          data
        })
      );
    }
    
    // Store notification in database
    promises.push(
      db.insert(notifications).values({
        userId,
        type: type as any,
        title,
        message,
        data,
        priority: 'medium',
        isRead: false
      })
    );
    
    await Promise.all(promises);
  }
  
  /**
   * Apply preferences to job creation
   */
  async applyPreferencesToJob(
    userId: string,
    jobData: Partial<Job>
  ): Promise<Partial<Job>> {
    const preferences = await this.getOrCreatePreferences(userId);
    
    // Apply default location if not provided
    if (!jobData.locationLat && preferences.defaultLocationLat) {
      jobData.locationLat = preferences.defaultLocationLat;
      jobData.locationLng = preferences.defaultLocationLng!;
      jobData.locationAddress = preferences.defaultLocationAddress || undefined;
    }
    
    // Apply preferred contractors to metadata
    if (preferences.preferredContractorIds?.length) {
      jobData.metadata = {
        ...jobData.metadata,
        preferredContractors: preferences.preferredContractorIds
      };
    }
    
    return jobData;
  }
}

export const bookingPreferencesService = new BookingPreferencesService();