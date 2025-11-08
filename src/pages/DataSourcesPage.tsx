import { useState } from 'react'
import {
  Box,
  Button,
  Typography,
  CircularProgress,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Paper,
  Chip,
  Link,
  IconButton,
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import VisibilityIcon from '@mui/icons-material/Visibility'
import { useNavigate } from 'react-router-dom'
import {
  useDataSources,
  useCreateDataSource,
  useUpdateDataSource,
  useDeleteDataSource,
} from '../hooks/useDataSources'
import DataSourceDialog from '../components/DataSourceDialog'
import type { DataSource } from '../types'

export default function DataSourcesPage() {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedDS, setSelectedDS] = useState<DataSource | null>(null)
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const navigate = useNavigate()

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
    } catch (error) {
      console.error('Error saving data source:', error)
    }
  }

  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage)
  }

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10))
    setPage(0)
  }

  // Paginated data
  const paginatedDataSources = dataSources
    ? dataSources.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
    : []

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
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Enabled</TableCell>
                <TableCell>Sync Schedule</TableCell>
                <TableCell>Sync Status</TableCell>
                <TableCell>Created</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedDataSources.map((ds) => (
                <TableRow key={ds.id} hover>
                  <TableCell>
                    <Link
                      component="button"
                      variant="body1"
                      onClick={() => handleViewDetails(ds.id)}
                      sx={{ fontWeight: 'medium', textAlign: 'left' }}
                    >
                      {ds.name}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <Chip label={ds.type} size="small" color="primary" />
                  </TableCell>
                  <TableCell>
                    {ds.enabled !== undefined && (
                      <Chip
                        label={ds.enabled ? 'Enabled' : 'Disabled'}
                        size="small"
                        color={ds.enabled ? 'success' : 'default'}
                      />
                    )}
                  </TableCell>
                  <TableCell>
                    {ds.syncSchedule && (
                      <Typography variant="body2">
                        {ds.syncSchedule}
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    {ds.syncStatus !== undefined && (
                      <Chip
                        label={ds.syncStatus}
                        size="small"
                        color={ds.syncStatus === 'running' ? 'primary' : 'default'}
                      />
                    )}
                  </TableCell>
                  <TableCell>
                    {ds.createdAt && (
                      <Typography variant="body2">
                        {new Date(ds.createdAt).toLocaleDateString()}
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell align="right">
                    <IconButton
                      size="small"
                      onClick={() => handleViewDetails(ds.id)}
                      color="primary"
                    >
                      <VisibilityIcon />
                    </IconButton>
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
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <TablePagination
            component="div"
            count={dataSources?.length || 0}
            page={page}
            onPageChange={handleChangePage}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            rowsPerPageOptions={[5, 10, 25, 50]}
          />
        </TableContainer>
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
