import { prisma } from '../prisma/prisma';
import { ValidationError, NotFoundError } from './errors';
import { NotificationService } from './notificationService';
import { CommunicationService } from './communicationService';

export interface Workflow {
  id: string;
  name: string;
  description: string;
  trigger: WorkflowTrigger;
  conditions: WorkflowCondition[];
  actions: WorkflowAction[];
  isActive: boolean;
  priority: number;
  executionCount: number;
  lastExecutedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface WorkflowTrigger {
  type: TriggerType;
  event: string;
  entityType: string;
  filters?: Record<string, any>;
}

export enum TriggerType {
  EVENT = 'event',           // When specific event occurs
  SCHEDULE = 'schedule',     // Time-based triggers
  CONDITION = 'condition',   // When condition is met
  MANUAL = 'manual'          // Manually triggered
}

export interface WorkflowCondition {
  field: string;
  operator: ConditionOperator;
  value: any;
  logicalOperator?: 'AND' | 'OR';
}

export enum ConditionOperator {
  EQUALS = 'equals',
  NOT_EQUALS = 'not_equals',
  GREATER_THAN = 'greater_than',
  LESS_THAN = 'less_than',
  CONTAINS = 'contains',
  NOT_CONTAINS = 'not_contains',
  IS_NULL = 'is_null',
  IS_NOT_NULL = 'is_not_null',
  IN = 'in',
  NOT_IN = 'not_in'
}

export interface WorkflowAction {
  type: ActionType;
  config: Record<string, any>;
  delay?: number; // Delay in minutes before executing
  condition?: WorkflowCondition;
}

export enum ActionType {
  SEND_EMAIL = 'send_email',
  SEND_SMS = 'send_sms',
  CREATE_NOTIFICATION = 'create_notification',
  UPDATE_STATUS = 'update_status',
  CREATE_APPOINTMENT = 'create_appointment',
  SEND_PAYMENT_LINK = 'send_payment_link',
  CREATE_TASK = 'create_task',
  WEBHOOK = 'webhook',
  WAIT = 'wait'
}

export interface WorkflowExecution {
  id: string;
  workflowId: string;
  entityId: string;
  entityType: string;
  status: ExecutionStatus;
  startedAt: Date;
  completedAt?: Date;
  errorMessage?: string;
  executionLog: ExecutionLogEntry[];
  data: Record<string, any>;
}

export enum ExecutionStatus {
  PENDING = 'pending',
  RUNNING = 'running',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled'
}

export interface ExecutionLogEntry {
  timestamp: Date;
  action: string;
  status: 'success' | 'error' | 'skipped';
  message: string;
  data?: any;
}

export interface WorkflowDefinition {
  name: string;
  description: string;
  trigger: WorkflowTrigger;
  conditions?: WorkflowCondition[];
  actions: WorkflowAction[];
  isActive?: boolean;
  priority?: number;
}

export interface AutomationRule {
  id: string;
  name: string;
  trigger: string;
  conditions: Record<string, any>;
  actions: Record<string, any>;
  isActive: boolean;
}

export interface WorkflowStats {
  totalWorkflows: number;
  activeWorkflows: number;
  totalExecutions: number;
  successRate: number;
  averageExecutionTime: number;
  executionsByStatus: Record<ExecutionStatus, number>;
  topWorkflows: Array<{
    id: string;
    name: string;
    executionCount: number;
    successRate: number;
  }>;
}

/**
 * Workflow Service for business process automation
 * Handles workflow creation, execution, and management
 */
export class WorkflowService {
  private notificationService: NotificationService;
  private communicationService: CommunicationService;

  constructor() {
    this.notificationService = new NotificationService();
    this.communicationService = new CommunicationService();
  }

  /**
   * Create a new workflow
   */
  async createWorkflow(definition: WorkflowDefinition): Promise<Workflow> {
    // Validate workflow definition
    this.validateWorkflowDefinition(definition);

    // Store workflow in audit log
    const auditLog = await prisma.auditLog.create({
      data: {
        action: 'workflow_created',
        resource: 'Workflow',
        resourceType: 'workflow',
        details: {
          name: definition.name,
          description: definition.description,
          trigger: definition.trigger,
          conditions: definition.conditions || [],
          actions: definition.actions,
          isActive: definition.isActive !== false,
          priority: definition.priority || 1,
          executionCount: 0
        }
      }
    });

    return {
      id: auditLog.id,
      name: definition.name,
      description: definition.description,
      trigger: definition.trigger,
      conditions: definition.conditions || [],
      actions: definition.actions,
      isActive: definition.isActive !== false,
      priority: definition.priority || 1,
      executionCount: 0,
      createdAt: auditLog.createdAt,
      updatedAt: auditLog.createdAt
    };
  }

  /**
   * Execute a workflow
   */
  async executeWorkflow(workflowId: string, entityId: string, entityType: string, data: Record<string, any> = {}): Promise<WorkflowExecution> {
    const workflow = await this.getWorkflow(workflowId);
    if (!workflow || !workflow.isActive) {
      throw new NotFoundError('Workflow', workflowId);
    }

    // Create execution record
    const execution = await this.createExecution(workflowId, entityId, entityType, data);

    try {
      // Update execution status to running
      await this.updateExecutionStatus(execution.id, ExecutionStatus.RUNNING);

      // Check workflow conditions
      const conditionsMet = await this.evaluateConditions(workflow.conditions, entityId, entityType, data);
      
      if (!conditionsMet) {
        await this.logExecutionEntry(execution.id, 'conditions_check', 'skipped', 'Workflow conditions not met');
        await this.updateExecutionStatus(execution.id, ExecutionStatus.COMPLETED);
        return execution;
      }

      // Execute workflow actions
      for (const action of workflow.actions) {
        try {
          // Check action-specific condition if exists
          if (action.condition) {
            const actionConditionMet = await this.evaluateConditions([action.condition], entityId, entityType, data);
            if (!actionConditionMet) {
              await this.logExecutionEntry(execution.id, action.type, 'skipped', 'Action condition not met');
              continue;
            }
          }

          // Apply delay if specified
          if (action.delay && action.delay > 0) {
            await this.logExecutionEntry(execution.id, 'delay', 'success', `Waiting ${action.delay} minutes`);
            // In a real implementation, this would schedule the action for later
            // For now, we'll simulate the delay
            await new Promise(resolve => setTimeout(resolve, Math.min(action.delay * 1000, 5000))); // Max 5 second for demo
          }

          // Execute the action
          await this.executeAction(action, entityId, entityType, data, execution.id);
          
        } catch (actionError) {
          await this.logExecutionEntry(execution.id, action.type, 'error', `Action failed: ${actionError.message}`);
          // Continue with other actions unless it's a critical error
        }
      }

      // Mark execution as completed
      await this.updateExecutionStatus(execution.id, ExecutionStatus.COMPLETED);
      await this.incrementWorkflowExecutionCount(workflowId);

    } catch (error) {
      await this.logExecutionEntry(execution.id, 'workflow_execution', 'error', error.message);
      await this.updateExecutionStatus(execution.id, ExecutionStatus.FAILED, error.message);
      throw error;
    }

    return execution;
  }

  /**
   * Get active workflows
   */
  async getActiveWorkflows(): Promise<Workflow[]> {
    const workflowLogs = await prisma.auditLog.findMany({
      where: {
        action: 'workflow_created',
        details: { path: ['isActive'], equals: true }
      },
      orderBy: [
        { details: { path: ['priority'], sort: 'desc' } },
        { createdAt: 'desc' }
      ]
    });

    return workflowLogs.map(log => this.mapAuditLogToWorkflow(log));
  }

  /**
   * Get workflow by ID
   */
  async getWorkflow(workflowId: string): Promise<Workflow | null> {
    const workflowLog = await prisma.auditLog.findUnique({
      where: { id: workflowId }
    });

    if (!workflowLog || workflowLog.action !== 'workflow_created') {
      return null;
    }

    return this.mapAuditLogToWorkflow(workflowLog);
  }

  /**
   * Update workflow status
   */
  async updateWorkflowStatus(workflowId: string, isActive: boolean): Promise<void> {
    const workflow = await this.getWorkflow(workflowId);
    if (!workflow) {
      throw new NotFoundError('Workflow', workflowId);
    }

    await prisma.auditLog.update({
      where: { id: workflowId },
      data: {
        details: {
          ...workflow,
          isActive,
          updatedAt: new Date().toISOString()
        }
      }
    });
  }

  /**
   * Trigger workflows based on event
   */
  async triggerWorkflows(event: string, entityType: string, entityId: string, data: Record<string, any> = {}): Promise<WorkflowExecution[]> {
    const activeWorkflows = await this.getActiveWorkflows();
    
    // Find workflows that match the trigger
    const matchingWorkflows = activeWorkflows.filter(workflow => 
      workflow.trigger.type === TriggerType.EVENT &&
      workflow.trigger.event === event &&
      workflow.trigger.entityType === entityType
    );

    const executions: WorkflowExecution[] = [];

    // Execute matching workflows
    for (const workflow of matchingWorkflows) {
      try {
        const execution = await this.executeWorkflow(workflow.id, entityId, entityType, data);
        executions.push(execution);
      } catch (error) {
        console.error(`Failed to execute workflow ${workflow.id}:`, error);
      }
    }

    return executions;
  }

  /**
   * Create predefined automation rules
   */
  async createDefaultAutomationRules(): Promise<void> {
    const defaultRules: WorkflowDefinition[] = [
      {
        name: 'Appointment Confirmation',
        description: 'Send confirmation email when appointment is created',
        trigger: {
          type: TriggerType.EVENT,
          event: 'appointment_created',
          entityType: 'appointment'
        },
        actions: [
          {
            type: ActionType.SEND_EMAIL,
            config: {
              templateType: 'appointment_confirmation',
              delay: 5 // Send 5 minutes after creation
            }
          }
        ]
      },
      {
        name: 'Payment Receipt',
        description: 'Send receipt when payment is completed',
        trigger: {
          type: TriggerType.EVENT,
          event: 'payment_completed',
          entityType: 'payment'
        },
        actions: [
          {
            type: ActionType.SEND_EMAIL,
            config: {
              templateType: 'payment_receipt'
            }
          }
        ]
      },
      {
        name: 'Request Follow-up',
        description: 'Follow up on pending tattoo requests after 3 days',
        trigger: {
          type: TriggerType.SCHEDULE,
          event: 'daily_check',
          entityType: 'tattoo_request'
        },
        conditions: [
          {
            field: 'status',
            operator: ConditionOperator.EQUALS,
            value: 'new'
          },
          {
            field: 'createdAt',
            operator: ConditionOperator.LESS_THAN,
            value: '3_days_ago'
          }
        ],
        actions: [
          {
            type: ActionType.CREATE_NOTIFICATION,
            config: {
              title: 'Follow up required',
              message: 'Tattoo request pending for over 3 days',
              priority: 'high'
            }
          }
        ]
      },
      {
        name: 'Appointment Reminder',
        description: 'Send reminder 24 hours before appointment',
        trigger: {
          type: TriggerType.SCHEDULE,
          event: 'appointment_reminder',
          entityType: 'appointment'
        },
        actions: [
          {
            type: ActionType.SEND_EMAIL,
            config: {
              templateType: 'appointment_reminder'
            }
          }
        ]
      }
    ];

    for (const rule of defaultRules) {
      try {
        await this.createWorkflow(rule);
      } catch (error) {
        console.error(`Failed to create default rule ${rule.name}:`, error);
      }
    }
  }

  /**
   * Get workflow statistics
   */
  async getWorkflowStats(period: 'week' | 'month' | 'quarter' = 'month'): Promise<WorkflowStats> {
    const startDate = this.getStartDateForPeriod(period);
    
    const allWorkflows = await prisma.auditLog.findMany({
      where: { action: 'workflow_created' }
    });

    const executions = await prisma.auditLog.findMany({
      where: {
        action: 'workflow_execution_created',
        createdAt: { gte: startDate }
      }
    });

    const totalWorkflows = allWorkflows.length;
    const activeWorkflows = allWorkflows.filter(w => w.details?.isActive).length;
    const totalExecutions = executions.length;
    
    const completedExecutions = executions.filter(e => e.details?.status === ExecutionStatus.COMPLETED);
    const successRate = totalExecutions > 0 ? (completedExecutions.length / totalExecutions) * 100 : 0;

    const executionsByStatus = executions.reduce((acc, execution) => {
      const status = execution.details?.status || ExecutionStatus.PENDING;
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {} as Record<ExecutionStatus, number>);

    return {
      totalWorkflows,
      activeWorkflows,
      totalExecutions,
      successRate: Math.round(successRate),
      averageExecutionTime: 0, // Would calculate from execution logs
      executionsByStatus,
      topWorkflows: [] // Would calculate from execution counts
    };
  }

  // Private helper methods

  private validateWorkflowDefinition(definition: WorkflowDefinition): void {
    if (!definition.name || !definition.trigger || !definition.actions || definition.actions.length === 0) {
      throw new ValidationError('Invalid workflow definition: name, trigger, and actions are required');
    }

    if (!Object.values(TriggerType).includes(definition.trigger.type)) {
      throw new ValidationError('Invalid trigger type');
    }

    for (const action of definition.actions) {
      if (!Object.values(ActionType).includes(action.type)) {
        throw new ValidationError(`Invalid action type: ${action.type}`);
      }
    }
  }

  private async createExecution(workflowId: string, entityId: string, entityType: string, data: Record<string, any>): Promise<WorkflowExecution> {
    const auditLog = await prisma.auditLog.create({
      data: {
        action: 'workflow_execution_created',
        resource: 'WorkflowExecution',
        resourceType: 'workflow_execution',
        resourceId: entityId,
        details: {
          workflowId,
          entityId,
          entityType,
          status: ExecutionStatus.PENDING,
          data,
          executionLog: []
        }
      }
    });

    return {
      id: auditLog.id,
      workflowId,
      entityId,
      entityType,
      status: ExecutionStatus.PENDING,
      startedAt: auditLog.createdAt,
      executionLog: [],
      data
    };
  }

  private async updateExecutionStatus(executionId: string, status: ExecutionStatus, errorMessage?: string): Promise<void> {
    const execution = await prisma.auditLog.findUnique({ where: { id: executionId } });
    if (execution) {
      await prisma.auditLog.update({
        where: { id: executionId },
        data: {
          details: {
            ...execution.details,
            status,
            errorMessage,
            completedAt: status === ExecutionStatus.COMPLETED || status === ExecutionStatus.FAILED 
              ? new Date().toISOString() 
              : execution.details?.completedAt
          }
        }
      });
    }
  }

  private async logExecutionEntry(executionId: string, action: string, status: 'success' | 'error' | 'skipped', message: string, data?: any): Promise<void> {
    const execution = await prisma.auditLog.findUnique({ where: { id: executionId } });
    if (execution) {
      const executionLog = execution.details?.executionLog || [];
      executionLog.push({
        timestamp: new Date().toISOString(),
        action,
        status,
        message,
        data
      });

      await prisma.auditLog.update({
        where: { id: executionId },
        data: {
          details: {
            ...execution.details,
            executionLog
          }
        }
      });
    }
  }

  private async evaluateConditions(conditions: WorkflowCondition[], entityId: string, entityType: string, data: Record<string, any>): Promise<boolean> {
    if (!conditions || conditions.length === 0) {
      return true;
    }

    // Get entity data based on type
    let entityData: any = {};
    try {
      switch (entityType) {
        case 'appointment':
          entityData = await prisma.appointment.findUnique({ where: { id: entityId }, include: { customer: true } });
          break;
        case 'customer':
          entityData = await prisma.customer.findUnique({ where: { id: entityId } });
          break;
        case 'payment':
          entityData = await prisma.payment.findUnique({ where: { id: entityId }, include: { customer: true } });
          break;
        case 'tattoo_request':
          entityData = await prisma.tattooRequest.findUnique({ where: { id: entityId }, include: { customer: true } });
          break;
        default:
          entityData = data;
      }
    } catch (error) {
      console.error('Error fetching entity data for condition evaluation:', error);
      return false;
    }

    // Combine entity data with provided data
    const combinedData = { ...entityData, ...data };

    // Evaluate each condition
    for (const condition of conditions) {
      const fieldValue = this.getFieldValue(combinedData, condition.field);
      const conditionMet = this.evaluateCondition(fieldValue, condition.operator, condition.value);
      
      if (!conditionMet) {
        return false;
      }
    }

    return true;
  }

  private evaluateCondition(fieldValue: any, operator: ConditionOperator, expectedValue: any): boolean {
    switch (operator) {
      case ConditionOperator.EQUALS:
        return fieldValue === expectedValue;
      case ConditionOperator.NOT_EQUALS:
        return fieldValue !== expectedValue;
      case ConditionOperator.GREATER_THAN:
        return fieldValue > expectedValue;
      case ConditionOperator.LESS_THAN:
        return fieldValue < expectedValue;
      case ConditionOperator.CONTAINS:
        return String(fieldValue).toLowerCase().includes(String(expectedValue).toLowerCase());
      case ConditionOperator.NOT_CONTAINS:
        return !String(fieldValue).toLowerCase().includes(String(expectedValue).toLowerCase());
      case ConditionOperator.IS_NULL:
        return fieldValue == null;
      case ConditionOperator.IS_NOT_NULL:
        return fieldValue != null;
      case ConditionOperator.IN:
        return Array.isArray(expectedValue) && expectedValue.includes(fieldValue);
      case ConditionOperator.NOT_IN:
        return Array.isArray(expectedValue) && !expectedValue.includes(fieldValue);
      default:
        return false;
    }
  }

  private getFieldValue(data: any, fieldPath: string): any {
    const keys = fieldPath.split('.');
    let value = data;
    
    for (const key of keys) {
      if (value && typeof value === 'object' && key in value) {
        value = value[key];
      } else {
        return undefined;
      }
    }
    
    return value;
  }

  private async executeAction(action: WorkflowAction, entityId: string, entityType: string, data: Record<string, any>, executionId: string): Promise<void> {
    try {
      switch (action.type) {
        case ActionType.SEND_EMAIL:
          await this.executeEmailAction(action, entityId, entityType, data);
          break;
        case ActionType.SEND_SMS:
          await this.executeSMSAction(action, entityId, entityType, data);
          break;
        case ActionType.CREATE_NOTIFICATION:
          await this.executeNotificationAction(action, entityId, entityType, data);
          break;
        case ActionType.UPDATE_STATUS:
          await this.executeUpdateStatusAction(action, entityId, entityType, data);
          break;
        default:
          throw new Error(`Unsupported action type: ${action.type}`);
      }

      await this.logExecutionEntry(executionId, action.type, 'success', `Action executed successfully`);
      
    } catch (error) {
      await this.logExecutionEntry(executionId, action.type, 'error', error.message);
      throw error;
    }
  }

  private async executeEmailAction(action: WorkflowAction, entityId: string, entityType: string, data: Record<string, any>): Promise<void> {
    // Implementation would depend on the specific email action configuration
    console.log('Executing email action for entity:', entityId, 'with config:', action.config);
  }

  private async executeSMSAction(action: WorkflowAction, entityId: string, entityType: string, data: Record<string, any>): Promise<void> {
    // Implementation would depend on the specific SMS action configuration
    console.log('Executing SMS action for entity:', entityId, 'with config:', action.config);
  }

  private async executeNotificationAction(action: WorkflowAction, entityId: string, entityType: string, data: Record<string, any>): Promise<void> {
    await this.notificationService.createNotification({
      title: action.config.title || 'Workflow Notification',
      message: action.config.message || 'Workflow action executed',
      type: action.config.type || 'system_alert',
      priority: action.config.priority || 'medium'
    });
  }

  private async executeUpdateStatusAction(action: WorkflowAction, entityId: string, entityType: string, data: Record<string, any>): Promise<void> {
    const newStatus = action.config.status;
    
    switch (entityType) {
      case 'appointment':
        await prisma.appointment.update({
          where: { id: entityId },
          data: { status: newStatus }
        });
        break;
      case 'tattoo_request':
        await prisma.tattooRequest.update({
          where: { id: entityId },
          data: { status: newStatus }
        });
        break;
      case 'payment':
        await prisma.payment.update({
          where: { id: entityId },
          data: { status: newStatus }
        });
        break;
      default:
        throw new Error(`Cannot update status for entity type: ${entityType}`);
    }
  }

  private async incrementWorkflowExecutionCount(workflowId: string): Promise<void> {
    const workflow = await prisma.auditLog.findUnique({ where: { id: workflowId } });
    if (workflow) {
      const executionCount = (workflow.details?.executionCount || 0) + 1;
      await prisma.auditLog.update({
        where: { id: workflowId },
        data: {
          details: {
            ...workflow.details,
            executionCount,
            lastExecutedAt: new Date().toISOString()
          }
        }
      });
    }
  }

  private mapAuditLogToWorkflow(log: any): Workflow {
    return {
      id: log.id,
      name: log.details?.name || '',
      description: log.details?.description || '',
      trigger: log.details?.trigger || {},
      conditions: log.details?.conditions || [],
      actions: log.details?.actions || [],
      isActive: log.details?.isActive !== false,
      priority: log.details?.priority || 1,
      executionCount: log.details?.executionCount || 0,
      lastExecutedAt: log.details?.lastExecutedAt ? new Date(log.details.lastExecutedAt) : undefined,
      createdAt: log.createdAt,
      updatedAt: log.details?.updatedAt ? new Date(log.details.updatedAt) : log.createdAt
    };
  }

  private getStartDateForPeriod(period: 'week' | 'month' | 'quarter'): Date {
    const now = new Date();
    switch (period) {
      case 'week':
        return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      case 'month':
        return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      case 'quarter':
        return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
    }
  }
} 