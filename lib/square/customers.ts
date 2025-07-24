import { Square } from "square";
import { BaseSquareClient } from './base-client';
import type { 
  SquareCustomerResponse, 
  SquareListResponse 
} from './types';

export class CustomersService extends BaseSquareClient {

  async getCustomers(
    cursor?: string,
    limit?: number,
    sortField?: string,
    sortOrder?: string
  ): Promise<SquareCustomerResponse> {
    const response = await this.client.customers.list({
      cursor,
      limit,
      sortField: sortField as Square.CustomerSortField,
      sortOrder: sortOrder as Square.SortOrder
    }) as SquareListResponse<Square.Customer>;
    
    return {
      result: {
        customers: response.data || []
      },
      cursor: response.cursor,
      errors: []
    };
  }

  // Get a customer by ID
  async getCustomerById(customerId: string): Promise<SquareCustomerResponse> {
    return this.client.customers.get({
      customerId
    });
  }

  // Create a customer method
  async createCustomer(params: {
    givenName?: string;
    familyName?: string;
    emailAddress?: string;
    phoneNumber?: string;
    idempotencyKey: string;
  }): Promise<SquareCustomerResponse> {
    return this.client.customers.create({
      givenName: params.givenName,
      familyName: params.familyName,
      emailAddress: params.emailAddress,
      phoneNumber: params.phoneNumber,
      idempotencyKey: params.idempotencyKey
    });
  }
} 