import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { dataSourcesService } from '../api/dataSourcesService'
import type {
  DataSource,
  CreateDataSourceRequest,
  UpdateDataSourceRequest,
} from '../types'

export const useDataSources = (knowledgeBaseId?: string) => {
  return useQuery({
    queryKey: ['dataSources', knowledgeBaseId],
    queryFn: () => dataSourcesService.getAll(knowledgeBaseId),
  })
}

export const useDataSource = (id: string) => {
  return useQuery({
    queryKey: ['dataSource', id],
    queryFn: () => dataSourcesService.getById(id),
    enabled: !!id,
  })
}

export const useCreateDataSource = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: dataSourcesService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dataSources'] })
    },
  })
}

export const useUpdateDataSource = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateDataSourceRequest }) =>
      dataSourcesService.update(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['dataSources'] })
      queryClient.invalidateQueries({ queryKey: ['dataSource', variables.id] })
    },
  })
}

export const useDeleteDataSource = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: dataSourcesService.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dataSources'] })
    },
  })
}
