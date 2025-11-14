import { db } from "../db";
import { 
  partsCatalog, 
  partsInventory, 
  partsTransactions, 
  partsOrders, 
  jobParts,
  type PartsCatalog,
  type PartsInventory,
  type PartsTransaction,
  type PartsOrder,
  type JobPart,
  type InsertPartsCatalog,
  type InsertPartsInventory,
  type InsertPartsTransaction,
  type InsertPartsOrder,
  type InsertJobPart,
  partsTransactionTypeEnum,
  partsOrderStatusEnum,
  partsCategoryEnum
} from "@shared/schema";
import { eq, sql, and, or, gte, lte, desc, asc, inArray, like, between, isNotNull } from "drizzle-orm";
import { randomUUID } from "crypto";

export class PartsInventoryService {
  // ==================== PARTS CATALOG MANAGEMENT ====================
  
  /**
   * Search parts catalog with filters
   */
  async searchPartsCatalog(filters: {
    query?: string;
    category?: string;
    manufacturer?: string;
    minPrice?: number;
    maxPrice?: number;
    isActive?: boolean;
    compatibleMake?: string;
    compatibleModel?: string;
    compatibleYear?: number;
    limit?: number;
    offset?: number;
  }) {
    let whereConditions = [];

    if (filters.query) {
      whereConditions.push(
        or(
          like(partsCatalog.name, `%${filters.query}%`),
          like(partsCatalog.description, `%${filters.query}%`),
          like(partsCatalog.partNumber, `%${filters.query}%`)
        )
      );
    }

    if (filters.category) {
      whereConditions.push(eq(partsCatalog.category, filters.category as any));
    }

    if (filters.manufacturer) {
      whereConditions.push(eq(partsCatalog.manufacturer, filters.manufacturer));
    }

    if (filters.minPrice !== undefined) {
      whereConditions.push(gte(partsCatalog.sellingPrice, filters.minPrice.toString()));
    }

    if (filters.maxPrice !== undefined) {
      whereConditions.push(lte(partsCatalog.sellingPrice, filters.maxPrice.toString()));
    }

    if (filters.isActive !== undefined) {
      whereConditions.push(eq(partsCatalog.isActive, filters.isActive));
    }

    // Handle compatible vehicle filtering via JSON
    if (filters.compatibleMake || filters.compatibleModel || filters.compatibleYear) {
      // This would need more complex JSON querying based on your database
      // For now, we'll return all parts and filter in application code
    }

    const query = db
      .select()
      .from(partsCatalog)
      .where(whereConditions.length > 0 ? and(...whereConditions) : undefined)
      .limit(filters.limit || 50)
      .offset(filters.offset || 0);

    const parts = await query;

    // Post-process for compatibility if needed
    let filteredParts = parts;
    if (filters.compatibleMake || filters.compatibleModel || filters.compatibleYear) {
      filteredParts = parts.filter(part => {
        if (!part.compatibleModels) return true; // If no compatibility info, assume universal
        
        const compat = part.compatibleModels as any;
        
        if (filters.compatibleMake && compat.makes && !compat.makes.includes(filters.compatibleMake)) {
          return false;
        }
        
        if (filters.compatibleModel && compat.models && !compat.models.includes(filters.compatibleModel)) {
          return false;
        }
        
        if (filters.compatibleYear && compat.years && !compat.years.includes(filters.compatibleYear)) {
          return false;
        }
        
        return true;
      });
    }

    return filteredParts;
  }

  /**
   * Add new part to catalog
   */
  async addPartToCatalog(part: InsertPartsCatalog): Promise<PartsCatalog> {
    // Calculate markup if not provided
    if (!part.markup && part.unitCost && part.sellingPrice) {
      const markup = ((parseFloat(part.sellingPrice) - parseFloat(part.unitCost)) / parseFloat(part.unitCost)) * 100;
      part.markup = markup.toFixed(2);
    }

    const [newPart] = await db
      .insert(partsCatalog)
      .values(part)
      .returning();

    return newPart;
  }

  /**
   * Update part in catalog
   */
  async updatePartInCatalog(partId: string, updates: Partial<InsertPartsCatalog>): Promise<PartsCatalog | null> {
    // Recalculate markup if prices changed
    if (updates.unitCost || updates.sellingPrice) {
      const [existingPart] = await db
        .select()
        .from(partsCatalog)
        .where(eq(partsCatalog.id, partId))
        .limit(1);

      if (existingPart) {
        const unitCost = updates.unitCost || existingPart.unitCost;
        const sellingPrice = updates.sellingPrice || existingPart.sellingPrice;
        const markup = ((parseFloat(sellingPrice) - parseFloat(unitCost)) / parseFloat(unitCost)) * 100;
        updates.markup = markup.toFixed(2);
      }
    }

    const [updatedPart] = await db
      .update(partsCatalog)
      .set({
        ...updates,
        updatedAt: new Date()
      })
      .where(eq(partsCatalog.id, partId))
      .returning();

    return updatedPart || null;
  }

  // ==================== INVENTORY MANAGEMENT ====================
  
  /**
   * Get current inventory levels
   */
  async getInventoryLevels(warehouseId?: string, includeInactive = false) {
    const inventoryQuery = db
      .select({
        inventory: partsInventory,
        part: partsCatalog
      })
      .from(partsInventory)
      .innerJoin(partsCatalog, eq(partsInventory.partId, partsCatalog.id));

    let conditions = [];
    
    if (warehouseId) {
      conditions.push(eq(partsInventory.warehouseId, warehouseId));
    }

    if (!includeInactive) {
      conditions.push(eq(partsCatalog.isActive, true));
    }

    if (conditions.length > 0) {
      inventoryQuery.where(and(...conditions));
    }

    const inventory = await inventoryQuery;

    // Add stock status
    return inventory.map(item => ({
      ...item,
      stockStatus: this.getStockStatus(item.inventory.quantity, item.inventory.reorderLevel),
      needsReorder: item.inventory.quantity <= item.inventory.reorderLevel,
      isExpired: item.inventory.expirationDate && new Date(item.inventory.expirationDate) < new Date(),
      daysUntilExpiration: item.inventory.expirationDate 
        ? Math.ceil((new Date(item.inventory.expirationDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
        : null
    }));
  }

  /**
   * Update inventory quantity
   */
  async updateInventoryLevel(
    partId: string, 
    warehouseId: string, 
    quantityChange: number, 
    transactionType: string,
    jobId?: string,
    contractorId?: string,
    notes?: string
  ): Promise<PartsInventory> {
    // Get current inventory
    const [currentInventory] = await db
      .select()
      .from(partsInventory)
      .where(and(
        eq(partsInventory.partId, partId),
        eq(partsInventory.warehouseId, warehouseId)
      ))
      .limit(1);

    // Get part info for cost
    const [part] = await db
      .select()
      .from(partsCatalog)
      .where(eq(partsCatalog.id, partId))
      .limit(1);

    if (!part) {
      throw new Error('Part not found in catalog');
    }

    let newQuantity: number;
    let inventory: PartsInventory;

    if (currentInventory) {
      // Update existing inventory
      newQuantity = currentInventory.quantity + quantityChange;
      
      if (newQuantity < 0) {
        throw new Error(`Insufficient inventory. Available: ${currentInventory.quantity}, Requested: ${Math.abs(quantityChange)}`);
      }

      const updates: any = {
        quantity: newQuantity,
        updatedAt: new Date()
      };

      // Update last restocked date if adding inventory
      if (quantityChange > 0 && transactionType === 'restocked') {
        updates.lastRestocked = new Date();
      }

      [inventory] = await db
        .update(partsInventory)
        .set(updates)
        .where(and(
          eq(partsInventory.partId, partId),
          eq(partsInventory.warehouseId, warehouseId)
        ))
        .returning();
    } else {
      // Create new inventory record
      if (quantityChange < 0) {
        throw new Error('Cannot remove from non-existent inventory');
      }

      [inventory] = await db
        .insert(partsInventory)
        .values({
          partId,
          warehouseId,
          quantity: quantityChange,
          reorderLevel: 5,
          reorderQuantity: 10,
          lastRestocked: transactionType === 'restocked' ? new Date() : undefined,
          averageCost: part.unitCost
        })
        .returning();
    }

    // Record the transaction
    await db.insert(partsTransactions).values({
      partId,
      jobId,
      contractorId,
      transactionType: transactionType as any,
      quantity: Math.abs(quantityChange),
      unitCost: part.unitCost,
      totalCost: (Math.abs(quantityChange) * parseFloat(part.unitCost)).toFixed(2),
      warehouseId,
      notes
    });

    return inventory;
  }

  /**
   * Record part usage on a job
   */
  async recordPartUsage(
    jobId: string,
    partId: string,
    quantity: number,
    contractorId: string,
    warehouseId = 'main',
    warrantyMonths = 12
  ): Promise<JobPart> {
    // Get part info
    const [part] = await db
      .select()
      .from(partsCatalog)
      .where(eq(partsCatalog.id, partId))
      .limit(1);

    if (!part) {
      throw new Error('Part not found in catalog');
    }

    // Update inventory (decrease)
    await this.updateInventoryLevel(
      partId,
      warehouseId,
      -quantity,
      'used',
      jobId,
      contractorId,
      `Used on job ${jobId}`
    );

    // Calculate warranty expiration
    const warrantyExpiresAt = new Date();
    warrantyExpiresAt.setMonth(warrantyExpiresAt.getMonth() + warrantyMonths);

    // Record part usage on job
    const [jobPart] = await db
      .insert(jobParts)
      .values({
        jobId,
        partId,
        quantity,
        unitPrice: part.sellingPrice,
        totalPrice: (quantity * parseFloat(part.sellingPrice)).toFixed(2),
        warrantyMonths,
        warrantyExpiresAt,
        installedAt: new Date(),
        installedBy: contractorId,
        isWarrantyClaim: false
      })
      .returning();

    return jobPart;
  }

  // ==================== REORDER MANAGEMENT ====================
  
  /**
   * Check which parts need reordering
   */
  async checkReorderNeeded(warehouseId?: string) {
    const query = db
      .select({
        inventory: partsInventory,
        part: partsCatalog
      })
      .from(partsInventory)
      .innerJoin(partsCatalog, eq(partsInventory.partId, partsCatalog.id))
      .where(and(
        sql`${partsInventory.quantity} <= ${partsInventory.reorderLevel}`,
        eq(partsCatalog.isActive, true),
        warehouseId ? eq(partsInventory.warehouseId, warehouseId) : undefined
      ));

    const itemsNeedingReorder = await query;

    return itemsNeedingReorder.map(item => ({
      ...item,
      quantityToOrder: item.inventory.reorderQuantity,
      currentStock: item.inventory.quantity,
      estimatedCost: parseFloat(item.part.unitCost) * item.inventory.reorderQuantity,
      urgency: this.calculateReorderUrgency(item.inventory.quantity, item.inventory.reorderLevel)
    }));
  }

  /**
   * Create purchase order
   */
  async createPartsOrder(
    supplierName: string,
    items: Array<{
      partId: string;
      quantity: number;
      unitCost?: number;
    }>,
    supplierContact?: string,
    expectedDeliveryDays = 7,
    createdBy?: string
  ): Promise<PartsOrder> {
    // Fetch part details
    const partIds = items.map(item => item.partId);
    const parts = await db
      .select()
      .from(partsCatalog)
      .where(inArray(partsCatalog.id, partIds));

    const partsMap = new Map(parts.map(p => [p.id, p]));

    // Calculate order details
    let subtotal = 0;
    const orderItems = items.map(item => {
      const part = partsMap.get(item.partId);
      if (!part) throw new Error(`Part ${item.partId} not found`);

      const unitCost = item.unitCost || parseFloat(part.unitCost);
      const totalCost = unitCost * item.quantity;
      subtotal += totalCost;

      return {
        partId: item.partId,
        partNumber: part.partNumber,
        name: part.name,
        quantity: item.quantity,
        unitCost: unitCost.toFixed(2),
        totalCost: totalCost.toFixed(2)
      };
    });

    const tax = subtotal * 0.08; // 8% tax
    const shipping = subtotal > 500 ? 0 : 25; // Free shipping over $500
    const totalCost = subtotal + tax + shipping;

    // Generate order number
    const orderNumber = `PO-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

    // Calculate expected delivery
    const expectedDelivery = new Date();
    expectedDelivery.setDate(expectedDelivery.getDate() + expectedDeliveryDays);

    // Create the order
    const [order] = await db
      .insert(partsOrders)
      .values({
        supplierName,
        supplierContact,
        orderNumber,
        status: 'pending',
        items: orderItems,
        subtotal: subtotal.toFixed(2),
        tax: tax.toFixed(2),
        shipping: shipping.toFixed(2),
        totalCost: totalCost.toFixed(2),
        expectedDelivery,
        createdBy
      })
      .returning();

    return order;
  }

  /**
   * Receive parts order and update inventory
   */
  async receivePartsOrder(
    orderId: string,
    receivedItems: Array<{
      partId: string;
      quantityReceived: number;
      warehouseId?: string;
    }>,
    trackingNumber?: string
  ): Promise<PartsOrder> {
    // Get the order
    const [order] = await db
      .select()
      .from(partsOrders)
      .where(eq(partsOrders.id, orderId))
      .limit(1);

    if (!order) {
      throw new Error('Order not found');
    }

    if (order.status === 'delivered') {
      throw new Error('Order already delivered');
    }

    // Update inventory for each received item
    for (const item of receivedItems) {
      await this.updateInventoryLevel(
        item.partId,
        item.warehouseId || 'main',
        item.quantityReceived,
        'restocked',
        undefined,
        undefined,
        `Received from order ${order.orderNumber}`
      );

      // Record transaction with order reference
      await db.insert(partsTransactions).values({
        partId: item.partId,
        orderId,
        transactionType: 'restocked',
        quantity: item.quantityReceived,
        unitCost: '0', // Cost already tracked in order
        totalCost: '0',
        warehouseId: item.warehouseId || 'main',
        notes: `Order ${order.orderNumber} received`
      });
    }

    // Update order status
    const [updatedOrder] = await db
      .update(partsOrders)
      .set({
        status: 'delivered',
        receivedAt: new Date(),
        trackingNumber,
        updatedAt: new Date()
      })
      .where(eq(partsOrders.id, orderId))
      .returning();

    return updatedOrder;
  }

  // ==================== ANALYTICS & REPORTING ====================
  
  /**
   * Calculate inventory value
   */
  async getInventoryValue(warehouseId?: string, method: 'FIFO' | 'LIFO' | 'AVERAGE' = 'AVERAGE') {
    const inventory = await this.getInventoryLevels(warehouseId, true);

    let totalValue = 0;
    let totalRetailValue = 0;
    const breakdown = [];

    for (const item of inventory) {
      const quantity = item.inventory.quantity;
      const avgCost = parseFloat(item.inventory.averageCost || item.part.unitCost);
      const sellingPrice = parseFloat(item.part.sellingPrice);

      const itemValue = quantity * avgCost;
      const itemRetailValue = quantity * sellingPrice;

      totalValue += itemValue;
      totalRetailValue += itemRetailValue;

      breakdown.push({
        partId: item.part.id,
        partNumber: item.part.partNumber,
        name: item.part.name,
        quantity,
        unitCost: avgCost,
        totalCost: itemValue,
        sellingPrice,
        totalRetailValue: itemRetailValue,
        potentialProfit: itemRetailValue - itemValue,
        warehouseId: item.inventory.warehouseId
      });
    }

    return {
      method,
      totalValue: totalValue.toFixed(2),
      totalRetailValue: totalRetailValue.toFixed(2),
      potentialProfit: (totalRetailValue - totalValue).toFixed(2),
      profitMargin: ((totalRetailValue - totalValue) / totalRetailValue * 100).toFixed(2) + '%',
      itemCount: breakdown.length,
      breakdown: breakdown.sort((a, b) => b.totalCost - a.totalCost)
    };
  }

  /**
   * Get part usage history
   */
  async getPartUsageHistory(
    partId: string,
    dateRange?: { startDate: Date; endDate: Date }
  ) {
    let conditions = [
      eq(partsTransactions.partId, partId),
      eq(partsTransactions.transactionType, 'used')
    ];

    if (dateRange) {
      conditions.push(between(
        partsTransactions.createdAt,
        dateRange.startDate,
        dateRange.endDate
      ));
    }

    const transactions = await db
      .select()
      .from(partsTransactions)
      .where(and(...conditions))
      .orderBy(desc(partsTransactions.createdAt));

    // Calculate usage stats
    const totalUsed = transactions.reduce((sum, t) => sum + t.quantity, 0);
    const totalCost = transactions.reduce((sum, t) => sum + parseFloat(t.totalCost), 0);
    
    // Group by month for trend analysis
    const monthlyUsage = new Map<string, { quantity: number; cost: number }>();
    
    transactions.forEach(t => {
      const monthKey = new Date(t.createdAt).toISOString().slice(0, 7);
      const existing = monthlyUsage.get(monthKey) || { quantity: 0, cost: 0 };
      existing.quantity += t.quantity;
      existing.cost += parseFloat(t.totalCost);
      monthlyUsage.set(monthKey, existing);
    });

    // Calculate average monthly usage
    const months = monthlyUsage.size || 1;
    const avgMonthlyUsage = totalUsed / months;
    const avgMonthlyCost = totalCost / months;

    return {
      partId,
      dateRange,
      totalUsed,
      totalCost: totalCost.toFixed(2),
      transactionCount: transactions.length,
      avgMonthlyUsage: avgMonthlyUsage.toFixed(2),
      avgMonthlyCost: avgMonthlyCost.toFixed(2),
      monthlyBreakdown: Array.from(monthlyUsage.entries()).map(([month, data]) => ({
        month,
        quantity: data.quantity,
        cost: data.cost.toFixed(2)
      })),
      recentTransactions: transactions.slice(0, 10)
    };
  }

  /**
   * Get parts warranty report
   */
  async getWarrantyReport(daysAhead = 30) {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + daysAhead);

    const expiringWarranties = await db
      .select({
        jobPart: jobParts,
        part: partsCatalog
      })
      .from(jobParts)
      .innerJoin(partsCatalog, eq(jobParts.partId, partsCatalog.id))
      .where(and(
        isNotNull(jobParts.warrantyExpiresAt),
        between(
          jobParts.warrantyExpiresAt,
          new Date(),
          futureDate
        )
      ))
      .orderBy(asc(jobParts.warrantyExpiresAt));

    return {
      expiringCount: expiringWarranties.length,
      warranties: expiringWarranties.map(w => ({
        ...w,
        daysUntilExpiration: Math.ceil(
          (new Date(w.jobPart.warrantyExpiresAt!).getTime() - new Date().getTime()) / 
          (1000 * 60 * 60 * 24)
        )
      }))
    };
  }

  /**
   * Forecast parts demand based on historical usage
   */
  async forecastDemand(partId: string, daysToForecast = 30) {
    // Get last 90 days of usage
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 90);
    
    const history = await this.getPartUsageHistory(partId, {
      startDate,
      endDate: new Date()
    });

    // Simple linear forecast based on average daily usage
    const dailyUsage = history.totalUsed / 90;
    const forecastedUsage = Math.ceil(dailyUsage * daysToForecast);

    // Get current inventory
    const [inventory] = await db
      .select()
      .from(partsInventory)
      .where(eq(partsInventory.partId, partId))
      .limit(1);

    const currentStock = inventory?.quantity || 0;
    const daysOfStockRemaining = dailyUsage > 0 ? Math.floor(currentStock / dailyUsage) : Infinity;

    return {
      partId,
      historicalDailyAverage: dailyUsage.toFixed(2),
      forecastedUsage,
      currentStock,
      daysOfStockRemaining,
      willNeedReorderBy: daysOfStockRemaining < daysToForecast 
        ? new Date(Date.now() + daysOfStockRemaining * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        : null,
      recommendedOrderQuantity: Math.max(
        forecastedUsage - currentStock + (inventory?.reorderLevel || 5),
        inventory?.reorderQuantity || 10
      )
    };
  }

  /**
   * Get supplier performance metrics
   */
  async getSupplierPerformance(supplierName?: string) {
    let conditions = [eq(partsOrders.status, 'delivered')];
    
    if (supplierName) {
      conditions.push(eq(partsOrders.supplierName, supplierName));
    }

    const orders = await db
      .select()
      .from(partsOrders)
      .where(and(...conditions));

    // Group by supplier
    const supplierStats = new Map<string, {
      orderCount: number;
      totalValue: number;
      onTimeCount: number;
      delayedCount: number;
      avgDeliveryDays: number;
    }>();

    orders.forEach(order => {
      const stats = supplierStats.get(order.supplierName) || {
        orderCount: 0,
        totalValue: 0,
        onTimeCount: 0,
        delayedCount: 0,
        avgDeliveryDays: 0
      };

      stats.orderCount++;
      stats.totalValue += parseFloat(order.totalCost);

      if (order.receivedAt && order.orderedAt) {
        const deliveryDays = Math.ceil(
          (new Date(order.receivedAt).getTime() - new Date(order.orderedAt).getTime()) /
          (1000 * 60 * 60 * 24)
        );
        
        stats.avgDeliveryDays = 
          (stats.avgDeliveryDays * (stats.orderCount - 1) + deliveryDays) / stats.orderCount;

        if (order.expectedDelivery && order.receivedAt <= order.expectedDelivery) {
          stats.onTimeCount++;
        } else {
          stats.delayedCount++;
        }
      }

      supplierStats.set(order.supplierName, stats);
    });

    return Array.from(supplierStats.entries()).map(([supplier, stats]) => ({
      supplier,
      ...stats,
      totalValue: stats.totalValue.toFixed(2),
      onTimeRate: ((stats.onTimeCount / stats.orderCount) * 100).toFixed(2) + '%',
      avgDeliveryDays: stats.avgDeliveryDays.toFixed(1)
    }));
  }

  // ==================== HELPER METHODS ====================
  
  private getStockStatus(quantity: number, reorderLevel: number): string {
    if (quantity === 0) return 'out_of_stock';
    if (quantity <= reorderLevel / 2) return 'critical';
    if (quantity <= reorderLevel) return 'low';
    if (quantity > reorderLevel * 3) return 'overstock';
    return 'normal';
  }

  private calculateReorderUrgency(quantity: number, reorderLevel: number): 'critical' | 'high' | 'medium' | 'low' {
    const ratio = quantity / reorderLevel;
    if (ratio === 0) return 'critical';
    if (ratio <= 0.25) return 'high';
    if (ratio <= 0.5) return 'medium';
    return 'low';
  }
}

// Export singleton instance
export const partsInventoryService = new PartsInventoryService();