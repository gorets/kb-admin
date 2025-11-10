import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
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
  TablePagination,
  IconButton,
  Grid,
  Divider,
  Stack,
  LinearProgress,
  Collapse,
} from '@mui/material'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import AddIcon from '@mui/icons-material/Add'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import PlayArrowIcon from '@mui/icons-material/PlayArrow'
import StopIcon from '@mui/icons-material/Stop'
import RefreshIcon from '@mui/icons-material/Refresh'
import ClearIcon from '@mui/icons-material/Clear'
import ContentCopyIcon from '@mui/icons-material/ContentCopy'
import {
  useDataSource,
  useDeleteDataSource,
  useUpdateDataSource,
  useStartSyncDataSource,
  useStopSyncDataSource,
  useSyncStatus,
  useClearDataSource,
  useCloneDataSource,
} from '../hooks/useDataSources'
import { useDocuments, useDeleteDocument } from '../hooks/useDocuments'
import DocumentDialog from '../components/DocumentDialog'
import DataSourceDialog from '../components/DataSourceDialog'
import type { Document as DocumentType, DataSource } from '../types'
import { DocumentStatus, SyncDataSourceMode, SyncDataSourceStatus } from '@wildix/wim-knowledge-base-client'
import OpenInNewIcon from '@mui/icons-material/OpenInNew'

export default function DataSourceDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [documentDialogOpen, setDocumentDialogOpen] = useState(false)
  const [selectedDocument, setSelectedDocument] = useState<DocumentType | null>(null)
  const [dataSourceDialogOpen, setDataSourceDialogOpen] = useState(false)
  const [syncPollingEnabled, setSyncPollingEnabled] = useState(true) // Always fetch initially
  const [currentSyncStatus, setCurrentSyncStatus] = useState<SyncDataSourceStatus | null>(null) // Combined sync status state
  const [lastSyncErrorMessage, setLastSyncErrorMessage] = useState<string | undefined>(undefined)
  const [docsPage, setDocsPage] = useState(0)
  const [docsRowsPerPage, setDocsRowsPerPage] = useState(10)
  const [expanded, setExpanded] = useState(false);

  const { data: dataSource, isLoading, error } = useDataSource(id!)
  const { data: documents, isLoading: documentsLoading } = useDocuments(id)
  const { data: syncStatusFromPolling } = useSyncStatus(id!, syncPollingEnabled)

  const deleteDocumentMutation = useDeleteDocument()
  const deleteDataSourceMutation = useDeleteDataSource()
  const updateDataSourceMutation = useUpdateDataSource()
  const startSyncMutation = useStartSyncDataSource()
  const stopSyncMutation = useStopSyncDataSource()
  const clearDataSourceMutation = useClearDataSource()
  const cloneDataSourceMutation = useCloneDataSource()

  // Initialize sync status from dataSource on first load
  useEffect(() => {
    if (dataSource?.syncStatus && !currentSyncStatus) {
      setCurrentSyncStatus(dataSource.syncStatus)
    }
  }, [dataSource?.syncStatus, currentSyncStatus])

  // Update sync status from polling
  useEffect(() => {
    if (syncStatusFromPolling) {
      setCurrentSyncStatus(syncStatusFromPolling.syncStatus)
      setLastSyncErrorMessage(syncStatusFromPolling.syncErrorMessage)

      if (syncStatusFromPolling.syncStatus !== SyncDataSourceStatus.RUNNING) {
        setSyncPollingEnabled(false)
      }
    }
  }, [syncStatusFromPolling])

  // Check sync status and manage polling
  const isSyncRunning = currentSyncStatus === SyncDataSourceStatus.RUNNING;

  useEffect(() => {
    // Enable polling if sync is running, disable if not
    if (currentSyncStatus) {
      setSyncPollingEnabled(isSyncRunning)
    }
  }, [currentSyncStatus, isSyncRunning])

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
      // setSyncPollingEnabled(false)
    } catch (error) {
      console.error('Error stopping sync:', error)
    }
  }

  const handleClear = async () => {
    if (window.confirm('Are you sure you want to clear all data from this data source? This action cannot be undone.')) {
      try {
        await clearDataSourceMutation.mutateAsync(id!)
      } catch (error) {
        console.error('Error clearing data source:', error)
      }
    }
  }

  const handleClone = async () => {
    if (window.confirm('Are you sure you want to clone this data source?')) {
      try {
        const response = await cloneDataSourceMutation.mutateAsync(id!)
        if (response?.dataSourceId) {
          navigate(`/data-sources/${response.dataSourceId}`)
        }
      } catch (error) {
        console.error('Error cloning data source:', error)
      }
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
      await deleteDocumentMutation.mutateAsync({ dataSourceId, documentId })
    }
  }

  const handleDocsChangePage = (_event: unknown, newPage: number) => {
    setDocsPage(newPage)
  }

  const handleDocsChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setDocsRowsPerPage(parseInt(event.target.value, 10))
    setDocsPage(0)
  }

  // Paginated documents
  const paginatedDocuments = documents
    ? documents.slice(docsPage * docsRowsPerPage, docsPage * docsRowsPerPage + docsRowsPerPage)
    : []

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
          <Typography variant="h4">{dataSource.name}</Typography>
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
            startIcon={<ContentCopyIcon />}
            onClick={handleClone}
            disabled={cloneDataSourceMutation.isPending}
          >
            Clone
          </Button>
          <Button
            variant="outlined"
            color="warning"
            startIcon={<ClearIcon />}
            onClick={handleClear}
            disabled={clearDataSourceMutation.isPending}
          >
            Clear
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

      {/* Data Source Information */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Grid container spacing={2}>

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

          <Grid item xs={12} sm={6} md={3}>
            <Typography variant="caption" color="text.secondary" display="block">
              Sync Status
            </Typography>
            <Chip
              label={currentSyncStatus || 'idle'}
              size="small"
              color={
                currentSyncStatus === SyncDataSourceStatus.RUNNING ? 'primary' :
                  currentSyncStatus === SyncDataSourceStatus.SUCCESS ? 'success' :
                    currentSyncStatus === SyncDataSourceStatus.FAILED ? 'error' :
                      'default'
              }
              sx={{ mt: 0.5 }}
            />
          </Grid>

          {dataSource.createdAt && (
            <Grid item xs={12} sm={6} md={1}>
              <Typography variant="caption" color="text.secondary" display="block">
                Created
              </Typography>
              <Typography variant="body2" sx={{ mt: 0.5 }}>
                {new Date(dataSource.createdAt).toLocaleDateString()}
              </Typography>
            </Grid>
          )}

          {dataSource.updatedAt && (
            <Grid item xs={12} sm={6} md={1}>
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
              <Button
                variant="outlined"
                onClick={() => setExpanded(!expanded)}
              >
                {expanded ? 'Hide' : 'Show'} Configuration
              </Button>
              <Collapse in={expanded}>
                <Box
                  component="pre"
                  sx={{
                    backgroundColor: 'grey.100',
                    p: 1,
                    borderRadius: 1,
                    overflow: 'auto',
                    fontSize: '0.7rem',
                  }}
                >
                  {JSON.stringify(dataSource.config, null, 2)}
                </Box>
              </Collapse>
            </Grid>
          )}

          {lastSyncErrorMessage && (
            <Grid item xs={12}>
              <Alert severity="error" sx={{ mt: 1 }}>
                {lastSyncErrorMessage}
              </Alert>
            </Grid>
          )}
        </Grid>
      </Paper>

      {/* Sync Controls */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Sync Controls
        </Typography>
        <Stack direction="row" spacing={1} flexWrap="wrap">
          <Button
            variant="contained"
            startIcon={<PlayArrowIcon />}
            onClick={() => handleStartSync(SyncDataSourceMode.FULL)}
            disabled={isSyncRunning || startSyncMutation.isPending}
          >
            Start Full Sync
          </Button>
          <Button
            variant="contained"
            startIcon={<RefreshIcon />}
            onClick={() => handleStartSync(SyncDataSourceMode.INCREMENTAL)}
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

      {/* Documents Section */}
      <Box>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h5">Documents ({documents?.length || '???'})</Typography>
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
                  <TableCell>Status</TableCell>
                  <TableCell>Created</TableCell>
                  <TableCell>Updated</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {paginatedDocuments.map((doc) => (
                  <TableRow key={doc.id} hover>
                    <TableCell sx={{ width: '50%' }}>
                      <Typography variant="body1" fontWeight="medium">
                        {doc.title}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                      >
                        {doc.url && <Link to={doc.url} target="_blank" rel="noopener noreferrer">
                          <IconButton size="small" color="primary">
                            <OpenInNewIcon fontSize="small" />
                          </IconButton>
                        </Link>}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={doc.status}
                        size="small"
                        color={doc.status === DocumentStatus.PENDING ? 'primary' : doc.status === DocumentStatus.PROCESSING ? 'warning' : doc.status === DocumentStatus.COMPLETED ? 'success' : 'error'}
                      />
                      
                    </TableCell>
                    <TableCell>
                      {doc.createdAt && (
                        <Typography variant="body2">
                          {new Date(doc.createdAt).toLocaleDateString()}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      {doc.updatedAt && (
                        <Typography variant="body2">
                          {new Date(doc.updatedAt).toLocaleDateString()}
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
            <TablePagination
              component="div"
              count={documents?.length || 0}
              page={docsPage}
              onPageChange={handleDocsChangePage}
              rowsPerPage={docsRowsPerPage}
              onRowsPerPageChange={handleDocsChangeRowsPerPage}
              rowsPerPageOptions={[5, 10, 25, 50]}
            />
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
