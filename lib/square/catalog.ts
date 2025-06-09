import { Square } from "square";
import { BaseSquareClient } from './base-client';
import type { 
  SquareCatalogResponse, 
  SquareListResponse 
} from './types';

export class CatalogService extends BaseSquareClient {

  // Catalog methods - useful for services, items, etc.
  async getCatalog(types?: string[]): Promise<{ objects: Square.CatalogObject[] }> {
    const response = await this.client.catalog.list({
      types: types?.join(',')
    });
    return { objects: response.data || [] };
  }

  // Get tattoo shop services from catalog
  async getTattooServices(): Promise<SquareCatalogResponse> {
    // Get catalog items filtered to service type
    const response = await this.client.catalog.list({
      types: "ITEM"
    }) as SquareListResponse<Square.CatalogObject>;
    
    return {
      result: {
        objects: response.data || []
      },
      cursor: response.cursor,
      errors: []
    };
  }
} 