import { prisma } from '../prisma/prisma';
import { ValidationError } from './errors';

export interface SearchResult {
  id: string;
  type: 'customer' | 'appointment' | 'tattoo_request' | 'payment' | 'user';
  title: string;
  subtitle?: string;
  description?: string;
  data: any;
  relevanceScore: number;
  highlightedFields: string[];
}

export interface SearchResults {
  results: SearchResult[];
  total: number;
  totalByType: Record<string, number>;
  executionTime: number;
  query: string;
}

export interface SearchFilters {
  types?: string[];
  dateFrom?: Date;
  dateTo?: Date;
  status?: string[];
  customerId?: string;
  artistId?: string;
  limit?: number;
  offset?: number;
}

export interface SearchOptions {
  fuzzy?: boolean;
  includeInactive?: boolean;
  sortBy?: 'relevance' | 'date' | 'name';
  sortOrder?: 'asc' | 'desc';
}

/**
 * Search Service for global search across all entities
 * Provides unified search functionality for customers, appointments, requests, etc.
 */
export class SearchService {

  /**
   * Perform global search across all entities
   */
  async globalSearch(
    query: string,
    filters?: SearchFilters,
    options?: SearchOptions
  ): Promise<SearchResults> {
    const startTime = Date.now();
    
    if (!query || query.trim().length < 2) {
      throw new ValidationError('Search query must be at least 2 characters long');
    }

    const searchTerm = query.trim();
    const limit = filters?.limit || 50;
    const offset = filters?.offset || 0;

    // Parallel search across all entity types
    const searchPromises = [
      this.searchCustomers(searchTerm, filters, options),
      this.searchAppointments(searchTerm, filters, options),
      this.searchTattooRequests(searchTerm, filters, options),
      this.searchPayments(searchTerm, filters, options)
    ];

    if (!filters?.types || filters.types.includes('user')) {
      searchPromises.push(this.searchUsers(searchTerm, filters, options));
    }

    const searchResults = await Promise.all(searchPromises);
    
    // Flatten and sort results
    const allResults = searchResults.flat()
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(offset, offset + limit);

    // Calculate totals by type
    const totalByType = searchResults.flat().reduce((acc, result) => {
      acc[result.type] = (acc[result.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const executionTime = Date.now() - startTime;

    return {
      results: allResults,
      total: searchResults.flat().length,
      totalByType,
      executionTime,
      query: searchTerm
    };
  }

  /**
   * Search customers
   */
  async searchCustomers(
    query: string,
    filters?: SearchFilters,
    options?: SearchOptions
  ): Promise<SearchResult[]> {
    if (filters?.types && !filters.types.includes('customer')) {
      return [];
    }

    const whereConditions: any = {
      OR: [
        { name: { contains: query, mode: 'insensitive' } },
        { email: { contains: query, mode: 'insensitive' } },
        { phone: { contains: query, mode: 'insensitive' } },
        { notes: { contains: query, mode: 'insensitive' } }
      ]
    };

    if (filters?.dateFrom || filters?.dateTo) {
      whereConditions.createdAt = {};
      if (filters.dateFrom) whereConditions.createdAt.gte = filters.dateFrom;
      if (filters.dateTo) whereConditions.createdAt.lte = filters.dateTo;
    }

    const customers = await prisma.customer.findMany({
      where: whereConditions,
      include: {
        appointments: {
          take: 3,
          orderBy: { createdAt: 'desc' }
        },
        payments: {
          take: 3,
          orderBy: { createdAt: 'desc' }
        },
        _count: {
          select: {
            appointments: true,
            payments: true,
            tattooRequests: true
          }
        }
      },
      take: 25
    });

    return customers.map(customer => ({
      id: customer.id,
      type: 'customer' as const,
      title: customer.name,
      subtitle: customer.email || customer.phone || 'No contact info',
      description: `${customer._count.appointments} appointments, ${customer._count.payments} payments`,
      data: customer,
      relevanceScore: this.calculateRelevanceScore(query, [
        customer.name,
        customer.email || '',
        customer.phone || '',
        customer.notes || ''
      ]),
      highlightedFields: this.getHighlightedFields(query, {
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
        notes: customer.notes
      })
    }));
  }

  /**
   * Search appointments
   */
  async searchAppointments(
    query: string,
    filters?: SearchFilters,
    options?: SearchOptions
  ): Promise<SearchResult[]> {
    if (filters?.types && !filters.types.includes('appointment')) {
      return [];
    }

    const whereConditions: any = {
      OR: [
        { notes: { contains: query, mode: 'insensitive' } },
        { contactEmail: { contains: query, mode: 'insensitive' } },
        { contactPhone: { contains: query, mode: 'insensitive' } },
        { customer: { name: { contains: query, mode: 'insensitive' } } },
        { customer: { email: { contains: query, mode: 'insensitive' } } }
      ]
    };

    if (filters?.status) {
      whereConditions.status = { in: filters.status };
    }

    if (filters?.customerId) {
      whereConditions.customerId = filters.customerId;
    }

    if (filters?.artistId) {
      whereConditions.artistId = filters.artistId;
    }

    if (filters?.dateFrom || filters?.dateTo) {
      whereConditions.startTime = {};
      if (filters.dateFrom) whereConditions.startTime.gte = filters.dateFrom;
      if (filters.dateTo) whereConditions.startTime.lte = filters.dateTo;
    }

    const appointments = await prisma.appointment.findMany({
      where: whereConditions,
      include: {
        customer: true,
        artist: {
          select: { id: true, email: true }
        },
        tattooRequest: true
      },
      take: 25,
      orderBy: { startTime: 'desc' }
    });

    return appointments.map(appointment => {
      const customerName = appointment.customer?.name || 'Anonymous';
      const startTime = appointment.startTime?.toLocaleDateString() || 'No date';
      
      return {
        id: appointment.id,
        type: 'appointment' as const,
        title: `${appointment.type || 'Appointment'} - ${customerName}`,
        subtitle: `${startTime} | ${appointment.status}`,
        description: appointment.notes || `${appointment.duration || 0} minutes`,
        data: appointment,
        relevanceScore: this.calculateRelevanceScore(query, [
          customerName,
          appointment.notes || '',
          appointment.contactEmail || '',
          appointment.contactPhone || '',
          appointment.type || ''
        ]),
        highlightedFields: this.getHighlightedFields(query, {
          customerName,
          notes: appointment.notes,
          contactEmail: appointment.contactEmail,
          contactPhone: appointment.contactPhone,
          type: appointment.type
        })
      };
    });
  }

  /**
   * Search tattoo requests
   */
  async searchTattooRequests(
    query: string,
    filters?: SearchFilters,
    options?: SearchOptions
  ): Promise<SearchResult[]> {
    if (filters?.types && !filters.types.includes('tattoo_request')) {
      return [];
    }

    const whereConditions: any = {
      OR: [
        { description: { contains: query, mode: 'insensitive' } },
        { placement: { contains: query, mode: 'insensitive' } },
        { style: { contains: query, mode: 'insensitive' } },
        { additionalNotes: { contains: query, mode: 'insensitive' } },
        { contactEmail: { contains: query, mode: 'insensitive' } },
        { contactPhone: { contains: query, mode: 'insensitive' } },
        { customer: { name: { contains: query, mode: 'insensitive' } } }
      ]
    };

    if (filters?.status) {
      whereConditions.status = { in: filters.status };
    }

    if (filters?.customerId) {
      whereConditions.customerId = filters.customerId;
    }

    if (filters?.dateFrom || filters?.dateTo) {
      whereConditions.createdAt = {};
      if (filters.dateFrom) whereConditions.createdAt.gte = filters.dateFrom;
      if (filters.dateTo) whereConditions.createdAt.lte = filters.dateTo;
    }

    const requests = await prisma.tattooRequest.findMany({
      where: whereConditions,
      include: {
        customer: true,
        images: true
      },
      take: 25,
      orderBy: { createdAt: 'desc' }
    });

    return requests.map(request => {
      const customerName = request.customer?.name || 'Anonymous';
      const createdDate = request.createdAt.toLocaleDateString();
      
      return {
        id: request.id,
        type: 'tattoo_request' as const,
        title: `${request.placement || 'Tattoo'} Request - ${customerName}`,
        subtitle: `${createdDate} | ${request.status}`,
        description: request.description.substring(0, 100) + (request.description.length > 100 ? '...' : ''),
        data: request,
        relevanceScore: this.calculateRelevanceScore(query, [
          request.description,
          request.placement || '',
          request.style || '',
          request.additionalNotes || '',
          customerName
        ]),
        highlightedFields: this.getHighlightedFields(query, {
          description: request.description,
          placement: request.placement,
          style: request.style,
          additionalNotes: request.additionalNotes,
          customerName
        })
      };
    });
  }

  /**
   * Search payments
   */
  async searchPayments(
    query: string,
    filters?: SearchFilters,
    options?: SearchOptions
  ): Promise<SearchResult[]> {
    if (filters?.types && !filters.types.includes('payment')) {
      return [];
    }

    const whereConditions: any = {
      OR: [
        { customer: { name: { contains: query, mode: 'insensitive' } } },
        { customer: { email: { contains: query, mode: 'insensitive' } } },
        { referenceId: { contains: query, mode: 'insensitive' } }
      ]
    };

    if (filters?.status) {
      whereConditions.status = { in: filters.status };
    }

    if (filters?.customerId) {
      whereConditions.customerId = filters.customerId;
    }

    if (filters?.dateFrom || filters?.dateTo) {
      whereConditions.createdAt = {};
      if (filters.dateFrom) whereConditions.createdAt.gte = filters.dateFrom;
      if (filters.dateTo) whereConditions.createdAt.lte = filters.dateTo;
    }

    // Handle amount search (if query is a number)
    const amountQuery = parseFloat(query);
    if (!isNaN(amountQuery)) {
      whereConditions.OR.push({ amount: amountQuery });
    }

    const payments = await prisma.payment.findMany({
      where: whereConditions,
      include: {
        customer: true
      },
      take: 25,
      orderBy: { createdAt: 'desc' }
    });

    return payments.map(payment => {
      const customerName = payment.customer?.name || 'Unknown Customer';
      const paymentDate = payment.createdAt.toLocaleDateString();
      
      return {
        id: payment.id,
        type: 'payment' as const,
        title: `$${payment.amount} Payment - ${customerName}`,
        subtitle: `${paymentDate} | ${payment.status}`,
        description: `${payment.paymentType || 'Payment'} | ${payment.paymentMethod || 'Unknown method'}`,
        data: payment,
        relevanceScore: this.calculateRelevanceScore(query, [
          customerName,
          payment.amount.toString(),
          payment.referenceId || '',
          payment.paymentType || '',
          payment.paymentMethod || ''
        ]),
        highlightedFields: this.getHighlightedFields(query, {
          customerName,
          amount: payment.amount.toString(),
          referenceId: payment.referenceId,
          paymentType: payment.paymentType,
          paymentMethod: payment.paymentMethod
        })
      };
    });
  }

  /**
   * Search users (artists/staff)
   */
  async searchUsers(
    query: string,
    filters?: SearchFilters,
    options?: SearchOptions
  ): Promise<SearchResult[]> {
    if (filters?.types && !filters.types.includes('user')) {
      return [];
    }

    const whereConditions: any = {
      OR: [
        { email: { contains: query, mode: 'insensitive' } },
        { role: { contains: query, mode: 'insensitive' } }
      ]
    };

    const users = await prisma.user.findMany({
      where: whereConditions,
      include: {
        _count: {
          select: { appointments: true }
        }
      },
      take: 10
    });

    return users.map(user => ({
      id: user.id,
      type: 'user' as const,
      title: user.email,
      subtitle: user.role,
      description: `${user._count.appointments} appointments`,
      data: user,
      relevanceScore: this.calculateRelevanceScore(query, [
        user.email,
        user.role
      ]),
      highlightedFields: this.getHighlightedFields(query, {
        email: user.email,
        role: user.role
      })
    }));
  }

  /**
   * Quick search for specific entity types
   */
  async quickSearch(
    query: string,
    entityType: 'customer' | 'appointment' | 'tattoo_request' | 'payment',
    limit: number = 10
  ): Promise<SearchResult[]> {
    const filters: SearchFilters = {
      types: [entityType],
      limit
    };

    const options: SearchOptions = {
      sortBy: 'relevance'
    };

    switch (entityType) {
      case 'customer':
        return this.searchCustomers(query, filters, options);
      case 'appointment':
        return this.searchAppointments(query, filters, options);
      case 'tattoo_request':
        return this.searchTattooRequests(query, filters, options);
      case 'payment':
        return this.searchPayments(query, filters, options);
      default:
        return [];
    }
  }

  /**
   * Search suggestions for autocomplete
   */
  async getSearchSuggestions(query: string, limit: number = 5): Promise<string[]> {
    if (query.length < 2) return [];

    const suggestions = new Set<string>();

    // Get customer names
    const customers = await prisma.customer.findMany({
      where: {
        name: { contains: query, mode: 'insensitive' }
      },
      select: { name: true },
      take: limit
    });

    customers.forEach(c => suggestions.add(c.name));

    // Get common search terms from recent searches (if we were tracking them)
    // For now, we'll return customer names as the primary suggestion source

    return Array.from(suggestions).slice(0, limit);
  }

  /**
   * Calculate relevance score for search results
   */
  private calculateRelevanceScore(query: string, fields: string[]): number {
    const queryLower = query.toLowerCase();
    let score = 0;

    fields.forEach((field, index) => {
      if (!field) return;
      
      const fieldLower = field.toLowerCase();
      
      // Exact match gets highest score
      if (fieldLower === queryLower) {
        score += 100;
      }
      // Starts with query gets high score
      else if (fieldLower.startsWith(queryLower)) {
        score += 80;
      }
      // Contains query gets medium score
      else if (fieldLower.includes(queryLower)) {
        score += 50;
      }
      // Partial word match gets lower score
      else {
        const words = fieldLower.split(' ');
        for (const word of words) {
          if (word.includes(queryLower)) {
            score += 20;
            break;
          }
        }
      }
      
      // First fields are more important
      const fieldWeight = Math.max(0.5, 1 - (index * 0.1));
      score *= fieldWeight;
    });

    return Math.round(score);
  }

  /**
   * Get highlighted fields for search results
   */
  private getHighlightedFields(query: string, fields: Record<string, string | null | undefined>): string[] {
    const queryLower = query.toLowerCase();
    const highlighted: string[] = [];

    Object.entries(fields).forEach(([fieldName, value]) => {
      if (value && value.toLowerCase().includes(queryLower)) {
        highlighted.push(fieldName);
      }
    });

    return highlighted;
  }

  /**
   * Advanced search with complex filters
   */
  async advancedSearch(
    query: string,
    filters: {
      entityTypes?: string[];
      dateRange?: { start: Date; end: Date };
      statusFilter?: string[];
      amountRange?: { min: number; max: number };
      tags?: string[];
    }
  ): Promise<SearchResults> {
    const searchFilters: SearchFilters = {
      types: filters.entityTypes,
      dateFrom: filters.dateRange?.start,
      dateTo: filters.dateRange?.end,
      status: filters.statusFilter
    };

    return this.globalSearch(query, searchFilters);
  }

  /**
   * Get search analytics
   */
  async getSearchAnalytics(period: 'day' | 'week' | 'month' = 'week'): Promise<{
    totalSearches: number;
    popularQueries: Array<{ query: string; count: number }>;
    searchesByType: Record<string, number>;
    averageResultCount: number;
  }> {
    // This would require implementing search logging
    // For now, return mock data that could be implemented later
    return {
      totalSearches: 0,
      popularQueries: [],
      searchesByType: {},
      averageResultCount: 0
    };
  }
} 