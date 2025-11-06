import { useState } from 'react'
import {
  Box,
  Button,
  Card,
  CardContent,
  CardActions,
  Typography,
  IconButton,
  Grid,
  CircularProgress,
  Alert,
  Chip,
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import {
  useDataSources,
  useCreateDataSource,
  useUpdateDataSource,
  useDeleteDataSource,
} from '../hooks/useDataSources'
import { useKnowledgeBases } from '../hooks/useKnowledgeBases'
import DataSourceDialog from '../components/DataSourceDialog'
import type { DataSource } from '../types'

export default function DataSourcesPage() {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedDS, setSelectedDS] = useState<DataSource | null>(null)

  const { data: dataSources, isLoading, error } = useDataSources()
  const { data: knowledgeBases } = useKnowledgeBases()
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

  const getKnowledgeBaseName = (kbId: string) => {
    return knowledgeBases?.find((kb) => kb.id === kbId)?.name || kbId
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
        <Grid container spacing={3}>
          {dataSources?.map((ds) => (
            <Grid item xs={12} sm={6} md={4} key={ds.id}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    {ds.name}
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
                    <Chip label={ds.type} size="small" color="primary" />
                    {ds.status && (
                      <Chip label={ds.status} size="small" color="default" />
                    )}
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    KB: {getKnowledgeBaseName(ds.knowledgeBaseId)}
                  </Typography>
                  {ds.createdAt && (
                    <Typography variant="caption" color="text.secondary" display="block" mt={1}>
                      Created: {new Date(ds.createdAt).toLocaleDateString()}
                    </Typography>
                  )}
                </CardContent>
                <CardActions>
                  <IconButton
                    size="small"
                    onClick={() => handleEdit(ds)}
                    color="primary"
                  >
                    <EditIcon />
                  </IconButton>
                  <IconButton
                    size="small"
                    onClick={() => handleDelete(ds.id)}
                    color="error"
                  >
                    <DeleteIcon />
                  </IconButton>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
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
