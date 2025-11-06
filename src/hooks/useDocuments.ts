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

export const useDocuments = (dataSourceId?: string) => {
  return useQuery({
    queryKey: ['documents', dataSourceId],
    queryFn: async () => {
      const params: any = {}
      if (dataSourceId) params.dataSourceId = dataSourceId
      const response = await kbClient.send(new ListDocumentsCommand(params))
      return response.documents || []
    },
  })
}

export const useDocument = (id: string) => {
  return useQuery({
    queryKey: ['document', id],
    queryFn: async () => {
      const response = await kbClient.send(new GetDocumentCommand({ documentId: id }));
      return response.document
    },
    enabled: !!id,
  })
}

export const useCreateDocument = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: CreateDocumentRequest) => {
      const response = await kbClient.send(new CreateDocumentCommand({
        title: data.title,
        url: data.url,
        content: data.content,
        originalFormat: data.originalFormat,
        originalName: data.originalName,
        originalId: data.originalId,
        dataSourceId: data.dataSourceId,
      }))
       
      return response.document
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] })
    },
  })
}

export const useUpdateDocument = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateDocumentRequest }) => {
      const response = await kbClient.send(new UpdateDocumentCommand({
        documentId: id,
        dataSourceId: data.dataSourceId,
        title: data.title,
        url: data.url,
        content: data.content,
        originalFormat: data.originalFormat,
        originalName: data.originalName,
        originalId: data.originalId,
      }))
      return response.document
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['documents'] })
      queryClient.invalidateQueries({ queryKey: ['document', variables.id] })
    },
  })
}

export const useDeleteDocument = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ documentId, dataSourceId }: { documentId: string; dataSourceId: string }) => {
      await kbClient.send(new DeleteDocumentCommand({
        documentId,
        dataSourceId,
      }))
      return documentId
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] })
    },
  })
}