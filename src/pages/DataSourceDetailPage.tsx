import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Box,
  Button,
  Typography,
  CircularProgress,
  Alert,
  Paper,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Grid,
  Divider,
  Stack,
  LinearProgress,
} from '@mui/material'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import AddIcon from '@mui/icons-material/Add'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import PlayArrowIcon from '@mui/icons-material/PlayArrow'
import StopIcon from '@mui/icons-material/Stop'
import RefreshIcon from '@mui/icons-material/Refresh'
import {
  useDataSource,
  useDeleteDataSource,
  useUpdateDataSource,
  useStartSyncDataSource,
  useStopSyncDataSource,
  useSyncStatus,
} from '../hooks/useDataSources'
import { useDocuments, useDeleteDocument } from '../hooks/useDocuments'
import DocumentDialog from '../components/DocumentDialog'
import DataSourceDialog from '../components/DataSourceDialog'
import type { Document as DocumentType, DataSource } from '../types'
import { SyncDataSourceMode, SyncDataSourceStatus } from '@wildix/wim-knowledge-base-client'

export default function DataSourceDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [documentDialogOpen, setDocumentDialogOpen] = useState(false)
  const [selectedDocument, setSelectedDocument] = useState<DocumentType | null>(null)
  const [dataSourceDialogOpen, setDataSourceDialogOpen] = useState(false)
  const [syncPollingEnabled, setSyncPollingEnabled] = useState(true) // Always fetch initially

  const { data: dataSource, isLoading, error } = useDataSource(id!)
  const { data: documents, isLoading: documentsLoading } = useDocuments(id)
  const { data: syncStatus } = useSyncStatus(id!, syncPollingEnabled)

  const deleteDocumentMutation = useDeleteDocument()
  const deleteDataSourceMutation = useDeleteDataSource()
  const updateDataSourceMutation = useUpdateDataSource()
  const startSyncMutation = useStartSyncDataSource()
  const stopSyncMutation = useStopSyncDataSource()

  const handleBack = () => {
    navigate('/data-sources')
  }

  const handleEdit = () => {
    setDataSourceDialogOpen(true)
  }

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this data source? All associated documents will be lost.')) {
      try {
        await deleteDataSourceMutation.mutateAsync(id!)
        navigate('/data-sources')
      } catch (error) {
        console.error('Error deleting data source:', error)
      }
    }
  }

  const handleUpdateDataSource = async (data: any) => {
    try {
      await updateDataSourceMutation.mutateAsync({ id: id!, data })
      setDataSourceDialogOpen(false)
    } catch (error) {
      console.error('Error updating data source:', error)
    }
  }

  const handleStartSync = async (syncType: SyncDataSourceMode) => {
    try {
      await startSyncMutation.mutateAsync({ dataSourceId: id!, syncType })
      setSyncPollingEnabled(true)
    } catch (error) {
      console.error('Error starting sync:', error)
    }
  }

  const handleStopSync = async () => {
    try {
      await stopSyncMutation.mutateAsync(id!)
      setSyncPollingEnabled(false)
    } catch (error) {
      console.error('Error stopping sync:', error)
    }
  }

  const handleAddDocument = () => {
    setSelectedDocument(null)
    setDocumentDialogOpen(true)
  }

  const handleEditDocument = (doc: DocumentType) => {
    setSelectedDocument(doc)
    setDocumentDialogOpen(true)
  }

  const handleDeleteDocument = async (dataSourceId: string, documentId: string) => {
    if (window.confirm('Are you sure you want to delete this document?')) {
      await deleteDocumentMutation.mutateAsync({dataSourceId, documentId})
    }
  }

  // Check sync status and manage polling
  const isSyncRunning = syncStatus?.status === 'running' || syncStatus?.status === 'pending'

  useEffect(() => {
    // Enable polling if sync is running, disable if not
    if (syncStatus) {
      setSyncPollingEnabled(isSyncRunning)
    }
  }, [syncStatus?.status, isSyncRunning])

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    )
  }

  if (error || !dataSource) {
    return (
      <Alert severity="error">
        Error loading data source: {error?.message || 'Not found'}
      </Alert>
    )
  }

  return (
    <Box>
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={3}>
        <Box display="flex" alignItems="center" gap={2}>
          <IconButton onClick={handleBack}>
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h4">Data Source Details</Typography>
        </Box>
        <Stack direction="row" spacing={1}>
          <Button
            variant="outlined"
            startIcon={<EditIcon />}
            onClick={handleEdit}
          >
            Edit
          </Button>
          <Button
            variant="outlined"
            color="error"
            startIcon={<DeleteIcon />}
            onClick={handleDelete}
          >
            Delete
          </Button>
        </Stack>
      </Box>

      {/* Sync Status */}
      {syncStatus && (
        <Paper sx={{ p: 2, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Sync Status
          </Typography>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={6} md={3}>
              <Typography variant="caption" color="text.secondary" display="block">
                Status
              </Typography>
              <Chip
                label={syncStatus.status || 'idle'}
                size="small"
                color={
                  syncStatus.status === SyncDataSourceStatus.RUNNING ? 'primary' :
                    syncStatus.status === SyncDataSourceStatus.SUCCESS ? 'success' :
                      syncStatus.status === SyncDataSourceStatus.FAILED ? 'error' :
                  'default'
                }
                sx={{ mt: 0.5 }}
              />
            </Grid>
            {syncStatus.progress !== undefined && (
              <Grid item xs={12} sm={6} md={3}>
                <Typography variant="caption" color="text.secondary" display="block">
                  Progress
                </Typography>
                <Typography variant="body2" sx={{ mt: 0.5 }}>
                  {syncStatus.progress}%
                </Typography>
                <LinearProgress
                  variant="determinate"
                  value={syncStatus.progress}
                  sx={{ mt: 1 }}
                />
              </Grid>
            )}
            {syncStatus.lastSyncAt && (
              <Grid item xs={12} sm={6} md={3}>
                <Typography variant="caption" color="text.secondary" display="block">
                  Last Sync
                </Typography>
                <Typography variant="body2" sx={{ mt: 0.5 }}>
                  {new Date(syncStatus.lastSyncAt).toLocaleString()}
                </Typography>
              </Grid>
            )}
            {syncStatus.error && (
              <Grid item xs={12}>
                <Alert severity="error" sx={{ mt: 1 }}>
                  {syncStatus.error}
                </Alert>
              </Grid>
            )}
          </Grid>
        </Paper>
      )}

      {/* Sync Controls */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Sync Controls
        </Typography>
        <Stack direction="row" spacing={1} flexWrap="wrap">
          <Button
            variant="contained"
            startIcon={<PlayArrowIcon />}
            onClick={() => handleStartSync('full')}
            disabled={isSyncRunning || startSyncMutation.isPending}
          >
            Start Full Sync
          </Button>
          <Button
            variant="contained"
            startIcon={<RefreshIcon />}
            onClick={() => handleStartSync('incremental')}
            disabled={isSyncRunning || startSyncMutation.isPending}
          >
            Start Incremental Sync
          </Button>
          <Button
            variant="outlined"
            color="error"
            startIcon={<StopIcon />}
            onClick={handleStopSync}
            disabled={!isSyncRunning || stopSyncMutation.isPending}
          >
            Stop Sync
          </Button>
        </Stack>
      </Paper>

      {/* Data Source Information */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <Typography variant="h5" gutterBottom>
              {dataSource.name}
            </Typography>
          </Grid>

          {dataSource.description && (
            <Grid item xs={12}>
              <Typography variant="body1" color="text.secondary">
                {dataSource.description}
              </Typography>
            </Grid>
          )}

          <Grid item xs={12} sm={6} md={3}>
            <Typography variant="caption" color="text.secondary" display="block">
              Type
            </Typography>
            <Chip label={dataSource.type} size="small" color="primary" sx={{ mt: 0.5 }} />
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Typography variant="caption" color="text.secondary" display="block">
              Status
            </Typography>
            <Chip
              label={dataSource.enabled ? 'Enabled' : 'Disabled'}
              size="small"
              color={dataSource.enabled ? 'success' : 'default'}
              sx={{ mt: 0.5 }}
            />
          </Grid>

          {dataSource.createdAt && (
            <Grid item xs={12} sm={6} md={3}>
              <Typography variant="caption" color="text.secondary" display="block">
                Created
              </Typography>
              <Typography variant="body2" sx={{ mt: 0.5 }}>
                {new Date(dataSource.createdAt).toLocaleDateString()}
              </Typography>
            </Grid>
          )}

          {dataSource.updatedAt && (
            <Grid item xs={12} sm={6} md={3}>
              <Typography variant="caption" color="text.secondary" display="block">
                Updated
              </Typography>
              <Typography variant="body2" sx={{ mt: 0.5 }}>
                {new Date(dataSource.updatedAt).toLocaleDateString()}
              </Typography>
            </Grid>
          )}

          {dataSource.config && Object.keys(dataSource.config).length > 0 && (
            <Grid item xs={12}>
              <Divider sx={{ my: 2 }} />
              <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
                Configuration
              </Typography>
              <Box
                component="pre"
                sx={{
                  backgroundColor: 'grey.100',
                  p: 2,
                  borderRadius: 1,
                  overflow: 'auto',
                  fontSize: '0.875rem',
                }}
              >
                {JSON.stringify(dataSource.config, null, 2)}
              </Box>
            </Grid>
          )}
        </Grid>
      </Paper>

      {/* Documents Section */}
      <Box>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h5">Documents</Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleAddDocument}
          >
            Add Document
          </Button>
        </Box>

        {documentsLoading ? (
          <Box display="flex" justifyContent="center" p={3}>
            <CircularProgress />
          </Box>
        ) : documents && documents.length > 0 ? (
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Title</TableCell>
                  <TableCell>Content Preview</TableCell>
                  <TableCell>Created</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {documents.map((doc) => (
                  <TableRow key={doc.id} hover>
                    <TableCell>
                      <Typography variant="body1" fontWeight="medium">
                        {doc.title}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{
                          maxWidth: 400,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {doc.content}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      {doc.createdAt && (
                        <Typography variant="body2">
                          {new Date(doc.createdAt).toLocaleDateString()}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell align="right">
                      <IconButton
                        size="small"
                        onClick={() => handleEditDocument(doc)}
                        color="primary"
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => handleDeleteDocument(doc.dataSourceId, doc.id)}
                        color="error"
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        ) : (
          <Alert severity="info">
            No documents yet. Click "Add Document" to create one.
          </Alert>
        )}
      </Box>

      <DocumentDialog
        open={documentDialogOpen}
        onClose={() => setDocumentDialogOpen(false)}
        document={selectedDocument}
        preselectedDataSourceId={dataSource.id}
      />

      <DataSourceDialog
        open={dataSourceDialogOpen}
        onClose={() => setDataSourceDialogOpen(false)}
        onSubmit={handleUpdateDataSource}
        dataSource={dataSource}
        loading={updateDataSourceMutation.isPending}
      />
    </Box>
  )
}
