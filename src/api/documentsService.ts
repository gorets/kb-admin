// Documents API Service
import { kbClient } from './kbClient'
import type {
  Document,
  CreateDocumentRequest,
  UpdateDocumentRequest,
} from '../types'

/**
 * Documents API endpoints
 */
export const documentsService = {
  /**
   * Get all documents, optionally filtered
   * GET /documents?dataSourceId=...&knowledgeBaseId=...
   */
  async getAll(dataSourceId?: string, knowledgeBaseId?: string): Promise<Document[]> {
    const params = new URLSearchParams()

    if (dataSourceId) {
      params.append('dataSourceId', dataSourceId)
    }
    if (knowledgeBaseId) {
      params.append('knowledgeBaseId', knowledgeBaseId)
    }

    const queryString = params.toString()
    const endpoint = queryString ? `/documents?${queryString}` : '/documents'

    return kbClient.request<Document[]>(endpoint, {
      method: 'GET',
    })
  },

  /**
   * Get a single document by ID
   * GET /documents/:id
   */
  async getById(id: string): Promise<Document> {
    return kbClient.request<Document>(`/documents/${id}`, {
      method: 'GET',
    })
  },

  /**
   * Create a new document
   * POST /documents
   */
  async create(data: CreateDocumentRequest): Promise<Document> {
    return kbClient.request<Document>('/documents', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  /**
   * Update an existing document
   * PATCH /documents/:id
   */
  async update(id: string, data: UpdateDocumentRequest): Promise<Document> {
    return kbClient.request<Document>(`/documents/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    })
  },

  /**
   * Delete a document
   * DELETE /documents/:id
   */
  async delete(id: string): Promise<void> {
    return kbClient.request<void>(`/documents/${id}`, {
      method: 'DELETE',
    })
  },

  /**
   * Get documents by data source ID
   * GET /data-sources/:dsId/documents
   */
  async getByDataSource(dataSourceId: string): Promise<Document[]> {
    return kbClient.request<Document[]>(
      `/data-sources/${dataSourceId}/documents`,
      { method: 'GET' }
    )
  },

  /**
   * Get documents by knowledge base ID
   * GET /knowledge-bases/:kbId/documents
   */
  async getByKnowledgeBase(knowledgeBaseId: string): Promise<Document[]> {
    return kbClient.request<Document[]>(
      `/knowledge-bases/${knowledgeBaseId}/documents`,
      { method: 'GET' }
    )
  },
}
