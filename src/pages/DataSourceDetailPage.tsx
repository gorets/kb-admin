import { useState, useEffect, useMemo } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import {
  Box,
  Button,
  Typography,
  CircularProgress,
  Alert,
  Paper,
  Chip,
  Tooltip,
  IconButton,
  Grid,
  Stack,
  Collapse,
  TextField,
} from '@mui/material'
import { DataGrid, GridColDef } from '@mui/x-data-grid'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import AddIcon from '@mui/icons-material/Add'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import PlayArrowIcon from '@mui/icons-material/PlayArrow'
import StopIcon from '@mui/icons-material/Stop'
import RefreshIcon from '@mui/icons-material/Refresh'
import ClearIcon from '@mui/icons-material/Clear'
import ContentCopyIcon from '@mui/icons-material/ContentCopy'
import VisibilityIcon from '@mui/icons-material/Visibility'
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
import { useDocuments, useDeleteDocument, useGetDocumentWithChunks } from '../hooks/useDocuments'
import DocumentDialog from '../components/DocumentDialog'
import DataSourceDialog from '../components/DataSourceDialog'
import DocumentDetailsDrawer from '../components/DocumentDetailsDrawer'
import type { Document as DocumentType } from '../types'
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
  const [expanded, setExpanded] = useState(false)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [selectedDocumentDetails, setSelectedDocumentDetails] = useState<{
    document: DocumentType | null
    content: string
    chunks: any[]
  }>({ document: null, content: '', chunks: [] })
  const [searchText, setSearchText] = useState('')

  const { data: dataSource, isLoading, error } = useDataSource(id!)
  const { data: documents, isLoading: documentsLoading } = useDocuments(id)
  const { data: syncStatusFromPolling } = useSyncStatus(id!, syncPollingEnabled)

  const filteredDocuments = useMemo(() => {
    if (!documents || !searchText) return documents || []

    const lowerSearch = searchText.toLowerCase()
    return documents.filter((doc) =>
      doc.title?.toLowerCase().includes(lowerSearch) ||
      doc.url?.toLowerCase().includes(lowerSearch)
    )
  }, [documents, searchText])

  const deleteDocumentMutation = useDeleteDocument()
  const deleteDataSourceMutation = useDeleteDataSource()
  const updateDataSourceMutation = useUpdateDataSource()
  const startSyncMutation = useStartSyncDataSource()
  const stopSyncMutation = useStopSyncDataSource()
  const clearDataSourceMutation = useClearDataSource()
  const cloneDataSourceMutation = useCloneDataSource()
  const getDocumentWithChunksMutation = useGetDocumentWithChunks()

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

  const handleGetDocument = async (doc: DocumentType) => {
    try {
      const result = await getDocumentWithChunksMutation.mutateAsync({
        dataSourceId: doc.dataSourceId,
        documentId: doc.id
      })
      setSelectedDocumentDetails({
        document: result.document || null,
        content: result.content || '',
        chunks: result.chunks
      })
      setDrawerOpen(true)
    } catch (error) {
      console.error('Error fetching document details:', error)
    }
  }

  const columns: GridColDef[] = [
    {
      field: 'title',
      headerName: 'Title',
      flex: 3,
      renderCell: (params) => (
        <Typography variant="body1" fontWeight="medium" marginTop="14px">
          {params.value}
        </Typography>
      ),
    },
    {
      field: 'preview',
      headerName: 'Preview',
      flex: 0.5,
      sortable: false,
      renderCell: (params) =>
        params.row.status === DocumentStatus.COMPLETED && (
          <IconButton
            size="small"
            onClick={() => handleGetDocument(params.row)}
            color="info"
            title="Get document with chunks"
          >
            <VisibilityIcon fontSize="small" />
          </IconButton>
        ),
    },
    {
      field: 'url',
      headerName: 'Open',
      flex: 0.5,
      sortable: false,
      renderCell: (params) =>
        params.value ? (
          <Link to={params.value} target="_blank" rel="noopener noreferrer">
            <IconButton size="small" color="primary">
              <OpenInNewIcon fontSize="small" />
            </IconButton>
          </Link>
        ) : null,
    },
    {
      field: 'chunksCount',
      headerName: 'Chunks Count',
      flex: 0.5,
      renderCell: (params) =>
        params.value && params.value > 0 ? (
          <Typography variant="body2">{params.value}</Typography>
        ) : null,
    },
    {
      field: 'processingDuration',
      headerName: 'Processing Duration',
      flex: 1,
      renderCell: (params) =>
        params.value && params.value > 0 ? (
          <Typography variant="body2">{parseInt(params.value) / 1000} s</Typography>
        ) : null,
    },
    {
      field: 'status',
      headerName: 'Status',
      flex: 1,
      renderCell: (params) => {
        const doc = params.row
        return doc.errorMessage ? (
          <Tooltip title={doc.errorMessage} arrow>
            <Chip
              label={params.value}
              size="small"
              color={
                params.value === DocumentStatus.PENDING
                  ? 'primary'
                  : params.value === DocumentStatus.PROCESSING
                  ? 'warning'
                  : params.value === DocumentStatus.COMPLETED
                  ? 'success'
                  : 'error'
              }
              tabIndex={0}
            />
          </Tooltip>
        ) : (
          <Chip
            label={params.value}
            size="small"
            color={
              params.value === DocumentStatus.PENDING
                ? 'primary'
                : params.value === DocumentStatus.PROCESSING
                ? 'warning'
                : params.value === DocumentStatus.COMPLETED
                ? 'success'
                : 'error'
            }
          />
        )
      },
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
      field: 'updatedAt',
      headerName: 'Updated',
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
            onClick={() => handleEditDocument(params.row)}
            color="primary"
          >
            <EditIcon fontSize="small" />
          </IconButton>
          <IconButton
            size="small"
            onClick={() => handleDeleteDocument(params.row.dataSourceId, params.row.id)}
            color="error"
          >
            <DeleteIcon fontSize="small" />
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
                Last Sync Error: {lastSyncErrorMessage}
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
          <Box sx={{ height: 600, width: '100%' }}>
            <Box sx={{ py: 2, borderBottom: 1, borderColor: 'divider' }}>
              <TextField
                fullWidth
                placeholder="Search documents..."
                variant="outlined"
                size="small"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
              />
            </Box>
            <DataGrid
              rows={filteredDocuments}
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

      <DocumentDetailsDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        document={selectedDocumentDetails.document}
        content={selectedDocumentDetails.content}
        chunks={selectedDocumentDetails.chunks}
        loading={getDocumentWithChunksMutation.isPending}
        error={getDocumentWithChunksMutation.error?.message || null}
      />
    </Box>
  )
}
