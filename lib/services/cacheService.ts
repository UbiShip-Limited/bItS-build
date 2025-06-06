interface CacheConfig {
  ttl: number; // Time to live in seconds
  maxSize: number; // Maximum cache size
}

interface CacheItem<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

/**
 * Simple in-memory cache service to reduce database queries
 * Keeps costs low by avoiding external cache services like Redis
 */
export class CacheService {
  private cache: Map<string, CacheItem<any>> = new Map();
  private readonly defaultTTL = 300; // 5 minutes
  private readonly maxCacheSize = 1000; // Limit memory usage
  
  /**
   * Get cached data
   */
  get<T>(key: string): T | null {
    const item = this.cache.get(key);
    
    if (!item) {
      return null;
    }
    
    // Check if expired
    if (Date.now() - item.timestamp > item.ttl * 1000) {
      this.cache.delete(key);
      return null;
    }
    
    return item.data;
  }
  
  /**
   * Set cached data
   */
  set<T>(key: string, data: T, ttl?: number): void {
    // Cleanup old entries if cache is getting too large
    if (this.cache.size >= this.maxCacheSize) {
      this.cleanup();
    }
    
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttl || this.defaultTTL
    });
  }
  
  /**
   * Delete cached item
   */
  delete(key: string): void {
    this.cache.delete(key);
  }
  
  /**
   * Clear all cache
   */
  clear(): void {
    this.cache.clear();
  }
  
  /**
   * Get or set pattern - fetch from database if not cached
   */
  async getOrSet<T>(
    key: string, 
    fetcher: () => Promise<T>, 
    ttl?: number
  ): Promise<T> {
    const cached = this.get<T>(key);
    
    if (cached !== null) {
      return cached;
    }
    
    const data = await fetcher();
    this.set(key, data, ttl);
    return data;
  }
  
  /**
   * Cleanup expired entries
   */
  private cleanup(): void {
    const now = Date.now();
    
    for (const [key, item] of this.cache.entries()) {
      if (now - item.timestamp > item.ttl * 1000) {
        this.cache.delete(key);
      }
    }
    
    // If still too large, remove oldest entries
    if (this.cache.size >= this.maxCacheSize) {
      const sortedEntries = Array.from(this.cache.entries())
        .sort((a, b) => a[1].timestamp - b[1].timestamp);
      
      const entriesToRemove = sortedEntries.slice(0, Math.floor(this.maxCacheSize * 0.2));
      
      for (const [key] of entriesToRemove) {
        this.cache.delete(key);
      }
    }
  }
  
  /**
   * Get cache statistics
   */
  getStats(): {
    size: number;
    hitRate: number;
    memoryUsage: string;
  } {
    return {
      size: this.cache.size,
      hitRate: 0, // Would need to track hits/misses
      memoryUsage: `${(this.cache.size * 100 / this.maxCacheSize).toFixed(1)}%`
    };
  }
}

// Singleton instance
export const cacheService = new CacheService(); 