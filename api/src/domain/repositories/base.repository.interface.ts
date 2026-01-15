/**
 * Base Repository Interface
 * 
 * Defines the contract that all data access repositories must implement.
 * This abstraction layer decouples business logic from Mongoose/database concerns.
 * 
 * Features:
 * - Standard CRUD operations
 * - Automatic tenant scoping
 * - Query builders for complex operations
 * - Transaction support
 * - Consistent error handling
 */

export interface IBaseRepository<T> {
  /**
   * Find a single document by ID, scoped to the current tenant
   * 
   * @param id Document ID
   * @param tenantId Tenant ID for multi-tenancy scoping
   * @returns Document or null if not found
   */
  findById(id: string, tenantId: string): Promise<T | null>;

  /**
   * Find a single document by custom criteria, scoped to tenant
   * 
   * @param criteria Query criteria
   * @param tenantId Tenant ID for multi-tenancy scoping
   * @returns First matching document or null
   */
  findOne(criteria: Partial<T>, tenantId: string): Promise<T | null>;

  /**
   * Find all documents matching criteria, scoped to tenant
   * 
   * @param criteria Query criteria (partial object matching)
   * @param tenantId Tenant ID for multi-tenancy scoping
   * @param options Query options (skip, limit, sort)
   * @returns Array of documents
   */
  find(
    criteria: Partial<T>,
    tenantId: string,
    options?: {
      skip?: number;
      limit?: number;
      sort?: Record<string, 1 | -1>;
    }
  ): Promise<T[]>;

  /**
   * Create a new document
   * 
   * @param data Document data (will be validated by DTO)
   * @param tenantId Tenant ID for multi-tenancy scoping
   * @returns Created document
   */
  create(data: Partial<T>, tenantId: string): Promise<T>;

  /**
   * Create multiple documents in bulk
   * 
   * @param data Array of document data
   * @param tenantId Tenant ID for multi-tenancy scoping
   * @returns Array of created documents
   */
  createMany(data: Partial<T>[], tenantId: string): Promise<T[]>;

  /**
   * Update a document by ID
   * 
   * @param id Document ID
   * @param updates Partial document with updates
   * @param tenantId Tenant ID for multi-tenancy scoping
   * @returns Updated document or null if not found
   */
  updateById(id: string, updates: Partial<T>, tenantId: string): Promise<T | null>;

  /**
   * Update multiple documents matching criteria
   * 
   * @param criteria Query criteria
   * @param updates Partial document with updates
   * @param tenantId Tenant ID for multi-tenancy scoping
   * @returns Number of documents updated
   */
  updateMany(
    criteria: Partial<T>,
    updates: Partial<T>,
    tenantId: string
  ): Promise<number>;

  /**
   * Delete a document by ID
   * 
   * @param id Document ID
   * @param tenantId Tenant ID for multi-tenancy scoping
   * @returns True if deleted, false if not found
   */
  deleteById(id: string, tenantId: string): Promise<boolean>;

  /**
   * Delete multiple documents matching criteria
   * 
   * @param criteria Query criteria
   * @param tenantId Tenant ID for multi-tenancy scoping
   * @returns Number of documents deleted
   */
  deleteMany(criteria: Partial<T>, tenantId: string): Promise<number>;

  /**
   * Count documents matching criteria, scoped to tenant
   * 
   * @param criteria Query criteria
   * @param tenantId Tenant ID for multi-tenancy scoping
   * @returns Number of matching documents
   */
  count(criteria: Partial<T>, tenantId: string): Promise<number>;

  /**
   * Check if a document exists
   * 
   * @param criteria Query criteria
   * @param tenantId Tenant ID for multi-tenancy scoping
   * @returns True if document exists, false otherwise
   */
  exists(criteria: Partial<T>, tenantId: string): Promise<boolean>;

  /**
   * Execute a raw query (for complex operations)
   * 
   * @param query Raw database query
   * @param tenantId Tenant ID for multi-tenancy scoping
   * @returns Raw query results
   */
  executeRaw(query: any, tenantId: string): Promise<any>;
}

/**
 * Repository factory function signature
 * 
 * Allows repositories to be instantiated with model instances
 * Example: CampaignRepository(campaignModel)
 */
export type RepositoryFactory<T> = (model: any) => IBaseRepository<T>;
