// Types based on @wildix/wim-knowledge-base-client

export interface KnowledgeBase {
  id: string
  name: string
  description?: string
  createdAt?: string
  updatedAt?: string
}

export interface DataSource {
  id: string
  knowledgeBaseId: string
  name: string
  type: string
  config?: Record<string, unknown>
  status?: string
  createdAt?: string
  updatedAt?: string
}

export interface Document {
  id: string
  dataSourceId: string
  knowledgeBaseId: string
  title: string
  content: string
  metadata?: Record<string, unknown>
  createdAt?: string
  updatedAt?: string
}

export interface CreateKnowledgeBaseRequest {
  name: string
  description?: string
}

export interface UpdateKnowledgeBaseRequest {
  name?: string
  description?: string
}

export interface CreateDataSourceRequest {
  knowledgeBaseId: string
  name: string
  type: string
  config?: Record<string, unknown>
}

export interface UpdateDataSourceRequest {
  name?: string
  config?: Record<string, unknown>
}

export interface CreateDocumentRequest {
  dataSourceId: string
  knowledgeBaseId: string
  title: string
  content: string
  metadata?: Record<string, unknown>
}

export interface UpdateDocumentRequest {
  title?: string
  content?: string
  metadata?: Record<string, unknown>
}
