import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { documentsService } from '../api/documentsService'
import type {
  Document,
  CreateDocumentRequest,
  UpdateDocumentRequest,
} from '../types'

export const useDocuments = (dataSourceId?: string, knowledgeBaseId?: string) => {
  return useQuery({
    queryKey: ['documents', dataSourceId, knowledgeBaseId],
    queryFn: () => documentsService.getAll(dataSourceId, knowledgeBaseId),
  })
}

export const useDocument = (id: string) => {
  return useQuery({
    queryKey: ['document', id],
    queryFn: () => documentsService.getById(id),
    enabled: !!id,
  })
}

export const useCreateDocument = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: documentsService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] })
    },
  })
}

export const useUpdateDocument = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateDocumentRequest }) =>
      documentsService.update(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['documents'] })
      queryClient.invalidateQueries({ queryKey: ['document', variables.id] })
    },
  })
}

export const useDeleteDocument = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: documentsService.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] })
    },
  })
}
