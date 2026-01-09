// frontend/lib/asset-url-manager.ts
/**
 * Asset URL Manager
 * Handles automatic refresh of asset URLs to ensure permanent access
 */

export interface AssetUrlStatus {
  url: string;
  isPermanent: boolean;
  lastRefreshed?: Date;
  expiresAt?: Date;
  needsRefresh: boolean;
}

class AssetUrlManager {
  private static readonly API_BASE = process.env.NEXT_PUBLIC_API_URL || '/api';
  private static readonly REFRESH_THRESHOLD_MS = 24 * 60 * 60 * 1000; // 1 day before expiration

  /**
   * Check if a URL needs refresh
   */
  static async checkUrlStatus(url: string): Promise<AssetUrlStatus> {
    try {
      const response = await fetch(
        `${this.API_BASE}/storage/assets/status?url=${encodeURIComponent(url)}`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${this.getToken()}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to check URL status: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error checking asset URL status:', error);
      throw error;
    }
  }

  /**
   * Refresh a single asset URL
   */
  static async refreshAssetUrl(url: string): Promise<string> {
    try {
      const response = await fetch(
        `${this.API_BASE}/storage/assets/refresh-url?url=${encodeURIComponent(url)}`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.getToken()}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to refresh URL: ${response.statusText}`);
      }

      const data = await response.json();
      return data.url;
    } catch (error) {
      console.error('Error refreshing asset URL:', error);
      throw error;
    }
  }

  /**
   * Batch refresh all expiring URLs for current user
   */
  static async batchRefreshUrls(olderThanDays: number = 6): Promise<number> {
    try {
      const response = await fetch(
        `${this.API_BASE}/storage/assets/refresh-batch?olderThanDays=${olderThanDays}`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.getToken()}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to batch refresh URLs: ${response.statusText}`);
      }

      const data = await response.json();
      return data.refreshedCount;
    } catch (error) {
      console.error('Error batch refreshing asset URLs:', error);
      throw error;
    }
  }

  /**
   * Migrate all assets to permanent URLs (requires public bucket)
   */
  static async migrateToPermanentUrls(): Promise<{ migratedCount: number; skippedCount: number }> {
    try {
      const response = await fetch(
        `${this.API_BASE}/storage/assets/migrate-to-permanent`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.getToken()}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to migrate to permanent URLs: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error migrating to permanent URLs:', error);
      throw error;
    }
  }

  /**
   * Get an asset URL with automatic refresh if needed
   * Returns either the current URL or a refreshed one if expired
   */
  static async getAssetUrl(url: string): Promise<string> {
    try {
      const status = await this.checkUrlStatus(url);
      
      // If permanent or doesn't need refresh, return as-is
      if (status.isPermanent || !status.needsRefresh) {
        return status.url;
      }

      // If refresh needed, get a new URL
      return await this.refreshAssetUrl(url);
    } catch (error) {
      console.warn('Failed to check/refresh URL, returning original:', error);
      return url;
    }
  }

  /**
   * Setup automatic refresh interval for all assets
   * Useful for long-running pages
   */
  static startAutoRefresh(intervalHours: number = 6): ReturnType<typeof setInterval> {
    return setInterval(async () => {
      try {
        const refreshedCount = await this.batchRefreshUrls(6);
        console.log(`Auto-refreshed ${refreshedCount} asset URLs`);
      } catch (error) {
        console.error('Error in auto-refresh interval:', error);
      }
    }, intervalHours * 60 * 60 * 1000);
  }

  /**
   * Stop automatic refresh interval
   */
  static stopAutoRefresh(timerId: ReturnType<typeof setInterval>): void {
    clearInterval(timerId);
  }

  /**
   * Helper: Get JWT token from localStorage
   */
  private static getToken(): string {
    if (typeof window === 'undefined') return '';
    return localStorage.getItem('auth_token') || '';
  }
}

export default AssetUrlManager;
