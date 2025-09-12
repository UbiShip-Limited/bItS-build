import { FastifyPluginAsync } from 'fastify';
import { prisma } from '../prisma/prisma';

const diagnosticsRoutes: FastifyPluginAsync = async (fastify) => {
  // GET /diagnostics/tattoo-request/:id - Debug endpoint for tattoo request issues
  fastify.get('/tattoo-request/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    
    const diagnostics: any = {
      requestId: id,
      timestamp: new Date().toISOString(),
      checks: []
    };
    
    try {
      // Check 1: Basic database query
      diagnostics.checks.push({ 
        name: 'Database Query',
        status: 'checking'
      });
      
      const basicQuery = await prisma.tattooRequest.findUnique({
        where: { id }
      });
      
      if (!basicQuery) {
        diagnostics.checks[0].status = 'failed';
        diagnostics.checks[0].error = 'Request not found';
        return reply.status(404).send(diagnostics);
      }
      
      diagnostics.checks[0].status = 'success';
      diagnostics.checks[0].data = {
        found: true,
        status: basicQuery.status,
        hasCustomerId: !!basicQuery.customerId,
        createdAt: basicQuery.createdAt
      };
      
      // Check 2: Images relation
      diagnostics.checks.push({
        name: 'Images Relation',
        status: 'checking'
      });
      
      try {
        const withImages = await prisma.tattooRequest.findUnique({
          where: { id },
          include: { images: true }
        });
        
        diagnostics.checks[1].status = 'success';
        diagnostics.checks[1].data = {
          imageCount: withImages?.images.length || 0,
          firstImageUrl: withImages?.images[0]?.url || null
        };
      } catch (imgError: any) {
        diagnostics.checks[1].status = 'failed';
        diagnostics.checks[1].error = imgError.message;
      }
      
      // Check 3: ReferenceImages JSON field
      diagnostics.checks.push({
        name: 'ReferenceImages JSON',
        status: 'checking'
      });
      
      try {
        const refImages = basicQuery.referenceImages;
        diagnostics.checks[2].status = 'success';
        diagnostics.checks[2].data = {
          type: typeof refImages,
          isArray: Array.isArray(refImages),
          count: Array.isArray(refImages) ? refImages.length : 0
        };
      } catch (refError: any) {
        diagnostics.checks[2].status = 'failed';
        diagnostics.checks[2].error = refError.message;
      }
      
      // Check 4: Customer relation
      diagnostics.checks.push({
        name: 'Customer Relation',
        status: 'checking'
      });
      
      try {
        const withCustomer = await prisma.tattooRequest.findUnique({
          where: { id },
          include: { customer: true }
        });
        
        diagnostics.checks[3].status = 'success';
        diagnostics.checks[3].data = {
          hasCustomer: !!withCustomer?.customer,
          customerName: withCustomer?.customer?.name || null
        };
      } catch (custError: any) {
        diagnostics.checks[3].status = 'failed';
        diagnostics.checks[3].error = custError.message;
      }
      
      // Check 5: Full include (what might be failing)
      diagnostics.checks.push({
        name: 'Full Include Query',
        status: 'checking'
      });
      
      try {
        const fullQuery = await prisma.tattooRequest.findUnique({
          where: { id },
          include: {
            customer: true,
            images: true,
            appointments: true,
            payment: true
          }
        });
        
        diagnostics.checks[4].status = 'success';
        diagnostics.checks[4].data = {
          success: true,
          hasAllRelations: true
        };
      } catch (fullError: any) {
        diagnostics.checks[4].status = 'failed';
        diagnostics.checks[4].error = fullError.message;
        diagnostics.checks[4].stack = fullError.stack;
      }
      
      diagnostics.summary = {
        allChecksPassed: diagnostics.checks.every((c: any) => c.status === 'success'),
        failedChecks: diagnostics.checks.filter((c: any) => c.status === 'failed').map((c: any) => c.name)
      };
      
      return diagnostics;
      
    } catch (error: any) {
      diagnostics.error = {
        message: error.message,
        stack: error.stack
      };
      return reply.status(500).send(diagnostics);
    }
  });
  
  // GET /diagnostics/deployment - Check deployment info
  fastify.get('/deployment', async (request, reply) => {
    return {
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      railway: {
        environment: process.env.RAILWAY_ENVIRONMENT,
        deploymentId: process.env.RAILWAY_DEPLOYMENT_ID,
        serviceName: process.env.RAILWAY_SERVICE_NAME,
        gitBranch: process.env.RAILWAY_GIT_BRANCH,
        gitCommitSha: process.env.RAILWAY_GIT_COMMIT_SHA
      },
      buildInfo: {
        // This will help us verify which version is deployed
        lastModified: '2025-09-11T23:45:00Z', // Update this timestamp
        hasEnhancedLogging: true,
        hasImagesFix: true
      }
    };
  });
};

export default diagnosticsRoutes;