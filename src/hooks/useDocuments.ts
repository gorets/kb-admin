import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { kbClient } from '../api/kbClient'
import type {
  CreateDocumentRequest,
  UpdateDocumentRequest,
} from '../types'

export const useDocuments = (dataSourceId?: string, knowledgeBaseId?: string) => {
  return useQuery({
    queryKey: ['documents', dataSourceId, knowledgeBaseId],
    queryFn: () => {
      if (dataSourceId) {
        return kbClient.documents.getByDataSource(dataSourceId)
      } else if (knowledgeBaseId) {
        return kbClient.documents.getByKnowledgeBase(knowledgeBaseId)
      } else {
        return kbClient.documents.getAll()
      }
    },
  })
}

export const useDocument = (id: string) => {
  return useQuery({
    queryKey: ['document', id],
    queryFn: () => kbClient.documents.getById(id),
    enabled: !!id,
  })
}

export const useCreateDocument = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateDocumentRequest) => kbClient.documents.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] })
    },
  })
}

export const useUpdateDocument = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateDocumentRequest }) =>
      kbClient.documents.update(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['documents'] })
      queryClient.invalidateQueries({ queryKey: ['document', variables.id] })
    },
  })
}

export const useDeleteDocument = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => kbClient.documents.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] })
    },
  })
}
