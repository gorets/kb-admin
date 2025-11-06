import { useState } from 'react'
import {
  Box,
  Button,
  Typography,
  CircularProgress,
  Alert,
  Stack,
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import {
  useDataSources,
  useCreateDataSource,
  useUpdateDataSource,
  useDeleteDataSource,
} from '../hooks/useDataSources'
import DataSourceDialog from '../components/DataSourceDialog'
import DataSourceCard from '../components/DataSourceCard'
import type { DataSource } from '../types'

export default function DataSourcesPage() {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedDS, setSelectedDS] = useState<DataSource | null>(null)

  const { data: dataSources, isLoading, error } = useDataSources()
  const createMutation = useCreateDataSource()
  const updateMutation = useUpdateDataSource()
  const deleteMutation = useDeleteDataSource()

  const handleCreate = () => {
    setSelectedDS(null)
    setDialogOpen(true)
  }

  const handleEdit = (ds: DataSource) => {
    setSelectedDS(ds)
    setDialogOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this data source?')) {
      await deleteMutation.mutateAsync(id)
    }
  }

  const handleSubmit = async (data: any) => {
    try {
      if (selectedDS) {
        await updateMutation.mutateAsync({ id: selectedDS.id, data })
      } else {
        await createMutation.mutateAsync(data)
      }
      setDialogOpen(false)
    } catch (error) {
      console.error('Error saving data source:', error)
    }
  }

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    )
  }

  if (error) {
    return (
      <Alert severity="error">
        Error loading data sources: {error.message}
      </Alert>
    )
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">Data Sources</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleCreate}
        >
          Create Data Source
        </Button>
      </Box>

      {dataSources && dataSources.length === 0 ? (
        <Alert severity="info">
          No data sources found. Create your first one to get started.
        </Alert>
      ) : (
        <Stack spacing={2}>
          {dataSources?.map((ds) => (
            <DataSourceCard
              key={ds.id}
              dataSource={ds}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ))}
        </Stack>
      )}

      <DataSourceDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSubmit={handleSubmit}
        dataSource={selectedDS}
        loading={createMutation.isPending || updateMutation.isPending}
      />
    </Box>
  )
}
