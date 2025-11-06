import { useState } from 'react'
import {
  Card,
  CardContent,
  CardActions,
  Typography,
  IconButton,
  Chip,
  Box,
  Collapse,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  CircularProgress,
} from '@mui/material'
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
  knowledgeBaseName: string
  onEdit: (ds: DataSource) => void
  onDelete: (id: string) => void
}

export default function DataSourceCard({
  dataSource,
  knowledgeBaseName,
  onEdit,
  onDelete,
}: DataSourceCardProps) {
  const [expanded, setExpanded] = useState(false)
  const [documentDialogOpen, setDocumentDialogOpen] = useState(false)
  const [selectedDocument, setSelectedDocument] = useState<DocumentType | null>(null)

  const { data: documents, isLoading: documentsLoading } = useDocuments(
    expanded ? dataSource.id : undefined
  )
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
      await deleteMutation.mutateAsync(docId)
    }
  }

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
                {dataSource.status && (
                  <Chip label={dataSource.status} size="small" color="default" />
                )}
              </Box>
              <Typography variant="body2" color="text.secondary">
                KB: {knowledgeBaseName}
              </Typography>
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
              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
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
                          <Typography variant="body2" fontWeight="medium">
                            {doc.title}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{
                              maxWidth: 300,
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
                            <Typography variant="caption">
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
                            onClick={() => handleDeleteDocument(doc.id)}
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
        onSubmit={(data) => {
          // Submit handled by DocumentDialog
          setDocumentDialogOpen(false)
        }}
        document={selectedDocument}
        preselectedDataSourceId={dataSource.id}
        preselectedKnowledgeBaseId={dataSource.knowledgeBaseId}
      />
    </>
  )
}
