import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type {
  Document,
  CreateDocumentRequest,
  UpdateDocumentRequest,
} from '../types'

// Mock API calls - replace with actual @wildix/wim-knowledge-base-client calls
const documentsApi = {
  getAll: async (dataSourceId?: string, knowledgeBaseId?: string): Promise<Document[]> => {
    // TODO: Replace with actual client call
    return []
  },

  getById: async (id: string): Promise<Document> => {
    // TODO: Replace with actual client call
    return { id, dataSourceId: '', knowledgeBaseId: '', title: '', content: '' }
  },

  create: async (data: CreateDocumentRequest): Promise<Document> => {
    // TODO: Replace with actual client call
    return { id: '1', ...data }
  },

  update: async (id: string, data: UpdateDocumentRequest): Promise<Document> => {
    // TODO: Replace with actual client call
    return {
      id,
      dataSourceId: '',
      knowledgeBaseId: '',
      title: '',
      content: '',
      ...data
    }
  },

  delete: async (id: string): Promise<void> => {
    // TODO: Replace with actual client call
  },
}

export const useDocuments = (dataSourceId?: string, knowledgeBaseId?: string) => {
  return useQuery({
    queryKey: ['documents', dataSourceId, knowledgeBaseId],
    queryFn: () => documentsApi.getAll(dataSourceId, knowledgeBaseId),
  })
}

export const useDocument = (id: string) => {
  return useQuery({
    queryKey: ['document', id],
    queryFn: () => documentsApi.getById(id),
    enabled: !!id,
  })
}

export const useCreateDocument = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: documentsApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] })
    },
  })
}

export const useUpdateDocument = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateDocumentRequest }) =>
      documentsApi.update(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['documents'] })
      queryClient.invalidateQueries({ queryKey: ['document', variables.id] })
    },
  })
}

export const useDeleteDocument = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: documentsApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] })
    },
  })
}
