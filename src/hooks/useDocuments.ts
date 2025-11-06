import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { kbClient } from '../api/client'
import type {
  CreateDocumentRequest,
  UpdateDocumentRequest,
} from '../types'
import {
  ListDocumentsCommand,
  GetDocumentCommand,
  CreateDocumentCommand,
  UpdateDocumentCommand,
  DeleteDocumentCommand,
} from '@wildix/wim-knowledge-base-client'

export const useDocuments = (dataSourceId?: string, knowledgeBaseId?: string) => {
  return useQuery({
    queryKey: ['documents', dataSourceId, knowledgeBaseId],
    queryFn: () => {
      const params: any = {}
      if (dataSourceId) params.dataSourceId = dataSourceId
      if (knowledgeBaseId) params.knowledgeBaseId = knowledgeBaseId
      return kbClient.send(new ListDocumentsCommand(params))
    },
  })
}

export const useDocument = (id: string) => {
  return useQuery({
    queryKey: ['document', id],
    queryFn: () => kbClient.send(new GetDocumentCommand({ documentId: id })),
    enabled: !!id,
  })
}

export const useCreateDocument = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateDocumentRequest) =>
      kbClient.send(new CreateDocumentCommand(data)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] })
    },
  })
}

export const useUpdateDocument = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateDocumentRequest }) =>
      kbClient.send(new UpdateDocumentCommand({
        documentId: id,
        ...data,
      })),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['documents'] })
      queryClient.invalidateQueries({ queryKey: ['document', variables.id] })
    },
  })
}

export const useDeleteDocument = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) =>
      kbClient.send(new DeleteDocumentCommand({ documentId: id })),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] })
    },
  })
}
