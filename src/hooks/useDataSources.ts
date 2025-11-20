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
  StartSyncDataSourceCommand,
  StopSyncDataSourceCommand,
  GetSyncStatusCommand,
  CleanDataSourceCommand,
  CloneDataSourceCommand,
  DescribeDataSourceCommand,
  SyncDataSourceMode,
  GetSyncStatusOutput,
} from '@wildix/wim-knowledge-base-client'

export const useDataSources = () => {
  return useQuery({
    queryKey: ['dataSources'],
    queryFn: async () => {
      const response = await kbClient.send(new ListDataSourcesCommand({}))
      return response.dataSources || []
    },
  })
}

export const useDataSource = (id: string) => {
  return useQuery({
    queryKey: ['dataSource', id],
    queryFn: async () => {
      const response = await kbClient.send(new GetDataSourceCommand({ dataSourceId: id }));
      return response.dataSource
    },
    enabled: !!id,
  })
}

export const useCreateDataSource = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: CreateDataSourceRequest) => {
      const response = await kbClient.send(new CreateDataSourceCommand({
        name: data.name,
        description: data.description,
        type: data.type,
        config: data.config,
        enabled: data.enabled ?? true,
        syncSchedule: data.syncSchedule,
      }))

      return response.dataSource
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dataSources'] })
    },
  })
}

export const useUpdateDataSource = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateDataSourceRequest }) => {
      const response = await kbClient.send(new UpdateDataSourceCommand({
        dataSourceId: id,
        name: data.name,
        description: data.description,
        type: data.type,
        config: data.config,
        enabled: data.enabled,
        syncSchedule: data.syncSchedule,
      }))
      return response.dataSource
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['dataSources'] })
      queryClient.invalidateQueries({ queryKey: ['dataSource', variables.id] })
    },
  })
}

export const useDeleteDataSource = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      await kbClient.send(new DeleteDataSourceCommand({ dataSourceId: id }))
      return id
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dataSources'] })
    },
  })
}

// Sync operations
export const useStartSyncDataSource = () => {
  return useMutation({
    mutationFn: async ({ dataSourceId, syncType }: { dataSourceId: string; syncType: SyncDataSourceMode }) => {
      const response = await kbClient.send(new StartSyncDataSourceCommand({
        dataSourceId,
        syncType,
      }))
      return response
    },
  })
}

export const useStopSyncDataSource = () => {
  return useMutation({
    mutationFn: async (dataSourceId: string) => {
      const response = await kbClient.send(new StopSyncDataSourceCommand({
        dataSourceId,
      }))
      return response
    },
  })
}

export const useSyncStatus = (dataSourceId: string, enabled: boolean = false) => {
  return useQuery({
    queryKey: ['syncStatus', dataSourceId],
    queryFn: async () => {
      const response = await kbClient.send(new GetSyncStatusCommand({
        dataSourceId,
      }))
      return response as GetSyncStatusOutput
    },
    enabled: enabled && !!dataSourceId,
    refetchInterval: enabled ? 5000 : false, // Poll every 5 seconds when enabled
  })
}

export const useClearDataSource = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (dataSourceId: string) => {
      const response = await kbClient.send(new CleanDataSourceCommand({
        dataSourceId,
      }))
      return response
    },
    onSuccess: (_, dataSourceId) => {
      queryClient.invalidateQueries({ queryKey: ['dataSource', dataSourceId] })
      queryClient.invalidateQueries({ queryKey: ['documents', dataSourceId] })
    },
  })
}

export const useCloneDataSource = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (dataSourceId: string) => {
      const response = await kbClient.send(new CloneDataSourceCommand({
        dataSourceId,
      }))
      return response
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dataSources'] })
    },
  })
}

// Describe data source - get spaces, pages, etc.
export interface DescribeSpacesParams {
  confluence: {
    spaces: string
  }
}

export interface DescribePagesParams {
  confluence: {
    pages: {
      spaceId: string
      parentId: string | null
    }
  }
}

export type DescribeParams = DescribeSpacesParams | DescribePagesParams

export interface Space {
  id: string
  key: string
  name: string
}

export interface Page {
  id: string
  title: string
  parentId?: string
  children?: Page[]
}

export interface DescribeSpacesResponse {
  confluence: {
    spaces: Space[]
  }
}

export interface DescribePagesResponse {
  confluence: {
    pages: Page[]
  }
}

export const useDescribeDataSource = () => {
  return useMutation({
    mutationFn: async ({
      dataSourceId,
      parameters,
    }: {
      dataSourceId: string
      parameters: DescribeParams
    }) => {
      const response = await kbClient.send(new DescribeDataSourceCommand({
        dataSourceId,
        parameters: parameters as any, // SDK expects Document type
      }))

      // Response structure: { info: Document }
      // The info contains the actual data (spaces, pages, etc.)
      return response.result as any
    },
  })
}
