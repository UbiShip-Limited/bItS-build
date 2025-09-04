import { FastifyRequest, FastifyReply } from 'fastify';

/**
 * SSE Connection Manager to prevent connection pool exhaustion
 */
class SSEConnectionManager {
  private connections: Map<string, Set<FastifyReply>> = new Map();
  private maxConnectionsPerUser = 3; // Limit connections per user

  addConnection(userId: string, reply: FastifyReply) {
    if (!this.connections.has(userId)) {
      this.connections.set(userId, new Set());
    }

    const userConnections = this.connections.get(userId)!;
    
    // If user has too many connections, close oldest ones
    if (userConnections.size >= this.maxConnectionsPerUser) {
      const connectionsArray = Array.from(userConnections);
      const oldestConnection = connectionsArray[0];
      this.removeConnection(userId, oldestConnection);
      oldestConnection.raw.end();
    }

    userConnections.add(reply);

    // Clean up on connection close
    reply.raw.on('close', () => {
      this.removeConnection(userId, reply);
    });
  }

  removeConnection(userId: string, reply: FastifyReply) {
    const userConnections = this.connections.get(userId);
    if (userConnections) {
      userConnections.delete(reply);
      if (userConnections.size === 0) {
        this.connections.delete(userId);
      }
    }
  }

  getConnectionCount(userId?: string): number {
    if (userId) {
      return this.connections.get(userId)?.size || 0;
    }
    
    let total = 0;
    for (const connections of this.connections.values()) {
      total += connections.size;
    }
    return total;
  }

  closeAllConnections(userId: string) {
    const userConnections = this.connections.get(userId);
    if (userConnections) {
      for (const connection of userConnections) {
        connection.raw.end();
      }
      this.connections.delete(userId);
    }
  }

  getTotalConnections(): number {
    return Array.from(this.connections.values())
      .reduce((total, connections) => total + connections.size, 0);
  }
}

export const sseConnectionManager = new SSEConnectionManager();

export const sseMiddleware = (request: FastifyRequest<{ Querystring: { userId?: string } }>, reply: FastifyReply) => {
  const userId = request.query?.userId || 'anonymous';
  
  // Add timeout for SSE connections
  const timeout = setTimeout(() => {
    if (!reply.sent) {
      reply.raw.end();
    }
  }, 300000); // 5 minutes timeout

  reply.raw.on('close', () => {
    clearTimeout(timeout);
  });

  sseConnectionManager.addConnection(userId, reply);
  
  request.log.info(`SSE connection added for user ${userId}. Total connections: ${sseConnectionManager.getTotalConnections()}`);
};