// Knowledge Base API Service
import { kbClient } from './kbClient'
import type {
  KnowledgeBase,
  CreateKnowledgeBaseRequest,
  UpdateKnowledgeBaseRequest,
} from '../types'

/**
 * Knowledge Base API endpoints
 * Based on typical REST API structure from OpenAPI specs
 */
export const knowledgeBasesService = {
  /**
   * Get all knowledge bases
   * GET /knowledge-bases
   */
  async getAll(): Promise<KnowledgeBase[]> {
    return kbClient.request<KnowledgeBase[]>('/knowledge-bases', {
      method: 'GET',
    })
  },

  /**
   * Get a single knowledge base by ID
   * GET /knowledge-bases/:id
   */
  async getById(id: string): Promise<KnowledgeBase> {
    return kbClient.request<KnowledgeBase>(`/knowledge-bases/${id}`, {
      method: 'GET',
    })
  },

  /**
   * Create a new knowledge base
   * POST /knowledge-bases
   */
  async create(data: CreateKnowledgeBaseRequest): Promise<KnowledgeBase> {
    return kbClient.request<KnowledgeBase>('/knowledge-bases', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  /**
   * Update an existing knowledge base
   * PUT /knowledge-bases/:id or PATCH /knowledge-bases/:id
   */
  async update(id: string, data: UpdateKnowledgeBaseRequest): Promise<KnowledgeBase> {
    return kbClient.request<KnowledgeBase>(`/knowledge-bases/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    })
  },

  /**
   * Delete a knowledge base
   * DELETE /knowledge-bases/:id
   */
  async delete(id: string): Promise<void> {
    return kbClient.request<void>(`/knowledge-bases/${id}`, {
      method: 'DELETE',
    })
  },
}
