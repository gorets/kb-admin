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
  useDocuments,
  useCreateDocument,
  useUpdateDocument,
  useDeleteDocument,
} from '../hooks/useDocuments'
import { useKnowledgeBases } from '../hooks/useKnowledgeBases'
import { useDataSources } from '../hooks/useDataSources'
import DocumentDialog from '../components/DocumentDialog'
import type { Document } from '../types'

export default function DocumentsPage() {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedDoc, setSelectedDoc] = useState<Document | null>(null)

  const { data: documents, isLoading, error } = useDocuments()
  const { data: knowledgeBases } = useKnowledgeBases()
  const { data: dataSources } = useDataSources()
  const createMutation = useCreateDocument()
  const updateMutation = useUpdateDocument()
  const deleteMutation = useDeleteDocument()

  const handleCreate = () => {
    setSelectedDoc(null)
    setDialogOpen(true)
  }

  const handleEdit = (doc: Document) => {
    setSelectedDoc(doc)
    setDialogOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this document?')) {
      await deleteMutation.mutateAsync(id)
    }
  }

  const handleSubmit = async (data: any) => {
    try {
      if (selectedDoc) {
        await updateMutation.mutateAsync({ id: selectedDoc.id, data })
      } else {
        await createMutation.mutateAsync(data)
      }
      setDialogOpen(false)
    } catch (error) {
      console.error('Error saving document:', error)
    }
  }

  const getKnowledgeBaseName = (kbId: string) => {
    return knowledgeBases?.find((kb) => kb.id === kbId)?.name || kbId
  }

  const getDataSourceName = (dsId: string) => {
    return dataSources?.find((ds) => ds.id === dsId)?.name || dsId
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
        Error loading documents: {error.message}
      </Alert>
    )
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">Documents</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleCreate}
        >
          Create Document
        </Button>
      </Box>

      {documents && documents.length === 0 ? (
        <Alert severity="info">
          No documents found. Create your first one to get started.
        </Alert>
      ) : (
        <Grid container spacing={3}>
          {documents?.map((doc) => (
            <Grid item xs={12} sm={6} md={4} key={doc.id}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    {doc.title}
                  </Typography>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{
                      mb: 1,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      display: '-webkit-box',
                      WebkitLineClamp: 3,
                      WebkitBoxOrient: 'vertical',
                    }}
                  >
                    {doc.content}
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 1 }}>
                    <Chip
                      label={getKnowledgeBaseName(doc.knowledgeBaseId)}
                      size="small"
                      color="primary"
                      variant="outlined"
                    />
                    <Chip
                      label={getDataSourceName(doc.dataSourceId)}
                      size="small"
                      color="secondary"
                      variant="outlined"
                    />
                  </Box>
                  {doc.createdAt && (
                    <Typography variant="caption" color="text.secondary" display="block">
                      Created: {new Date(doc.createdAt).toLocaleDateString()}
                    </Typography>
                  )}
                </CardContent>
                <CardActions>
                  <IconButton
                    size="small"
                    onClick={() => handleEdit(doc)}
                    color="primary"
                  >
                    <EditIcon />
                  </IconButton>
                  <IconButton
                    size="small"
                    onClick={() => handleDelete(doc.id)}
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

      <DocumentDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSubmit={handleSubmit}
        document={selectedDoc}
        loading={createMutation.isPending || updateMutation.isPending}
      />
    </Box>
  )
}
