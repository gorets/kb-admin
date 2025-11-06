// Data Sources API Service
import { kbClient } from './kbClient'
import type {
  DataSource,
  CreateDataSourceRequest,
  UpdateDataSourceRequest,
} from '../types'

/**
 * Data Sources API endpoints
 */
export const dataSourcesService = {
  /**
   * Get all data sources, optionally filtered by knowledge base
   * GET /data-sources?knowledgeBaseId=...
   */
  async getAll(knowledgeBaseId?: string): Promise<DataSource[]> {
    const queryParams = knowledgeBaseId
      ? `?knowledgeBaseId=${encodeURIComponent(knowledgeBaseId)}`
      : ''

    return kbClient.request<DataSource[]>(`/data-sources${queryParams}`, {
      method: 'GET',
    })
  },

  /**
   * Get a single data source by ID
   * GET /data-sources/:id
   */
  async getById(id: string): Promise<DataSource> {
    return kbClient.request<DataSource>(`/data-sources/${id}`, {
      method: 'GET',
    })
  },

  /**
   * Create a new data source
   * POST /data-sources
   */
  async create(data: CreateDataSourceRequest): Promise<DataSource> {
    return kbClient.request<DataSource>('/data-sources', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  /**
   * Update an existing data source
   * PATCH /data-sources/:id
   */
  async update(id: string, data: UpdateDataSourceRequest): Promise<DataSource> {
    return kbClient.request<DataSource>(`/data-sources/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    })
  },

  /**
   * Delete a data source
   * DELETE /data-sources/:id
   */
  async delete(id: string): Promise<void> {
    return kbClient.request<void>(`/data-sources/${id}`, {
      method: 'DELETE',
    })
  },

  /**
   * Get data sources by knowledge base ID
   * GET /knowledge-bases/:kbId/data-sources
   */
  async getByKnowledgeBase(knowledgeBaseId: string): Promise<DataSource[]> {
    return kbClient.request<DataSource[]>(
      `/knowledge-bases/${knowledgeBaseId}/data-sources`,
      { method: 'GET' }
    )
  },
}
