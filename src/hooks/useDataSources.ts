import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { kbClient } from '../api/client'
import type {
  CreateDataSourceRequest,
  UpdateDataSourceRequest,
} from '../types'
import {
  ListDataSourcesCommand,
  GetDataSourceCommand,
  CreateDataSourceCommand,
  UpdateDataSourceCommand,
  DeleteDataSourceCommand,
} from '@wildix/wim-knowledge-base-client'

export const useDataSources = (knowledgeBaseId?: string) => {
  return useQuery({
    queryKey: ['dataSources', knowledgeBaseId],
    queryFn: () => kbClient.send(new ListDataSourcesCommand(
      knowledgeBaseId ? { knowledgeBaseId } : {}
    )),
  })
}

export const useDataSource = (id: string) => {
  return useQuery({
    queryKey: ['dataSource', id],
    queryFn: () => kbClient.send(new GetDataSourceCommand({ dataSourceId: id })),
    enabled: !!id,
  })
}

export const useCreateDataSource = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateDataSourceRequest) =>
      kbClient.send(new CreateDataSourceCommand(data)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dataSources'] })
    },
  })
}

export const useUpdateDataSource = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateDataSourceRequest }) =>
      kbClient.send(new UpdateDataSourceCommand({
        dataSourceId: id,
        ...data,
      })),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['dataSources'] })
      queryClient.invalidateQueries({ queryKey: ['dataSource', variables.id] })
    },
  })
}

export const useDeleteDataSource = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) =>
      kbClient.send(new DeleteDataSourceCommand({ dataSourceId: id })),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dataSources'] })
    },
  })
}
