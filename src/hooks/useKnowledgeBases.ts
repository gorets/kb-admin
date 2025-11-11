import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { kbClient } from '../api/client'
import type { CreateKnowledgeBaseRequest, UpdateKnowledgeBaseRequest } from '../types'
import {
  CreateKnowledgeBaseCommand,
  GetKnowledgeBaseCommand,
  ListKnowledgeBasesCommand,
  UpdateKnowledgeBaseCommand,
  DeleteKnowledgeBaseCommand,
  SearchKnowledgeBaseCommand,
  QueryKnowledgeBaseCommand,
} from '@wildix/wim-knowledge-base-client'


export const useKnowledgeBases = () => {
  return useQuery({
    queryKey: ['knowledgeBases'],
    queryFn: async () => {
      const response = await kbClient.send(new ListKnowledgeBasesCommand({}))
      return response.knowledgeBases
    },
  })
}

export const useKnowledgeBase = (id: string) => {
  return useQuery({
    queryKey: ['knowledgeBase', id],
    queryFn: async () => {
      const response = await kbClient.send(new GetKnowledgeBaseCommand({knowledgeBaseId: id}))
      return response.knowledgeBase
    },
    enabled: !!id,
  })
}

export const useCreateKnowledgeBase = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: CreateKnowledgeBaseRequest) => {
      const response = await kbClient.send(new CreateKnowledgeBaseCommand({ 
        name: data.name,
        description: data.description,
        dataSources: data.dataSources || [],
      }))
      return response.knowledgeBase
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['knowledgeBases'] })
    },
  })
}

export const useUpdateKnowledgeBase = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateKnowledgeBaseRequest }) => {
      const response = await kbClient.send(new UpdateKnowledgeBaseCommand({
        knowledgeBaseId: id,
        name: data.name || '',
        description: data.description || '',
        dataSources: data.dataSources || [],
      }))
      return response.knowledgeBase
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['knowledgeBases'] })
      queryClient.invalidateQueries({ queryKey: ['knowledgeBase', id] })
    },
  })
}

export const useDeleteKnowledgeBase = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      await kbClient.send(new DeleteKnowledgeBaseCommand({ knowledgeBaseId: id }))
      return true
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['knowledgeBases'] })
      queryClient.invalidateQueries({ queryKey: ['knowledgeBase', id] })
    },
  })
}

export const useSearchKnowledgeBase = () => {
  return useMutation({
    mutationFn: async (params: {
      knowledgeBaseId: string
      query: string
      topK?: number
      threshold?: number
      strategy?: 'HYBRID' | 'VECTOR' | 'BM25'
    }) => {
      const response = await kbClient.send(new SearchKnowledgeBaseCommand({
        knowledgeBaseId: params.knowledgeBaseId,
        query: params.query,
        topK: params.topK,
        threshold: params.threshold,
        strategy: params.strategy,
      }))
      return response
    },
  })
}

export const useQueryKnowledgeBase = () => {
  return useMutation({
    mutationFn: async (params: {
      knowledgeBaseId: string
      query: string
      topK?: number
      threshold?: number
      maxTokens?: number
      strategy?: 'HYBRID' | 'VECTOR' | 'BM25'
    }) => {
      const response = await kbClient.send(new QueryKnowledgeBaseCommand({
        knowledgeBaseId: params.knowledgeBaseId,
        query: params.query,
        topK: params.topK,
        threshold: params.threshold,
        maxTokens: params.maxTokens,
        strategy: params.strategy,
      }))
      return response
    },
  })
}
