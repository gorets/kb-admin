import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { knowledgeBasesService } from '../api/knowledgeBasesService'
import type {
  UpdateKnowledgeBaseRequest,
} from '../types'
import { kbClient } from '../api/client'
import { CreateKnowledgeBaseCommand, GetKnowledgeBaseCommand, ListKnowledgeBasesCommand, UpdateKnowledgeBaseCommand } from '@wildix/wim-knowledge-base-client'


export const useKnowledgeBases = () => {
  return useQuery({
    queryKey: ['knowledgeBases'],
    queryFn: () => kbClient.send(new ListKnowledgeBasesCommand({})),
  })
}

export const useKnowledgeBase = (id: string) => {
  return useQuery({
    queryKey: ['knowledgeBase', id],
    queryFn: () => kbClient.send(new GetKnowledgeBaseCommand({knowledgeBaseId: id})),
    enabled: !!id,
  })
}

export const useCreateKnowledgeBase = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: { name: string; description: string }) => kbClient.send(new CreateKnowledgeBaseCommand({ 
      name: data.name,
      description: data.description,
      dataSources: [],
    })),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['knowledgeBases'] })
    },
  })
}

export const useUpdateKnowledgeBase = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateKnowledgeBaseRequest }) =>
      kbClient.send(new UpdateKnowledgeBaseCommand({
        knowledgeBaseId: id,
        name: data.name || '',
        description: data.description || '',
        dataSources: [],
      })),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['knowledgeBases'] })
      queryClient.invalidateQueries({ queryKey: ['knowledgeBase', id] })
    },
  })
}
