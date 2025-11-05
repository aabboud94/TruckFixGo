import { randomUUID } from 'crypto';
import { type FleetCheck, type InsertFleetCheck, checkProviderEnum, checkStatusEnum } from '@shared/schema';

// Types for API responses
interface AuthorizationResponse {
  success: boolean;
  authorizationId?: string;
  availableBalance?: number;
  holdAmount?: number;
  expiresAt?: Date;
  message?: string;
  errorCode?: string;
  errorDetails?: string;
}

interface CaptureResponse {
  success: boolean;
  captureId?: string;
  capturedAmount?: number;
  remainingBalance?: number;
  settlementDate?: Date;
  message?: string;
  errorCode?: string;
  errorDetails?: string;
}

interface VoidResponse {
  success: boolean;
  voidId?: string;
  releasedAmount?: number;
  message?: string;
  errorCode?: string;
}

// Test check configurations
const TEST_CHECKS = {
  efs: {
    '1234567890': { authCode: '123456', balance: 1000, status: 'authorized' },
    '9876543210': { authCode: '654321', balance: 0, status: 'declined' },
    '5555555555': { authCode: '111111', balance: 100, status: 'insufficient' },
    '1111111111': { authCode: '222222', balance: 5000, status: 'authorized' },
    '2222222222': { authCode: '333333', balance: 2500, status: 'authorized' }
  },
  comdata: {
    '123456789012': { controlCode: '1234', driverCode: 'D001', balance: 2000, status: 'authorized' },
    '987654321098': { controlCode: '4321', driverCode: 'D002', balance: 0, status: 'declined' },
    '555555555555': { controlCode: '1111', driverCode: 'D003', balance: 0, status: 'error' },
    '111111111111': { controlCode: '2222', driverCode: 'D004', balance: 10000, status: 'authorized' },
    '222222222222': { controlCode: '3333', driverCode: 'D005', balance: 5000, status: 'authorized' }
  }
};

// In-memory store for authorized checks (simulating provider state)
const authorizedChecks = new Map<string, {
  checkNumber: string;
  provider: string;
  authorizedAmount: number;
  capturedAmount: number;
  remainingBalance: number;
  expiresAt: Date;
  status: string;
}>();

class EFSComdataService {
  // Validation rules for each provider
  private readonly validationRules = {
    efs: {
      checkNumberLength: 10,
      authCodeLength: 6,
      minAmount: 50,
      maxAmount: 5000,
      dailyLimit: 10000,
      expirationHours: 24
    },
    comdata: {
      checkNumberLength: 12,
      controlCodeLength: 4,
      driverCodeRequired: true,
      minAmount: 100,
      maxAmount: 10000,
      dailyLimit: 50000,
      expirationHours: 48
    }
  };

  // Track daily limits (in production, this would be in database)
  private dailyUsage = new Map<string, { date: string; total: number }>();

  /**
   * Authorize an EFS check
   */
  async authorizeEFSCheck(
    checkNumber: string,
    authCode: string,
    amount: number,
    jobId?: string,
    userId?: string
  ): Promise<AuthorizationResponse> {
    // Validate format
    if (!this.validateEFSFormat(checkNumber, authCode)) {
      return {
        success: false,
        errorCode: 'INVALID_FORMAT',
        message: 'Invalid check number or authorization code format'
      };
    }

    // Validate amount
    const rules = this.validationRules.efs;
    if (amount < rules.minAmount || amount > rules.maxAmount) {
      return {
        success: false,
        errorCode: 'INVALID_AMOUNT',
        message: `Amount must be between $${rules.minAmount} and $${rules.maxAmount}`
      };
    }

    // Check daily limit
    if (!this.checkDailyLimit('efs', checkNumber, amount)) {
      return {
        success: false,
        errorCode: 'DAILY_LIMIT_EXCEEDED',
        message: 'Daily transaction limit exceeded'
      };
    }

    // Check if already authorized
    const existingAuth = this.getAuthorizedCheck(checkNumber);
    if (existingAuth) {
      return {
        success: false,
        errorCode: 'DUPLICATE_AUTHORIZATION',
        message: 'Check already has an active authorization'
      };
    }

    // Simulate API delay
    await this.simulateNetworkDelay();

    // Check test scenarios
    const testCheck = TEST_CHECKS.efs[checkNumber];
    if (testCheck) {
      if (testCheck.authCode !== authCode) {
        return {
          success: false,
          errorCode: 'INVALID_AUTH_CODE',
          message: 'Invalid authorization code'
        };
      }

      if (testCheck.status === 'declined') {
        return {
          success: false,
          errorCode: 'CHECK_DECLINED',
          message: 'Check declined by issuer'
        };
      }

      if (testCheck.status === 'insufficient' && amount > testCheck.balance) {
        return {
          success: false,
          errorCode: 'INSUFFICIENT_FUNDS',
          message: `Insufficient funds. Available balance: $${testCheck.balance}`,
          errorDetails: `Requested: $${amount}, Available: $${testCheck.balance}`
        };
      }

      // Successful authorization
      const authId = `EFS-AUTH-${randomUUID().substring(0, 8).toUpperCase()}`;
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + rules.expirationHours);

      // Store authorization
      authorizedChecks.set(checkNumber, {
        checkNumber,
        provider: 'efs',
        authorizedAmount: amount,
        capturedAmount: 0,
        remainingBalance: testCheck.balance - amount,
        expiresAt,
        status: 'authorized'
      });

      this.updateDailyUsage('efs', checkNumber, amount);

      return {
        success: true,
        authorizationId: authId,
        availableBalance: testCheck.balance,
        holdAmount: amount,
        expiresAt,
        message: 'Check authorized successfully'
      };
    }

    // Default behavior for unknown checks (simulate random response)
    const random = Math.random();
    if (random > 0.8) {
      return {
        success: false,
        errorCode: 'CHECK_NOT_FOUND',
        message: 'Check number not found in system'
      };
    }

    // Successful authorization for unknown check
    const authId = `EFS-AUTH-${randomUUID().substring(0, 8).toUpperCase()}`;
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + rules.expirationHours);
    const balance = Math.floor(Math.random() * 3000) + 500;

    authorizedChecks.set(checkNumber, {
      checkNumber,
      provider: 'efs',
      authorizedAmount: amount,
      capturedAmount: 0,
      remainingBalance: balance - amount,
      expiresAt,
      status: 'authorized'
    });

    this.updateDailyUsage('efs', checkNumber, amount);

    return {
      success: true,
      authorizationId: authId,
      availableBalance: balance,
      holdAmount: amount,
      expiresAt,
      message: 'Check authorized successfully'
    };
  }

  /**
   * Authorize a Comdata check
   */
  async authorizeComdataCheck(
    checkNumber: string,
    controlCode: string,
    driverCode: string,
    amount: number,
    jobId?: string,
    userId?: string
  ): Promise<AuthorizationResponse> {
    // Validate format
    if (!this.validateComdataFormat(checkNumber, controlCode, driverCode)) {
      return {
        success: false,
        errorCode: 'INVALID_FORMAT',
        message: 'Invalid check number, control code, or driver code format'
      };
    }

    // Validate amount
    const rules = this.validationRules.comdata;
    if (amount < rules.minAmount || amount > rules.maxAmount) {
      return {
        success: false,
        errorCode: 'INVALID_AMOUNT',
        message: `Amount must be between $${rules.minAmount} and $${rules.maxAmount}`
      };
    }

    // Check daily limit
    if (!this.checkDailyLimit('comdata', checkNumber, amount)) {
      return {
        success: false,
        errorCode: 'DAILY_LIMIT_EXCEEDED',
        message: 'Daily transaction limit exceeded'
      };
    }

    // Check if already authorized
    const existingAuth = this.getAuthorizedCheck(checkNumber);
    if (existingAuth) {
      return {
        success: false,
        errorCode: 'DUPLICATE_AUTHORIZATION',
        message: 'Check already has an active authorization'
      };
    }

    // Simulate API delay
    await this.simulateNetworkDelay();

    // Check test scenarios
    const testCheck = TEST_CHECKS.comdata[checkNumber];
    if (testCheck) {
      if (testCheck.controlCode !== controlCode) {
        return {
          success: false,
          errorCode: 'INVALID_CONTROL_CODE',
          message: 'Invalid control code'
        };
      }

      if (testCheck.driverCode !== driverCode) {
        return {
          success: false,
          errorCode: 'INVALID_DRIVER_CODE',
          message: 'Invalid driver code'
        };
      }

      if (testCheck.status === 'declined') {
        return {
          success: false,
          errorCode: 'CHECK_DECLINED',
          message: 'Check declined by issuer'
        };
      }

      if (testCheck.status === 'error') {
        return {
          success: false,
          errorCode: 'NETWORK_ERROR',
          message: 'Network error communicating with Comdata',
          errorDetails: 'Connection timeout after 30 seconds'
        };
      }

      // Successful authorization
      const authId = `COMDATA-AUTH-${randomUUID().substring(0, 8).toUpperCase()}`;
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + rules.expirationHours);

      // Store authorization
      authorizedChecks.set(checkNumber, {
        checkNumber,
        provider: 'comdata',
        authorizedAmount: amount,
        capturedAmount: 0,
        remainingBalance: testCheck.balance - amount,
        expiresAt,
        status: 'authorized'
      });

      this.updateDailyUsage('comdata', checkNumber, amount);

      return {
        success: true,
        authorizationId: authId,
        availableBalance: testCheck.balance,
        holdAmount: amount,
        expiresAt,
        message: 'Check authorized successfully'
      };
    }

    // Default behavior for unknown checks
    const random = Math.random();
    if (random > 0.8) {
      return {
        success: false,
        errorCode: 'CHECK_NOT_FOUND',
        message: 'Check number not found in system'
      };
    }

    // Successful authorization for unknown check
    const authId = `COMDATA-AUTH-${randomUUID().substring(0, 8).toUpperCase()}`;
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + rules.expirationHours);
    const balance = Math.floor(Math.random() * 8000) + 1000;

    authorizedChecks.set(checkNumber, {
      checkNumber,
      provider: 'comdata',
      authorizedAmount: amount,
      capturedAmount: 0,
      remainingBalance: balance - amount,
      expiresAt,
      status: 'authorized'
    });

    this.updateDailyUsage('comdata', checkNumber, amount);

    return {
      success: true,
      authorizationId: authId,
      availableBalance: balance,
      holdAmount: amount,
      expiresAt,
      message: 'Check authorized successfully'
    };
  }

  /**
   * Capture funds from an authorized check
   */
  async captureCheckPayment(
    checkNumber: string,
    amount: number,
    provider: 'efs' | 'comdata'
  ): Promise<CaptureResponse> {
    const auth = this.getAuthorizedCheck(checkNumber);
    
    if (!auth) {
      return {
        success: false,
        errorCode: 'NO_AUTHORIZATION',
        message: 'No active authorization found for this check'
      };
    }

    if (auth.provider !== provider) {
      return {
        success: false,
        errorCode: 'PROVIDER_MISMATCH',
        message: `Check is authorized with ${auth.provider}, not ${provider}`
      };
    }

    if (auth.status !== 'authorized' && auth.status !== 'partially_captured') {
      return {
        success: false,
        errorCode: 'INVALID_STATUS',
        message: `Cannot capture from check in ${auth.status} status`
      };
    }

    // Check expiration
    if (new Date() > auth.expiresAt) {
      auth.status = 'expired';
      return {
        success: false,
        errorCode: 'AUTHORIZATION_EXPIRED',
        message: 'Authorization has expired'
      };
    }

    // Check available amount
    const availableToCapture = auth.authorizedAmount - auth.capturedAmount;
    if (amount > availableToCapture) {
      return {
        success: false,
        errorCode: 'EXCEEDS_AUTHORIZATION',
        message: `Cannot capture $${amount}. Only $${availableToCapture} available`,
        errorDetails: `Authorized: $${auth.authorizedAmount}, Already captured: $${auth.capturedAmount}`
      };
    }

    // Simulate API delay
    await this.simulateNetworkDelay();

    // Simulate random capture failures (5% chance)
    if (Math.random() < 0.05) {
      return {
        success: false,
        errorCode: 'CAPTURE_FAILED',
        message: 'Capture failed due to processor error',
        errorDetails: 'Please retry or contact support'
      };
    }

    // Successful capture
    auth.capturedAmount += amount;
    auth.status = auth.capturedAmount >= auth.authorizedAmount ? 'captured' : 'partially_captured';
    
    const captureId = `${provider.toUpperCase()}-CAP-${randomUUID().substring(0, 8).toUpperCase()}`;
    const settlementDate = new Date();
    settlementDate.setDate(settlementDate.getDate() + 2); // T+2 settlement

    return {
      success: true,
      captureId,
      capturedAmount: amount,
      remainingBalance: auth.authorizedAmount - auth.capturedAmount,
      settlementDate,
      message: `Successfully captured $${amount}`
    };
  }

  /**
   * Void an authorization
   */
  async voidAuthorization(
    checkNumber: string,
    provider: 'efs' | 'comdata'
  ): Promise<VoidResponse> {
    const auth = this.getAuthorizedCheck(checkNumber);
    
    if (!auth) {
      return {
        success: false,
        errorCode: 'NO_AUTHORIZATION',
        message: 'No active authorization found for this check'
      };
    }

    if (auth.provider !== provider) {
      return {
        success: false,
        errorCode: 'PROVIDER_MISMATCH',
        message: `Check is authorized with ${auth.provider}, not ${provider}`
      };
    }

    if (auth.status === 'voided') {
      return {
        success: false,
        errorCode: 'ALREADY_VOIDED',
        message: 'Authorization is already voided'
      };
    }

    if (auth.status === 'captured' && auth.capturedAmount > 0) {
      return {
        success: false,
        errorCode: 'CANNOT_VOID_CAPTURED',
        message: `Cannot void: $${auth.capturedAmount} has already been captured`
      };
    }

    // Simulate API delay
    await this.simulateNetworkDelay();

    // Successful void
    const releasedAmount = auth.authorizedAmount - auth.capturedAmount;
    auth.status = 'voided';
    
    const voidId = `${provider.toUpperCase()}-VOID-${randomUUID().substring(0, 8).toUpperCase()}`;

    return {
      success: true,
      voidId,
      releasedAmount,
      message: `Successfully voided authorization, released $${releasedAmount}`
    };
  }

  /**
   * Get check balance (for display purposes)
   */
  async getCheckBalance(
    checkNumber: string,
    provider: 'efs' | 'comdata'
  ): Promise<{ success: boolean; balance?: number; message?: string }> {
    await this.simulateNetworkDelay();

    const testChecks = provider === 'efs' ? TEST_CHECKS.efs : TEST_CHECKS.comdata;
    const testCheck = testChecks[checkNumber];
    
    if (testCheck) {
      return {
        success: true,
        balance: testCheck.balance,
        message: 'Balance retrieved successfully'
      };
    }

    // Random balance for unknown checks
    return {
      success: true,
      balance: Math.floor(Math.random() * 5000) + 500,
      message: 'Balance retrieved successfully'
    };
  }

  // Helper methods

  private validateEFSFormat(checkNumber: string, authCode: string): boolean {
    const rules = this.validationRules.efs;
    return (
      checkNumber.length === rules.checkNumberLength &&
      /^\d+$/.test(checkNumber) &&
      authCode.length === rules.authCodeLength &&
      /^\d+$/.test(authCode)
    );
  }

  private validateComdataFormat(
    checkNumber: string,
    controlCode: string,
    driverCode: string
  ): boolean {
    const rules = this.validationRules.comdata;
    return (
      checkNumber.length === rules.checkNumberLength &&
      /^\d+$/.test(checkNumber) &&
      controlCode.length === rules.controlCodeLength &&
      /^\d+$/.test(controlCode) &&
      (!rules.driverCodeRequired || (driverCode && driverCode.length > 0))
    );
  }

  private getAuthorizedCheck(checkNumber: string) {
    return authorizedChecks.get(checkNumber);
  }

  private checkDailyLimit(provider: string, checkNumber: string, amount: number): boolean {
    const today = new Date().toISOString().split('T')[0];
    const key = `${provider}-${checkNumber}`;
    const usage = this.dailyUsage.get(key);
    
    const rules = provider === 'efs' ? this.validationRules.efs : this.validationRules.comdata;
    const dailyLimit = rules.dailyLimit;
    
    if (!usage || usage.date !== today) {
      return amount <= dailyLimit;
    }
    
    return (usage.total + amount) <= dailyLimit;
  }

  private updateDailyUsage(provider: string, checkNumber: string, amount: number): void {
    const today = new Date().toISOString().split('T')[0];
    const key = `${provider}-${checkNumber}`;
    const usage = this.dailyUsage.get(key);
    
    if (!usage || usage.date !== today) {
      this.dailyUsage.set(key, { date: today, total: amount });
    } else {
      usage.total += amount;
    }
  }

  private async simulateNetworkDelay(): Promise<void> {
    // Simulate network latency (200-800ms)
    const delay = Math.floor(Math.random() * 600) + 200;
    return new Promise(resolve => setTimeout(resolve, delay));
  }

  /**
   * Mask check number for security (show last 4 digits only)
   */
  maskCheckNumber(checkNumber: string): string {
    if (checkNumber.length <= 4) return checkNumber;
    return '*'.repeat(checkNumber.length - 4) + checkNumber.slice(-4);
  }

  /**
   * Format amount for display
   */
  formatAmount(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  }

  /**
   * Clear expired authorizations (cleanup task)
   */
  cleanupExpiredAuthorizations(): void {
    const now = new Date();
    for (const [checkNumber, auth] of authorizedChecks.entries()) {
      if (auth.expiresAt < now && auth.status === 'authorized' && auth.capturedAmount === 0) {
        auth.status = 'expired';
        // In production, this would also notify relevant parties
      }
    }
  }
}

// Export singleton instance
export const efsComdataService = new EFSComdataService();

// Run cleanup every hour
setInterval(() => {
  efsComdataService.cleanupExpiredAuthorizations();
}, 60 * 60 * 1000);

export default efsComdataService;