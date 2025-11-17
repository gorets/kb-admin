import { useState, useMemo } from 'react'
import {
  Box,
  Button,
  Typography,
  CircularProgress,
  Alert,
  Chip,
  Link,
  IconButton,
  TextField,
} from '@mui/material'
import { DataGrid, GridColDef } from '@mui/x-data-grid'
import AddIcon from '@mui/icons-material/Add'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import { useNavigate } from 'react-router-dom'
import {
  useDataSources,
  useCreateDataSource,
  useUpdateDataSource,
  useDeleteDataSource,
} from '../hooks/useDataSources'
import DataSourceDialog from '../components/DataSourceDialog'
import DataSourceTypeDialog from '../components/DataSourceTypeDialog'
import type { DataSource } from '../types'
import { DataSourceType } from '@wildix/wim-knowledge-base-client'

export default function DataSourcesPage() {
  const [typeDialogOpen, setTypeDialogOpen] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedDS, setSelectedDS] = useState<DataSource | null>(null)
  const [selectedType, setSelectedType] = useState<DataSourceType | undefined>(undefined)
  const [searchText, setSearchText] = useState('')
  const navigate = useNavigate()

  const { data: dataSources, isLoading, error } = useDataSources()

  const filteredDataSources = useMemo(() => {
    if (!dataSources || !searchText) return dataSources || []

    const lowerSearch = searchText.toLowerCase()
    return dataSources.filter((ds) =>
      ds.name?.toLowerCase().includes(lowerSearch) ||
      ds.type?.toLowerCase().includes(lowerSearch)
    )
  }, [dataSources, searchText])
  const createMutation = useCreateDataSource()
  const updateMutation = useUpdateDataSource()
  const deleteMutation = useDeleteDataSource()

  const handleCreate = () => {
    setSelectedDS(null)
    setSelectedType(undefined)
    setTypeDialogOpen(true)
  }

  const handleTypeSelect = (type: DataSourceType) => {
    setSelectedType(type)
    setDialogOpen(true)
  }

  const handleEdit = (ds: DataSource) => {
    setSelectedDS(ds)
    setSelectedType(undefined)
    setDialogOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this data source?')) {
      await deleteMutation.mutateAsync(id)
    }
  }

  const handleViewDetails = (id: string) => {
    navigate(`/data-sources/${id}`)
  }

  const handleSubmit = async (data: any) => {
    try {
      if (selectedDS) {
        await updateMutation.mutateAsync({ id: selectedDS.id, data })
      } else {
        await createMutation.mutateAsync(data)
      }
      setDialogOpen(false)
      setSelectedType(undefined)
    } catch (error) {
      console.error('Error saving data source:', error)
    }
  }

  const handleDialogClose = () => {
    setDialogOpen(false)
    setSelectedType(undefined)
  }

  const columns: GridColDef[] = [
    {
      field: 'name',
      headerName: 'Name',
      flex: 2,
      renderCell: (params) => (
        <Link
          component="button"
          variant="body1"
          onClick={() => handleViewDetails(params.row.id)}
          sx={{ fontWeight: 'medium', textAlign: 'left' }}
        >
          {params.value}
        </Link>
      ),
    },
    {
      field: 'type',
      headerName: 'Type',
      flex: 1,
      renderCell: (params) => (
        <Chip label={params.value} size="small" color="primary" />
      ),
    },
    {
      field: 'enabled',
      headerName: 'Enabled',
      flex: 1,
      renderCell: (params) =>
        params.value !== undefined ? (
          <Chip
            label={params.value ? 'Enabled' : 'Disabled'}
            size="small"
            color={params.value ? 'success' : 'default'}
          />
        ) : null,
    },
    {
      field: 'syncSchedule',
      headerName: 'Sync Schedule',
      flex: 1,
      renderCell: (params) =>
        params.value ? <Typography variant="body2">{params.value}</Typography> : null,
    },
    {
      field: 'syncStatus',
      headerName: 'Sync Status',
      flex: 1,
      renderCell: (params) =>
        params.value !== undefined ? (
          <Chip
            label={params.value}
            size="small"
            color={params.value === 'running' ? 'primary' : 'default'}
          />
        ) : null,
    },
    {
      field: 'createdAt',
      headerName: 'Created',
      flex: 1,
      renderCell: (params) =>
        params.value ? (
          <Typography variant="body2">
            {new Date(params.value).toLocaleDateString()}
          </Typography>
        ) : null,
    },
    {
      field: 'actions',
      headerName: 'Actions',
      flex: 1,
      sortable: false,
      renderCell: (params) => (
        <Box>
          <IconButton
            size="small"
            onClick={() => handleEdit(params.row)}
            color="primary"
          >
            <EditIcon />
          </IconButton>
          <IconButton
            size="small"
            onClick={() => handleDelete(params.row.id)}
            color="error"
          >
            <DeleteIcon />
          </IconButton>
        </Box>
      ),
    },
  ]

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
        <Box sx={{ height: 600, width: '100%' }}>
          <Box sx={{ py: 2, borderBottom: 1, borderColor: 'divider' }}>
            <TextField
              fullWidth
              placeholder="Search data sources..."
              variant="outlined"
              size="small"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
            />
          </Box>
          <DataGrid
            rows={filteredDataSources}
            columns={columns}
            initialState={{
              pagination: {
                paginationModel: { pageSize: 10, page: 0 },
              },
            }}
            pageSizeOptions={[5, 10, 25, 50]}
            disableRowSelectionOnClick
          />
        </Box>
      )}

      <DataSourceTypeDialog
        open={typeDialogOpen}
        onClose={() => setTypeDialogOpen(false)}
        onSelect={handleTypeSelect}
      />

      <DataSourceDialog
        open={dialogOpen}
        onClose={handleDialogClose}
        onSubmit={handleSubmit}
        dataSource={selectedDS}
        loading={createMutation.isPending || updateMutation.isPending}
        preselectedType={selectedType}
      />
    </Box>
  )
}
