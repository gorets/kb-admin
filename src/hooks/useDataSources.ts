import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { kbClient } from '../api/kbClient'
import type {
  CreateDataSourceRequest,
  UpdateDataSourceRequest,
} from '../types'

export const useDataSources = (knowledgeBaseId?: string) => {
  return useQuery({
    queryKey: ['dataSources', knowledgeBaseId],
    queryFn: () => knowledgeBaseId
      ? kbClient.dataSources.getByKnowledgeBase(knowledgeBaseId)
      : kbClient.dataSources.getAll(),
  })
}

export const useDataSource = (id: string) => {
  return useQuery({
    queryKey: ['dataSource', id],
    queryFn: () => kbClient.dataSources.getById(id),
    enabled: !!id,
  })
}

export const useCreateDataSource = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateDataSourceRequest) => kbClient.dataSources.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dataSources'] })
    },
  })
}

export const useUpdateDataSource = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateDataSourceRequest }) =>
      kbClient.dataSources.update(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['dataSources'] })
      queryClient.invalidateQueries({ queryKey: ['dataSource', variables.id] })
    },
  })
}

export const useDeleteDataSource = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => kbClient.dataSources.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dataSources'] })
    },
  })
}
