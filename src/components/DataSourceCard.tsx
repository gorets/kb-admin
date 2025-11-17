import { useState, useMemo } from 'react'
import {
  Card,
  CardContent,
  CardActions,
  Typography,
  IconButton,
  Chip,
  Box,
  Collapse,
  Button,
  CircularProgress,
  TextField,
} from '@mui/material'
import { DataGrid, GridColDef } from '@mui/x-data-grid'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import AddIcon from '@mui/icons-material/Add'
import DescriptionIcon from '@mui/icons-material/Description'
import type { DataSource, Document as DocumentType } from '../types'
import { useDocuments, useDeleteDocument } from '../hooks/useDocuments'
import DocumentDialog from './DocumentDialog'

interface DataSourceCardProps {
  dataSource: DataSource
  onEdit: (ds: DataSource) => void
  onDelete: (id: string) => void
}

export default function DataSourceCard({
  dataSource,
  onEdit,
  onDelete,
}: DataSourceCardProps) {
  const [expanded, setExpanded] = useState(false)
  const [documentDialogOpen, setDocumentDialogOpen] = useState(false)
  const [selectedDocument, setSelectedDocument] = useState<DocumentType | null>(null)
  const [searchText, setSearchText] = useState('')

  const { data: documents, isLoading: documentsLoading } = useDocuments(
    expanded ? dataSource.id : undefined
  )

  const filteredDocuments = useMemo(() => {
    if (!documents || !searchText) return documents || []

    const lowerSearch = searchText.toLowerCase()
    return documents.filter((doc) =>
      doc.title?.toLowerCase().includes(lowerSearch) ||
      doc.content?.toLowerCase().includes(lowerSearch)
    )
  }, [documents, searchText])
  const deleteMutation = useDeleteDocument()

  const handleExpandClick = () => {
    setExpanded(!expanded)
  }

  const handleAddDocument = () => {
    setSelectedDocument(null)
    setDocumentDialogOpen(true)
  }

  const handleEditDocument = (doc: DocumentType) => {
    setSelectedDocument(doc)
    setDocumentDialogOpen(true)
  }

  const handleDeleteDocument = async (docId: string) => {
    if (window.confirm('Are you sure you want to delete this document?')) {
      await deleteMutation.mutateAsync({ documentId: docId, dataSourceId: dataSource.id })
    }
  }

  const columns: GridColDef[] = [
    {
      field: 'title',
      headerName: 'Title',
      flex: 1,
      renderCell: (params) => (
        <Typography variant="body2" fontWeight="medium">
          {params.value}
        </Typography>
      ),
    },
    {
      field: 'content',
      headerName: 'Content Preview',
      flex: 2,
      renderCell: (params) => (
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {params.value}
        </Typography>
      ),
    },
    {
      field: 'createdAt',
      headerName: 'Created',
      flex: 1,
      renderCell: (params) =>
        params.value ? (
          <Typography variant="caption">
            {new Date(params.value).toLocaleDateString()}
          </Typography>
        ) : null,
    },
    {
      field: 'actions',
      headerName: 'Actions',
      flex: 0.5,
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
            onClick={() => handleDeleteDocument(params.row.id)}
            color="error"
          >
            <DeleteIcon fontSize="small" />
          </IconButton>
        </Box>
      ),
    },
  ]

  return (
    <>
      <Card>
        <CardContent>
          <Box display="flex" justifyContent="space-between" alignItems="start">
            <Box flex={1}>
              <Typography variant="h6" gutterBottom>
                {dataSource.name}
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, mb: 1, flexWrap: 'wrap' }}>
                <Chip label={dataSource.type} size="small" color="primary" />
                {dataSource.syncStatus && (
                  <Chip label={dataSource.syncStatus} size="small" color="default" />
                )}
              </Box>
              {dataSource.createdAt && (
                <Typography variant="caption" color="text.secondary" display="block" mt={1}>
                  Created: {new Date(dataSource.createdAt).toLocaleDateString()}
                </Typography>
              )}
            </Box>
            <IconButton
              onClick={handleExpandClick}
              aria-expanded={expanded}
              aria-label="show documents"
              sx={{
                transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
                transition: 'transform 0.3s',
              }}
            >
              <ExpandMoreIcon />
            </IconButton>
          </Box>
        </CardContent>
        <CardActions>
          <IconButton size="small" onClick={() => onEdit(dataSource)} color="primary">
            <EditIcon />
          </IconButton>
          <IconButton size="small" onClick={() => onDelete(dataSource.id)} color="error">
            <DeleteIcon />
          </IconButton>
          <Box flex={1} />
          <Button
            size="small"
            startIcon={<DescriptionIcon />}
            onClick={handleExpandClick}
          >
            {expanded ? 'Hide' : 'Show'} Documents ({documents?.length || 0})
          </Button>
        </CardActions>
        <Collapse in={expanded} timeout="auto" unmountOnExit>
          <CardContent>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6">Documents</Typography>
              <Button
                size="small"
                startIcon={<AddIcon />}
                onClick={handleAddDocument}
                variant="outlined"
              >
                Add Document
              </Button>
            </Box>

            {documentsLoading ? (
              <Box display="flex" justifyContent="center" p={3}>
                <CircularProgress size={30} />
              </Box>
            ) : documents && documents.length > 0 ? (
              <Box sx={{ height: 400, width: '100%' }}>
                <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
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
                      paginationModel: { pageSize: 5, page: 0 },
                    },
                  }}
                  pageSizeOptions={[5, 10, 25]}
                  disableRowSelectionOnClick
                  density="compact"
                />
              </Box>
            ) : (
              <Typography variant="body2" color="text.secondary" align="center" py={2}>
                No documents yet. Click "Add Document" to create one.
              </Typography>
            )}
          </CardContent>
        </Collapse>
      </Card>

      <DocumentDialog
        open={documentDialogOpen}
        onClose={() => setDocumentDialogOpen(false)}
        onSubmit={() => {
          // Submit handled by DocumentDialog
          setDocumentDialogOpen(false)
        }}
        document={selectedDocument}
        preselectedDataSourceId={dataSource.id}
      />
    </>
  )
}
