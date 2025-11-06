import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type {
  DataSource,
  CreateDataSourceRequest,
  UpdateDataSourceRequest,
} from '../types'

// Mock API calls - replace with actual @wildix/wim-knowledge-base-client calls
const dataSourcesApi = {
  getAll: async (knowledgeBaseId?: string): Promise<DataSource[]> => {
    // TODO: Replace with actual client call
    return []
  },

  getById: async (id: string): Promise<DataSource> => {
    // TODO: Replace with actual client call
    return { id, knowledgeBaseId: '', name: '', type: '' }
  },

  create: async (data: CreateDataSourceRequest): Promise<DataSource> => {
    // TODO: Replace with actual client call
    return { id: '1', ...data }
  },

  update: async (id: string, data: UpdateDataSourceRequest): Promise<DataSource> => {
    // TODO: Replace with actual client call
    return { id, knowledgeBaseId: '', name: '', type: '', ...data }
  },

  delete: async (id: string): Promise<void> => {
    // TODO: Replace with actual client call
  },
}

export const useDataSources = (knowledgeBaseId?: string) => {
  return useQuery({
    queryKey: ['dataSources', knowledgeBaseId],
    queryFn: () => dataSourcesApi.getAll(knowledgeBaseId),
  })
}

export const useDataSource = (id: string) => {
  return useQuery({
    queryKey: ['dataSource', id],
    queryFn: () => dataSourcesApi.getById(id),
    enabled: !!id,
  })
}

export const useCreateDataSource = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: dataSourcesApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dataSources'] })
    },
  })
}

export const useUpdateDataSource = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateDataSourceRequest }) =>
      dataSourcesApi.update(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['dataSources'] })
      queryClient.invalidateQueries({ queryKey: ['dataSource', variables.id] })
    },
  })
}

export const useDeleteDataSource = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: dataSourcesApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dataSources'] })
    },
  })
}
