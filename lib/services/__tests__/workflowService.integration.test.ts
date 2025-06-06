import { describe, it, expect, beforeEach, beforeAll, afterAll, vi } from 'vitest';
import { WorkflowService, WorkflowEventType, WorkflowActionType } from '../workflowService';
import { testPrisma, setupExternalMocks, createTestUser, createTestCustomer } from './testSetup';
import { BookingStatus, BookingType } from '../../types/booking';

// Use shared test setup
setupExternalMocks();

describe('WorkflowService (Integration)', () => {
  let workflowService: WorkflowService;
  let testAdmin: any;
  let testArtist: any;
  let testCustomer: any;

  beforeEach(async () => {
    console.log('\n⚙️ Setting up WorkflowService integration test');
    
    // Initialize REAL service (no mocks)
    workflowService = new WorkflowService();
    
    // Create test users
    testAdmin = await createTestUser('admin');
    testArtist = await createTestUser('artist');
    testCustomer = await createTestCustomer({
      name: 'Jane Doe',
      email: 'jane@test.com',
      phone: '+1-555-0456'
    });
    
    console.log('✅ WorkflowService test setup complete');
  });

  describe('⚙️ Workflow Management', () => {
    it('should create workflow successfully', async () => {
      console.log('\n📝 Testing workflow creation');
      
      const workflowData = {
        name: 'Test Workflow',
        eventType: WorkflowEventType.APPOINTMENT_CREATED,
        isActive: true,
        conditions: [],
        actions: [{
          type: WorkflowActionType.SEND_EMAIL,
          config: { templateId: 'test' }
        }]
      };

      const workflow = await workflowService.createWorkflow(workflowData);

      expect(workflow).toBeDefined();
      expect(workflow.name).toBe(workflowData.name);
      expect(workflow.eventType).toBe(WorkflowEventType.APPOINTMENT_CREATED);

      console.log('✅ Workflow created successfully');
    });

    it('should list workflows', async () => {
      console.log('\n📋 Testing workflow listing');
      
      await workflowService.createWorkflow({
        name: 'List Test Workflow',
        eventType: WorkflowEventType.PAYMENT_RECEIVED,
        isActive: true,
        conditions: [],
        actions: []
      });

      const workflows = await workflowService.getWorkflows();
      expect(Array.isArray(workflows)).toBe(true);
      expect(workflows.length).toBeGreaterThan(0);

      console.log(`✅ Found ${workflows.length} workflows`);
    });
  });

  describe('🎯 Event Processing', () => {
    it('should trigger workflows for events', async () => {
      console.log('\n🎯 Testing event triggering');
      
      await workflowService.createWorkflow({
        name: 'Event Test Workflow',
        eventType: WorkflowEventType.CUSTOMER_CREATED,
        isActive: true,
        conditions: [],
        actions: [{
          type: WorkflowActionType.CREATE_NOTIFICATION,
          config: {
            title: 'New Customer',
            userId: testAdmin.id
          }
        }]
      });

      const result = await workflowService.triggerWorkflows(
        WorkflowEventType.CUSTOMER_CREATED,
        { customer: { id: testCustomer.id, name: testCustomer.name } }
      );

      expect(result.success).toBe(true);
      expect(result.triggeredWorkflows.length).toBeGreaterThan(0);

      console.log('✅ Event triggering working correctly');
    });
  });

  describe('📊 Analytics', () => {
    it('should provide workflow statistics', async () => {
      console.log('\n📊 Testing workflow statistics');
      
      const stats = await workflowService.getWorkflowStats();

      expect(stats).toHaveProperty('totalWorkflows');
      expect(stats).toHaveProperty('activeWorkflows');
      expect(stats.totalWorkflows).toBeTypeOf('number');

        conditions: [
          {
            field: 'appointment.type',
            operator: 'equals',
            value: 'consultation'
          }
        ],
        actions: [
          {
            type: WorkflowActionType.SEND_EMAIL,
            config: {
              templateId: 'appointment_confirmation',
              to: '{{customer.email}}',
              variables: {
                customerName: '{{customer.name}}',
                appointmentDate: '{{appointment.startTime}}',
                artistName: '{{artist.name}}'
              }
            }
          }
        ]
      };

      const workflow = await workflowService.createWorkflow(workflowData);

      expect(workflow).toBeDefined();
      expect(workflow.id).toBeTruthy();
      expect(workflow.name).toBe(workflowData.name);
      expect(workflow.description).toBe(workflowData.description);
      expect(workflow.eventType).toBe(WorkflowEventType.APPOINTMENT_CREATED);
      expect(workflow.isActive).toBe(true);
      expect(workflow.conditions).toEqual(workflowData.conditions);
      expect(workflow.actions).toEqual(workflowData.actions);
      expect(workflow.createdAt).toBeInstanceOf(Date);

      console.log('✅ Basic workflow created successfully');
      console.log(`⚙️ Workflow: ${workflow.name} with ${workflow.actions.length} actions`);
    });

    it('should create complex workflow with multiple conditions and actions', async () => {
      console.log('\n🔗 Testing complex workflow creation');
      
      const complexWorkflow = {
        name: 'VIP Customer Payment Workflow',
        description: 'Special handling for VIP customer payments over $500',
        eventType: WorkflowEventType.PAYMENT_RECEIVED,
        isActive: true,
        conditions: [
          {
            field: 'payment.amount',
            operator: 'greater_than',
            value: 500
          },
          {
            field: 'customer.isVip',
            operator: 'equals',
            value: true
          }
        ],
        actions: [
          {
            type: WorkflowActionType.SEND_EMAIL,
            config: {
              templateId: 'vip_payment_receipt',
              to: '{{customer.email}}',
              variables: {
                customerName: '{{customer.name}}',
                amount: '{{payment.amount}}',
                paymentDate: '{{payment.createdAt}}'
              }
            }
          },
          {
            type: WorkflowActionType.CREATE_NOTIFICATION,
            config: {
              title: 'VIP Payment Received',
              message: 'VIP customer {{customer.name}} made a payment of ${{payment.amount}}',
              type: 'payment_received',
              priority: 'high',
              userId: testAdmin.id
            }
          },
          {
            type: WorkflowActionType.UPDATE_CUSTOMER,
            config: {
              customerId: '{{customer.id}}',
              updates: {
                notes: 'Recent VIP payment of ${{payment.amount}} on {{payment.createdAt}}'
              }
            }
          }
        ]
      };

      const workflow = await workflowService.createWorkflow(complexWorkflow);

      expect(workflow.conditions).toHaveLength(2);
      expect(workflow.actions).toHaveLength(3);
      expect(workflow.actions[0].type).toBe(WorkflowActionType.SEND_EMAIL);
      expect(workflow.actions[1].type).toBe(WorkflowActionType.CREATE_NOTIFICATION);
      expect(workflow.actions[2].type).toBe(WorkflowActionType.UPDATE_CUSTOMER);

      console.log('✅ Complex workflow created successfully');
      console.log(`🔗 ${workflow.conditions.length} conditions, ${workflow.actions.length} actions`);
    });

    it('should list and filter workflows', async () => {
      console.log('\n📋 Testing workflow listing and filtering');
      
      // Create multiple workflows
      await workflowService.createWorkflow({
        name: 'Active Appointment Workflow',
        eventType: WorkflowEventType.APPOINTMENT_CREATED,
        isActive: true,
        conditions: [],
        actions: [{ type: WorkflowActionType.SEND_EMAIL, config: {} }]
      });

      await workflowService.createWorkflow({
        name: 'Inactive Payment Workflow',
        eventType: WorkflowEventType.PAYMENT_RECEIVED,
        isActive: false,
        conditions: [],
        actions: [{ type: WorkflowActionType.CREATE_NOTIFICATION, config: {} }]
      });

      // List all workflows
      const allWorkflows = await workflowService.getWorkflows();
      expect(allWorkflows.length).toBeGreaterThanOrEqual(2);

      // Filter by active status
      const activeWorkflows = await workflowService.getWorkflows({ isActive: true });
      activeWorkflows.forEach(workflow => {
        expect(workflow.isActive).toBe(true);
      });

      // Filter by event type
      const appointmentWorkflows = await workflowService.getWorkflows({ 
        eventType: WorkflowEventType.APPOINTMENT_CREATED 
      });
      appointmentWorkflows.forEach(workflow => {
        expect(workflow.eventType).toBe(WorkflowEventType.APPOINTMENT_CREATED);
      });

      console.log('✅ Workflow listing and filtering working');
      console.log(`📊 Total: ${allWorkflows.length}, Active: ${activeWorkflows.length}, Appointments: ${appointmentWorkflows.length}`);
    });

    it('should update workflow successfully', async () => {
      console.log('\n✏️ Testing workflow updates');
      
      const workflow = await workflowService.createWorkflow({
        name: 'Original Workflow',
        eventType: WorkflowEventType.REQUEST_SUBMITTED,
        isActive: true,
        conditions: [],
        actions: [{ type: WorkflowActionType.SEND_EMAIL, config: {} }]
      });

      const updates = {
        name: 'Updated Workflow',
        description: 'Updated description',
        isActive: false,
        actions: [
          { type: WorkflowActionType.CREATE_NOTIFICATION, config: { title: 'Updated' } }
        ]
      };

      const updatedWorkflow = await workflowService.updateWorkflow(workflow.id, updates);

      expect(updatedWorkflow.name).toBe('Updated Workflow');
      expect(updatedWorkflow.description).toBe('Updated description');
      expect(updatedWorkflow.isActive).toBe(false);
      expect(updatedWorkflow.actions[0].type).toBe(WorkflowActionType.CREATE_NOTIFICATION);

      console.log('✅ Workflow updated successfully');
    });

    it('should delete workflow', async () => {
      console.log('\n🗑️ Testing workflow deletion');
      
      const workflow = await workflowService.createWorkflow({
        name: 'Temporary Workflow',
        eventType: WorkflowEventType.PAYMENT_FAILED,
        isActive: true,
        conditions: [],
        actions: []
      });

      await workflowService.deleteWorkflow(workflow.id);

      // Verify workflow is deleted
      const workflows = await workflowService.getWorkflows();
      const deletedWorkflow = workflows.find(w => w.id === workflow.id);
      expect(deletedWorkflow).toBeUndefined();

      console.log('✅ Workflow deleted successfully');
    });
  });

  describe('🎯 Event Processing and Triggering', () => {
    let appointmentWorkflow: any;
    let paymentWorkflow: any;

    beforeEach(async () => {
      console.log('\n🎯 Setting up event processing test workflows');
      
      // Create appointment workflow
      appointmentWorkflow = await workflowService.createWorkflow({
        name: 'Appointment Created Handler',
        eventType: WorkflowEventType.APPOINTMENT_CREATED,
        isActive: true,
        conditions: [
          {
            field: 'appointment.type',
            operator: 'equals',
            value: 'consultation'
          }
        ],
        actions: [
          {
            type: WorkflowActionType.SEND_EMAIL,
            config: {
              templateId: 'appointment_confirmation',
              to: '{{customer.email}}',
              variables: {
                customerName: '{{customer.name}}',
                appointmentDate: '{{appointment.startTime}}'
              }
            }
          },
          {
            type: WorkflowActionType.CREATE_NOTIFICATION,
            config: {
              title: 'New Consultation Booked',
              message: 'Consultation appointment created for {{customer.name}}',
              type: 'appointment_created',
              userId: testAdmin.id
            }
          }
        ]
      });

      // Create payment workflow
      paymentWorkflow = await workflowService.createWorkflow({
        name: 'Payment Received Handler',
        eventType: WorkflowEventType.PAYMENT_RECEIVED,
        isActive: true,
        conditions: [
          {
            field: 'payment.amount',
            operator: 'greater_than',
            value: 100
          }
        ],
        actions: [
          {
            type: WorkflowActionType.SEND_EMAIL,
            config: {
              templateId: 'payment_receipt',
              to: '{{customer.email}}',
              variables: {
                customerName: '{{customer.name}}',
                amount: '{{payment.amount}}'
              }
            }
          }
        ]
      });

      console.log('✅ Test workflows created for event processing');
    });

    it('should trigger workflows for appointment events', async () => {
      console.log('\n📅 Testing appointment event workflow triggering');
      
      // Create appointment data
      const appointmentData = {
        id: 'test-apt-123',
        customerId: testCustomer.id,
        artistId: testArtist.id,
        startTime: new Date(Date.now() + 24 * 60 * 60 * 1000),
        type: 'consultation',
        status: 'scheduled'
      };

      const customerData = {
        id: testCustomer.id,
        name: testCustomer.name,
        email: testCustomer.email
      };

      const artistData = {
        id: testArtist.id,
        name: 'Test Artist',
        email: testArtist.email
      };

      // Trigger the workflow
      const result = await workflowService.triggerWorkflows(
        WorkflowEventType.APPOINTMENT_CREATED,
        {
          appointment: appointmentData,
          customer: customerData,
          artist: artistData
        }
      );

      expect(result.success).toBe(true);
      expect(result.triggeredWorkflows).toContain(appointmentWorkflow.id);
      expect(result.executedActions).toBeGreaterThan(0);

      console.log('✅ Appointment workflow triggered successfully');
      console.log(`⚙️ Triggered ${result.triggeredWorkflows.length} workflows, executed ${result.executedActions} actions`);
    });

    it('should trigger workflows for payment events', async () => {
      console.log('\n💳 Testing payment event workflow triggering');
      
      const paymentData = {
        id: 'test-payment-456',
        customerId: testCustomer.id,
        amount: 250,
        status: 'completed',
        createdAt: new Date()
      };

      const customerData = {
        id: testCustomer.id,
        name: testCustomer.name,
        email: testCustomer.email
      };

      const result = await workflowService.triggerWorkflows(
        WorkflowEventType.PAYMENT_RECEIVED,
        {
          payment: paymentData,
          customer: customerData
        }
      );

      expect(result.success).toBe(true);
      expect(result.triggeredWorkflows).toContain(paymentWorkflow.id);

      console.log('✅ Payment workflow triggered successfully');
    });

    it('should not trigger workflows when conditions are not met', async () => {
      console.log('\n🚫 Testing workflow condition filtering');
      
      // Create appointment that doesn't match conditions (not a consultation)
      const appointmentData = {
        id: 'test-apt-789',
        customerId: testCustomer.id,
        artistId: testArtist.id,
        startTime: new Date(Date.now() + 24 * 60 * 60 * 1000),
        type: 'tattoo_session', // This won't match the 'consultation' condition
        status: 'scheduled'
      };

      const result = await workflowService.triggerWorkflows(
        WorkflowEventType.APPOINTMENT_CREATED,
        {
          appointment: appointmentData,
          customer: { id: testCustomer.id, name: testCustomer.name, email: testCustomer.email }
        }
      );

      expect(result.success).toBe(true);
      expect(result.triggeredWorkflows).not.toContain(appointmentWorkflow.id);
      expect(result.executedActions).toBe(0);

      console.log('✅ Workflow conditions properly filtered non-matching events');
    });

    it('should handle workflow execution errors gracefully', async () => {
      console.log('\n❌ Testing workflow error handling');
      
      // Create workflow with invalid action config
      const errorWorkflow = await workflowService.createWorkflow({
        name: 'Error Test Workflow',
        eventType: WorkflowEventType.PAYMENT_FAILED,
        isActive: true,
        conditions: [],
        actions: [
          {
            type: WorkflowActionType.SEND_EMAIL,
            config: {
              // Missing required fields to cause error
              to: '{{invalid.field}}'
            }
          }
        ]
      });

      const result = await workflowService.triggerWorkflows(
        WorkflowEventType.PAYMENT_FAILED,
        {
          payment: { id: 'test-fail', amount: 100 },
          customer: { id: testCustomer.id, name: testCustomer.name, email: testCustomer.email }
        }
      );

      expect(result.success).toBe(true); // Overall success even if some actions fail
      expect(result.errors).toBeDefined();
      expect(result.errors.length).toBeGreaterThan(0);

      console.log('✅ Workflow execution errors handled gracefully');
      console.log(`⚠️ Captured ${result.errors.length} execution errors`);
    });
  });

  describe('🔧 Action Execution', () => {
    it('should execute email actions correctly', async () => {
      console.log('\n📧 Testing email action execution');
      
      const emailAction = {
        type: WorkflowActionType.SEND_EMAIL,
        config: {
          templateId: 'test_template',
          to: 'test@example.com',
          variables: {
            customerName: 'John Doe',
            amount: 150
          }
        }
      };

      const context = {
        customer: { name: 'John Doe', email: 'test@example.com' },
        payment: { amount: 150 }
      };

      const result = await workflowService.executeAction(emailAction, context);

      expect(result.success).toBe(true);
      expect(result.actionType).toBe(WorkflowActionType.SEND_EMAIL);

      console.log('✅ Email action executed successfully');
    });

    it('should execute notification actions correctly', async () => {
      console.log('\n🔔 Testing notification action execution');
      
      const notificationAction = {
        type: WorkflowActionType.CREATE_NOTIFICATION,
        config: {
          title: 'Test Notification',
          message: 'Customer {{customer.name}} performed an action',
          type: 'system_alert',
          userId: testAdmin.id
        }
      };

      const context = {
        customer: { name: 'Jane Smith', id: testCustomer.id }
      };

      const result = await workflowService.executeAction(notificationAction, context);

      expect(result.success).toBe(true);
      expect(result.actionType).toBe(WorkflowActionType.CREATE_NOTIFICATION);

      console.log('✅ Notification action executed successfully');
    });

    it('should execute customer update actions correctly', async () => {
      console.log('\n👤 Testing customer update action execution');
      
      const updateAction = {
        type: WorkflowActionType.UPDATE_CUSTOMER,
        config: {
          customerId: testCustomer.id,
          updates: {
            notes: 'Updated via workflow automation',
            tags: ['automated-update', 'workflow']
          }
        }
      };

      const context = {
        customer: { id: testCustomer.id, name: testCustomer.name }
      };

      const result = await workflowService.executeAction(updateAction, context);

      expect(result.success).toBe(true);
      expect(result.actionType).toBe(WorkflowActionType.UPDATE_CUSTOMER);

      console.log('✅ Customer update action executed successfully');
    });

    it('should execute webhook actions correctly', async () => {
      console.log('\n🌐 Testing webhook action execution');
      
      const webhookAction = {
        type: WorkflowActionType.WEBHOOK,
        config: {
          url: 'https://external-system.com/webhook',
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer token123'
          },
          payload: {
            event: 'appointment_created',
            customer: '{{customer.name}}',
            appointmentId: '{{appointment.id}}'
          }
        }
      };

      const context = {
        customer: { name: 'Bob Wilson', id: testCustomer.id },
        appointment: { id: 'apt-789' }
      };

      const result = await workflowService.executeAction(webhookAction, context);

      expect(result.success).toBe(true);
      expect(result.actionType).toBe(WorkflowActionType.WEBHOOK);

      console.log('✅ Webhook action executed successfully');
    });
  });

  describe('📊 Workflow Analytics and Monitoring', () => {
    beforeEach(async () => {
      console.log('\n📊 Setting up workflow analytics test data');
      
      // Create and execute some workflows for analytics
      const testWorkflow = await workflowService.createWorkflow({
        name: 'Analytics Test Workflow',
        eventType: WorkflowEventType.REQUEST_SUBMITTED,
        isActive: true,
        conditions: [],
        actions: [
          {
            type: WorkflowActionType.CREATE_NOTIFICATION,
            config: {
              title: 'Test Notification',
              message: 'Analytics test',
              userId: testAdmin.id
            }
          }
        ]
      });

      // Trigger the workflow a few times
      for (let i = 0; i < 3; i++) {
        await workflowService.triggerWorkflows(
          WorkflowEventType.REQUEST_SUBMITTED,
          {
            request: { id: `test-req-${i}`, customerId: testCustomer.id },
            customer: { id: testCustomer.id, name: testCustomer.name }
          }
        );
      }
    });

    it('should provide workflow execution statistics', async () => {
      console.log('\n📈 Testing workflow execution statistics');
      
      const stats = await workflowService.getWorkflowStats();

      expect(stats).toHaveProperty('totalWorkflows');
      expect(stats).toHaveProperty('activeWorkflows');
      expect(stats).toHaveProperty('totalExecutions');
      expect(stats).toHaveProperty('successRate');
      expect(stats).toHaveProperty('executionsByEventType');
      expect(stats).toHaveProperty('actionTypeBreakdown');

      expect(stats.totalWorkflows).toBeGreaterThan(0);
      expect(stats.activeWorkflows).toBeGreaterThanOrEqual(0);
      expect(stats.totalExecutions).toBeGreaterThan(0);
      expect(stats.successRate).toBeGreaterThanOrEqual(0);
      expect(stats.successRate).toBeLessThanOrEqual(100);

      console.log('✅ Workflow statistics working correctly');
      console.log(`📊 Total: ${stats.totalWorkflows}, Active: ${stats.activeWorkflows}, Executions: ${stats.totalExecutions}`);
      console.log(`📈 Success rate: ${stats.successRate}%`);
    });

    it('should provide workflow execution history', async () => {
      console.log('\n📋 Testing workflow execution history');
      
      const history = await workflowService.getWorkflowExecutionHistory({}, 1, 10);

      expect(history).toHaveProperty('data');
      expect(history).toHaveProperty('total');
      expect(history).toHaveProperty('pagination');

      expect(Array.isArray(history.data)).toBe(true);
      expect(history.total).toBeGreaterThan(0);

      if (history.data.length > 0) {
        const execution = history.data[0];
        expect(execution).toHaveProperty('id');
        expect(execution).toHaveProperty('workflowId');
        expect(execution).toHaveProperty('eventType');
        expect(execution).toHaveProperty('status');
        expect(execution).toHaveProperty('executedAt');
        expect(execution).toHaveProperty('executionTime');
      }

      console.log(`✅ Execution history working - found ${history.total} executions`);
    });

    it('should provide individual workflow performance metrics', async () => {
      console.log('\n⚡ Testing individual workflow metrics');
      
      const workflows = await workflowService.getWorkflows();
      if (workflows.length > 0) {
        const workflow = workflows[0];
        const metrics = await workflowService.getWorkflowMetrics(workflow.id);

        expect(metrics).toHaveProperty('workflowId');
        expect(metrics).toHaveProperty('totalExecutions');
        expect(metrics).toHaveProperty('successfulExecutions');
        expect(metrics).toHaveProperty('failedExecutions');
        expect(metrics).toHaveProperty('averageExecutionTime');
        expect(metrics).toHaveProperty('lastExecuted');

        expect(metrics.workflowId).toBe(workflow.id);
        expect(metrics.totalExecutions).toBeGreaterThanOrEqual(0);
        expect(metrics.successfulExecutions).toBeGreaterThanOrEqual(0);
        expect(metrics.failedExecutions).toBeGreaterThanOrEqual(0);

        console.log(`✅ Workflow metrics for ${workflow.name}:`);
        console.log(`   • Total executions: ${metrics.totalExecutions}`);
        console.log(`   • Success rate: ${((metrics.successfulExecutions / metrics.totalExecutions) * 100).toFixed(1)}%`);
        console.log(`   • Avg execution time: ${metrics.averageExecutionTime}ms`);
      }
    });
  });

  describe('🔄 Pre-built Workflow Templates', () => {
    it('should provide pre-built workflow templates', async () => {
      console.log('\n📋 Testing pre-built workflow templates');
      
      const templates = await workflowService.getWorkflowTemplates();

      expect(Array.isArray(templates)).toBe(true);
      expect(templates.length).toBeGreaterThan(0);

      templates.forEach(template => {
        expect(template).toHaveProperty('id');
        expect(template).toHaveProperty('name');
        expect(template).toHaveProperty('description');
        expect(template).toHaveProperty('category');
        expect(template).toHaveProperty('eventType');
        expect(template).toHaveProperty('conditions');
        expect(template).toHaveProperty('actions');
      });

      console.log(`✅ Found ${templates.length} pre-built workflow templates`);
      templates.forEach(template => {
        console.log(`   • ${template.name} (${template.category})`);
      });
    });

    it('should create workflow from template', async () => {
      console.log('\n🏗️ Testing workflow creation from template');
      
      const templates = await workflowService.getWorkflowTemplates();
      expect(templates.length).toBeGreaterThan(0);

      const template = templates[0];
      const workflowData = {
        name: `${template.name} - Custom Instance`,
        templateId: template.id,
        customizations: {
          // Override some default values
          isActive: true
        }
      };

      const workflow = await workflowService.createWorkflowFromTemplate(workflowData);

      expect(workflow.name).toBe(workflowData.name);
      expect(workflow.eventType).toBe(template.eventType);
      expect(workflow.conditions).toEqual(template.conditions);
      expect(workflow.actions).toEqual(template.actions);
      expect(workflow.isActive).toBe(true);

      console.log('✅ Workflow created from template successfully');
      console.log(`🏗️ Created "${workflow.name}" from template "${template.name}"`);
    });
  });

  describe('🚨 Error Handling and Edge Cases', () => {
    it('should handle non-existent workflow IDs', async () => {
      console.log('\n❌ Testing non-existent workflow handling');
      
      await expect(
        workflowService.updateWorkflow('non-existent-id', { name: 'Updated' })
      ).rejects.toThrow('Workflow not found');

      await expect(
        workflowService.deleteWorkflow('non-existent-id')
      ).rejects.toThrow('Workflow not found');

      console.log('✅ Non-existent workflow IDs handled correctly');
    });

    it('should validate workflow data', async () => {
      console.log('\n🔍 Testing workflow data validation');
      
      // Missing required fields
      await expect(
        workflowService.createWorkflow({
          // Missing name, eventType, actions
          description: 'Invalid workflow'
        } as any)
      ).rejects.toThrow();

      // Invalid event type
      await expect(
        workflowService.createWorkflow({
          name: 'Invalid Event Type',
          eventType: 'invalid_event' as any,
          isActive: true,
          conditions: [],
          actions: []
        })
      ).rejects.toThrow();

      console.log('✅ Workflow data validation working correctly');
    });

    it('should handle concurrent workflow executions', async () => {
      console.log('\n⚡ Testing concurrent workflow execution');
      
      const workflow = await workflowService.createWorkflow({
        name: 'Concurrent Test Workflow',
        eventType: WorkflowEventType.CUSTOMER_CREATED,
        isActive: true,
        conditions: [],
        actions: [
          {
            type: WorkflowActionType.CREATE_NOTIFICATION,
            config: {
              title: 'Concurrent Test',
              message: 'Testing concurrent execution',
              userId: testAdmin.id
            }
          }
        ]
      });

      // Trigger multiple concurrent executions
      const promises = [];
      for (let i = 0; i < 5; i++) {
        promises.push(
          workflowService.triggerWorkflows(
            WorkflowEventType.CUSTOMER_CREATED,
            {
              customer: { id: `test-customer-${i}`, name: `Test Customer ${i}` }
            }
          )
        );
      }

      const results = await Promise.all(promises);
      
      results.forEach(result => {
        expect(result.success).toBe(true);
      });

      console.log('✅ Concurrent workflow executions handled successfully');
    });

    it('should complete operations within reasonable time', async () => {
      console.log('\n⏱️ Testing workflow service performance');
      
      const startTime = Date.now();
      
      await workflowService.createWorkflow({
        name: 'Performance Test Workflow',
        eventType: WorkflowEventType.SYSTEM_MAINTENANCE,
        isActive: true,
        conditions: [],
        actions: [
          {
            type: WorkflowActionType.CREATE_NOTIFICATION,
            config: {
              title: 'Performance Test',
              message: 'Testing workflow performance',
              userId: testAdmin.id
            }
          }
        ]
      });
      
      await workflowService.getWorkflows();
      
      const endTime = Date.now();
      const executionTime = endTime - startTime;
      
      expect(executionTime).toBeLessThan(5000); // Should complete in under 5 seconds

      console.log(`✅ Workflow operations completed in ${executionTime}ms`);
    });
  });
}); 