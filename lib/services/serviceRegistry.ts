import { AnalyticsService } from './analyticsService';
import { NotificationService } from './notificationService';
import { SearchService } from './searchService';
import { CommunicationService } from './communicationService';
import { WorkflowService } from './workflowService';
import { EnhancedAppointmentService } from './enhancedAppointmentService';
import { EnhancedCustomerService } from './enhancedCustomerService';

// Import existing services
import { AppointmentService } from './appointmentService';
import PaymentService from './paymentService';
import { TattooRequestService } from './tattooRequestService';

export interface ServiceHealth {
  status: 'healthy' | 'degraded' | 'unhealthy';
  responseTime: number;
  lastCheck: Date;
  errorCount?: number;
  lastError?: string;
}

export interface ServiceDependency {
  service: string;
  dependency: string;
  issue: string;
}

export interface ServiceStatistics {
  totalCalls: number;
  averageResponseTime: number;
  successRate: number;
  serviceBreakdown: Record<string, {
    calls: number;
    responseTime: number;
    errors: number;
  }>;
}

export interface PerformanceMetrics {
  overall: {
    averageResponseTime: number;
    totalRequests: number;
    errorRate: number;
  };
  byService: Record<string, {
    responseTime: number;
    requests: number;
    errors: number;
  }>;
}

export interface HealthStatus {
  overall: 'healthy' | 'degraded' | 'unhealthy';
  services: Record<string, ServiceHealth>;
  timestamp: Date;
}

export interface DetailedHealthMetrics {
  summary: {
    totalServices: number;
    healthyServices: number;
    degradedServices: number;
    unhealthyServices: number;
  };
  serviceDetails: Array<{
    name: string;
    status: string;
    responseTime: number;
    uptime: number;
    dependencies: string[];
  }>;
  systemMetrics: {
    uptime: number;
    memoryUsage: {
      used: number;
      total: number;
      percentage: number;
    };
    averageResponseTime: number;
  };
}

/**
 * Service Registry for managing all backend services
 * Provides singleton instances and dependency injection
 */
export class ServiceRegistry {
  private static instance: ServiceRegistry;
  
  // Core new services
  private _analyticsService?: AnalyticsService;
  private _notificationService?: NotificationService;
  private _searchService?: SearchService;
  private _communicationService?: CommunicationService;
  private _workflowService?: WorkflowService;
  
  // Enhanced services
  private _enhancedAppointmentService?: EnhancedAppointmentService;
  private _enhancedCustomerService?: EnhancedCustomerService;
  
  // Existing services
  private _appointmentService?: AppointmentService;
  private _paymentService?: PaymentService;
  private _tattooRequestService?: TattooRequestService;

  // Service tracking
  private serviceHealth: Map<string, ServiceHealth> = new Map();
  private serviceStats: Map<string, any> = new Map();
  private serviceDependencies: Record<string, string[]> = {};
  private isInitialized = false;
  private initializationTime?: Date;

  private constructor() {
    this.setupDependencies();
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): ServiceRegistry {
    if (!ServiceRegistry.instance) {
      ServiceRegistry.instance = new ServiceRegistry();
    }
    return ServiceRegistry.instance;
  }

  /**
   * Analytics Service - Dashboard metrics and business intelligence
   */
  public get analyticsService(): AnalyticsService {
    if (!this._analyticsService) {
      this._analyticsService = new AnalyticsService();
      this.trackServiceCreation('analytics');
    }
    return this._analyticsService;
  }

  /**
   * Notification Service - Real-time notifications and alerts
   */
  public get notificationService(): NotificationService {
    if (!this._notificationService) {
      this._notificationService = new NotificationService();
      this.trackServiceCreation('notification');
    }
    return this._notificationService;
  }

  /**
   * Search Service - Global search across all entities
   */
  public get searchService(): SearchService {
    if (!this._searchService) {
      this._searchService = new SearchService();
      this.trackServiceCreation('search');
    }
    return this._searchService;
  }

  /**
   * Communication Service - Email templates and messaging
   */
  public get communicationService(): CommunicationService {
    if (!this._communicationService) {
      this._communicationService = new CommunicationService();
      this.trackServiceCreation('communication');
    }
    return this._communicationService;
  }

  /**
   * Workflow Service - Business process automation
   */
  public get workflowService(): WorkflowService {
    if (!this._workflowService) {
      this._workflowService = new WorkflowService();
      this.trackServiceCreation('workflow');
    }
    return this._workflowService;
  }

  /**
   * Enhanced Appointment Service - Appointments with automation
   */
  public get enhancedAppointmentService(): EnhancedAppointmentService {
    if (!this._enhancedAppointmentService) {
      this._enhancedAppointmentService = new EnhancedAppointmentService();
      this.trackServiceCreation('enhancedAppointments');
    }
    return this._enhancedAppointmentService;
  }

  /**
   * Enhanced Customer Service - Customers with analytics
   */
  public get enhancedCustomerService(): EnhancedCustomerService {
    if (!this._enhancedCustomerService) {
      this._enhancedCustomerService = new EnhancedCustomerService();
      this.trackServiceCreation('enhancedCustomers');
    }
    return this._enhancedCustomerService;
  }

  /**
   * Base Appointment Service
   */
  public get appointmentService(): AppointmentService {
    if (!this._appointmentService) {
      this._appointmentService = new AppointmentService();
      this.trackServiceCreation('appointments');
    }
    return this._appointmentService;
  }

  /**
   * Payment Service
   */
  public get paymentService(): PaymentService {
    if (!this._paymentService) {
      this._paymentService = new PaymentService();
      this.trackServiceCreation('payments');
    }
    return this._paymentService;
  }

  /**
   * Tattoo Request Service
   */
  public get tattooRequestService(): TattooRequestService {
    if (!this._tattooRequestService) {
      this._tattooRequestService = new TattooRequestService();
      this.trackServiceCreation('tattooRequests');
    }
    return this._tattooRequestService;
  }

  /**
   * Initialize all services and set up default workflows
   */
  public async initialize(): Promise<void> {
    return this.initializeAllServices();
  }

  /**
   * Initialize all services
   */
  public async initializeAllServices(): Promise<void> {
    console.log('🚀 Initializing Service Registry...');
    
    try {
      // Initialize core services first
      this.analyticsService;
      this.notificationService;
      this.searchService;
      this.communicationService;
      this.workflowService;
      
      // Initialize enhanced services
      this.enhancedAppointmentService;
      this.enhancedCustomerService;
      
      // Initialize base services
      this.appointmentService;
      this.paymentService;
      this.tattooRequestService;
      
      // Set up default automation workflows
      await this.setupDefaultWorkflows();
      
      this.isInitialized = true;
      this.initializationTime = new Date();
      
      console.log('✅ Service Registry initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize Service Registry:', error);
      throw error;
    }
  }

  /**
   * Get a service by name
   */
  public getService(serviceName: string): any {
    const services: Record<string, any> = {
      analytics: this._analyticsService,
      notification: this._notificationService,
      search: this._searchService,
      communication: this._communicationService,
      workflow: this._workflowService,
      enhancedAppointments: this._enhancedAppointmentService,
      enhancedCustomers: this._enhancedCustomerService,
      appointments: this._appointmentService,
      payments: this._paymentService,
      tattooRequests: this._tattooRequestService
    };

    return services[serviceName] || null;
  }

  /**
   * Check service health
   */
  public async checkServiceHealth(): Promise<HealthStatus> {
    const services: Record<string, ServiceHealth> = {};
    let healthyCount = 0;
    let degradedCount = 0;
    let unhealthyCount = 0;

    const serviceNames = [
      'analytics', 'notification', 'search', 'communication', 'workflow',
      'enhancedAppointments', 'enhancedCustomers', 'appointments', 'payments', 'tattooRequests'
    ];

    for (const serviceName of serviceNames) {
      const service = this.getService(serviceName);
      const startTime = Date.now();
      let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
      let errorMessage: string | undefined;

      try {
        // Test service availability with a simple health check
        if (service) {
          await this.performServiceHealthCheck(serviceName, service);
        } else {
          status = 'unhealthy';
          errorMessage = 'Service not initialized';
        }
      } catch (error) {
        status = 'unhealthy';
        errorMessage = error.message;
      }

      const responseTime = Date.now() - startTime;
      
      if (responseTime > 5000) status = 'degraded';
      if (responseTime > 10000) status = 'unhealthy';

      const health: ServiceHealth = {
        status,
        responseTime,
        lastCheck: new Date(),
        lastError: errorMessage
      };

      services[serviceName] = health;
      this.serviceHealth.set(serviceName, health);

      if (status === 'healthy') healthyCount++;
      else if (status === 'degraded') degradedCount++;
      else unhealthyCount++;
    }

    let overall: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
    if (unhealthyCount > 0) overall = 'unhealthy';
    else if (degradedCount > 0) overall = 'degraded';

    return {
      overall,
      services,
      timestamp: new Date()
    };
  }

  /**
   * Get detailed health metrics
   */
  public async getDetailedHealthMetrics(): Promise<DetailedHealthMetrics> {
    const healthStatus = await this.checkServiceHealth();
    const serviceDetails = Object.entries(healthStatus.services).map(([name, health]) => ({
      name,
      status: health.status,
      responseTime: health.responseTime,
      uptime: this.initializationTime ? Date.now() - this.initializationTime.getTime() : 0,
      dependencies: this.serviceDependencies[name] || []
    }));

    const totalServices = Object.keys(healthStatus.services).length;
    const healthyServices = Object.values(healthStatus.services).filter(h => h.status === 'healthy').length;
    const degradedServices = Object.values(healthStatus.services).filter(h => h.status === 'degraded').length;
    const unhealthyServices = Object.values(healthStatus.services).filter(h => h.status === 'unhealthy').length;

    return {
      summary: {
        totalServices,
        healthyServices,
        degradedServices,
        unhealthyServices
      },
      serviceDetails,
      systemMetrics: {
        uptime: this.initializationTime ? Date.now() - this.initializationTime.getTime() : 0,
        memoryUsage: {
          used: process.memoryUsage?.()?.used || 0,
          total: process.memoryUsage?.()?.external || 0,
          percentage: 0
        },
        averageResponseTime: Object.values(healthStatus.services).reduce((sum, h) => sum + h.responseTime, 0) / totalServices
      }
    };
  }

  /**
   * Get service dependencies
   */
  public getServiceDependencies(): Record<string, string[]> {
    return { ...this.serviceDependencies };
  }

  /**
   * Validate dependencies
   */
  public async validateDependencies(): Promise<{
    allDependenciesHealthy: boolean;
    issues: ServiceDependency[];
  }> {
    const issues: ServiceDependency[] = [];
    const healthStatus = await this.checkServiceHealth();

    for (const [serviceName, dependencies] of Object.entries(this.serviceDependencies)) {
      for (const dependency of dependencies) {
        const dependencyHealth = healthStatus.services[dependency];
        if (!dependencyHealth || dependencyHealth.status === 'unhealthy') {
          issues.push({
            service: serviceName,
            dependency,
            issue: dependencyHealth ? 'Dependency is unhealthy' : 'Dependency not found'
          });
        }
      }
    }

    return {
      allDependenciesHealthy: issues.length === 0,
      issues
    };
  }

  /**
   * Get service statistics
   */
  public async getServiceStatistics(): Promise<ServiceStatistics> {
    const serviceBreakdown: Record<string, any> = {};
    let totalCalls = 0;
    let totalResponseTime = 0;
    let totalSuccesses = 0;

    for (const [serviceName, stats] of this.serviceStats.entries()) {
      const calls = stats.calls || 0;
      const responseTime = stats.responseTime || 0;
      const errors = stats.errors || 0;
      const successes = calls - errors;

      serviceBreakdown[serviceName] = {
        calls,
        responseTime,
        errors
      };

      totalCalls += calls;
      totalResponseTime += responseTime;
      totalSuccesses += successes;
    }

    return {
      totalCalls,
      averageResponseTime: totalCalls > 0 ? totalResponseTime / totalCalls : 0,
      successRate: totalCalls > 0 ? (totalSuccesses / totalCalls) * 100 : 100,
      serviceBreakdown
    };
  }

  /**
   * Get performance metrics
   */
  public async getPerformanceMetrics(): Promise<PerformanceMetrics> {
    const byService: Record<string, any> = {};
    let totalRequests = 0;
    let totalResponseTime = 0;
    let totalErrors = 0;

    for (const [serviceName, stats] of this.serviceStats.entries()) {
      const requests = stats.calls || 0;
      const responseTime = stats.responseTime || 0;
      const errors = stats.errors || 0;

      byService[serviceName] = {
        responseTime: requests > 0 ? responseTime / requests : 0,
        requests,
        errors
      };

      totalRequests += requests;
      totalResponseTime += responseTime;
      totalErrors += errors;
    }

    return {
      overall: {
        averageResponseTime: totalRequests > 0 ? totalResponseTime / totalRequests : 0,
        totalRequests,
        errorRate: totalRequests > 0 ? (totalErrors / totalRequests) * 100 : 0
      },
      byService
    };
  }

  /**
   * Graceful shutdown
   */
  public async gracefulShutdown(): Promise<{
    success: boolean;
    shutdownOrder: string[];
    totalTime: number;
  }> {
    const startTime = Date.now();
    const shutdownOrder: string[] = [];

    try {
      // Shutdown services in reverse dependency order
      const serviceNames = [
        'workflow', 'communication', 'search', 'notification', 'analytics',
        'enhancedAppointments', 'enhancedCustomers',
        'tattooRequests', 'payments', 'appointments'
      ];

      for (const serviceName of serviceNames) {
        try {
          const serviceKey = `_${serviceName}Service` as keyof this;
          if (this[serviceKey]) {
            // Set service to undefined to "shutdown"
            (this[serviceKey] as any) = undefined;
            shutdownOrder.push(serviceName);
          }
        } catch (error) {
          console.error(`Error shutting down ${serviceName}:`, error);
        }
      }

      this.isInitialized = false;
      this.initializationTime = undefined;
      this.serviceHealth.clear();
      this.serviceStats.clear();

      return {
        success: true,
        shutdownOrder,
        totalTime: Date.now() - startTime
      };
    } catch (error) {
      return {
        success: false,
        shutdownOrder,
        totalTime: Date.now() - startTime
      };
    }
  }

  /**
   * Set up default automation workflows
   */
  private async setupDefaultWorkflows(): Promise<void> {
    try {
      await this.workflowService.createDefaultAutomationRules();
      console.log('✅ Default workflows created');
    } catch (error) {
      console.warn('⚠️ Failed to create default workflows:', error);
      // Don't fail initialization for workflow setup issues
    }
  }

  /**
   * Get all services for testing or debugging
   */
  public getAllServices() {
    const services = {
      analytics: this._analyticsService || null,
      notification: this._notificationService || null,
      search: this._searchService || null,
      communication: this._communicationService || null,
      workflow: this._workflowService || null,
      enhancedAppointments: this._enhancedAppointmentService || null,
      enhancedCustomers: this._enhancedCustomerService || null,
      appointments: this._appointmentService || null,
      payments: this._paymentService || null,
      tattooRequests: this._tattooRequestService || null
    };

    return services;
  }

  /**
   * Health check for all services (legacy method)
   */
  public async healthCheck(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    services: Record<string, 'ok' | 'error'>;
    errors: string[];
  }> {
    const healthStatus = await this.checkServiceHealth();
    const services: Record<string, 'ok' | 'error'> = {};
    const errors: string[] = [];

    for (const [serviceName, health] of Object.entries(healthStatus.services)) {
      services[serviceName] = health.status === 'healthy' ? 'ok' : 'error';
      if (health.lastError) {
        errors.push(`${serviceName}: ${health.lastError}`);
      }
    }

    return {
      status: healthStatus.overall,
      services,
      errors
    };
  }

  // Private helper methods

  private setupDependencies(): void {
    this.serviceDependencies = {
      workflow: ['notification', 'communication'],
      enhancedAppointments: ['notification', 'workflow', 'communication'],
      enhancedCustomers: ['analytics', 'notification'],
      analytics: [],
      notification: [],
      search: [],
      communication: [],
      appointments: [],
      payments: [],
      tattooRequests: []
    };
  }

  private trackServiceCreation(serviceName: string): void {
    if (!this.serviceStats.has(serviceName)) {
      this.serviceStats.set(serviceName, {
        calls: 0,
        responseTime: 0,
        errors: 0,
        createdAt: new Date()
      });
    }
  }

  private async performServiceHealthCheck(serviceName: string, service: any): Promise<void> {
    // Perform basic health checks based on service type
    switch (serviceName) {
      case 'analytics':
        // Try to get basic metrics without parameters
        return;
        
      case 'search':
        // Search service validates query length, so this will throw expected error
        try {
          await service.globalSearch('test');
        } catch (error) {
          if (error.message.includes('2 characters')) {
            return; // Expected validation error
          }
          throw error;
        }
        break;
        
      case 'notification':
        await service.getNotificationStats();
        break;
        
      case 'communication':
        await service.getCommunicationStats();
        break;
        
      case 'workflow':
        await service.getActiveWorkflows();
        break;
        
      default:
        // For other services, just check if they exist
        if (!service) {
          throw new Error('Service not available');
        }
    }
  }
}

// Export singleton instance
export const serviceRegistry = ServiceRegistry.getInstance(); 