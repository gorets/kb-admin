import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type {
  KnowledgeBase,
  CreateKnowledgeBaseRequest,
  UpdateKnowledgeBaseRequest,
} from '../types'

// Mock API calls - replace with actual @wildix/wim-knowledge-base-client calls
const knowledgeBasesApi = {
  getAll: async (): Promise<KnowledgeBase[]> => {
    // TODO: Replace with actual client call
    // import { KnowledgeBaseClient } from '@wildix/wim-knowledge-base-client'
    // const client = new KnowledgeBaseClient(config)
    // return client.getKnowledgeBases()
    return []
  },

  getById: async (id: string): Promise<KnowledgeBase> => {
    // TODO: Replace with actual client call
    return { id, name: '', description: '' }
  },

  create: async (data: CreateKnowledgeBaseRequest): Promise<KnowledgeBase> => {
    // TODO: Replace with actual client call
    return { id: '1', ...data }
  },

  update: async (id: string, data: UpdateKnowledgeBaseRequest): Promise<KnowledgeBase> => {
    // TODO: Replace with actual client call
    return { id, name: '', ...data }
  },

  delete: async (id: string): Promise<void> => {
    // TODO: Replace with actual client call
  },
}

export const useKnowledgeBases = () => {
  return useQuery({
    queryKey: ['knowledgeBases'],
    queryFn: knowledgeBasesApi.getAll,
  })
}

export const useKnowledgeBase = (id: string) => {
  return useQuery({
    queryKey: ['knowledgeBase', id],
    queryFn: () => knowledgeBasesApi.getById(id),
    enabled: !!id,
  })
}

export const useCreateKnowledgeBase = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: knowledgeBasesApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['knowledgeBases'] })
    },
  })
}

export const useUpdateKnowledgeBase = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateKnowledgeBaseRequest }) =>
      knowledgeBasesApi.update(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['knowledgeBases'] })
      queryClient.invalidateQueries({ queryKey: ['knowledgeBase', variables.id] })
    },
  })
}

export const useDeleteKnowledgeBase = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: knowledgeBasesApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['knowledgeBases'] })
    },
  })
}
