import { useState } from 'react'
import {
  Box,
  Button,
  Typography,
  IconButton,
  CircularProgress,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import {
  useKnowledgeBases,
  useCreateKnowledgeBase,
  useUpdateKnowledgeBase,
  useDeleteKnowledgeBase,
} from '../hooks/useKnowledgeBases'
import KnowledgeBaseDialog from '../components/KnowledgeBaseDialog'
import type { KnowledgeBase } from '../types'

export default function KnowledgeBasesPage() {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedKB, setSelectedKB] = useState<KnowledgeBase | null>(null)

  const { data: knowledgeBases, isLoading, error } = useKnowledgeBases()
  const createMutation = useCreateKnowledgeBase()
  const updateMutation = useUpdateKnowledgeBase()
  const deleteMutation = useDeleteKnowledgeBase()

  const handleCreate = () => {
    setSelectedKB(null)
    setDialogOpen(true)
  }

  const handleEdit = (kb: KnowledgeBase) => {
    setSelectedKB(kb)
    setDialogOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this knowledge base?')) {
      await deleteMutation.mutateAsync(id)
    }
  }

  const handleSubmit = async (data: any) => {
    try {
      if (selectedKB) {
        await updateMutation.mutateAsync({ id: selectedKB.id, data })
      } else {
        await createMutation.mutateAsync(data)
      }
      setDialogOpen(false)
    } catch (error) {
      console.error('Error saving knowledge base:', error)
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
        Error loading knowledge bases: {error.message}
      </Alert>
    )
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">Knowledge Bases</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleCreate}
        >
          Create Knowledge Base
        </Button>
      </Box>

      {knowledgeBases && knowledgeBases.length === 0 ? (
        <Alert severity="info">
          No knowledge bases found. Create your first one to get started.
        </Alert>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Description</TableCell>
                <TableCell>Created</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {knowledgeBases?.map((kb) => (
                <TableRow key={kb.id} hover>
                  <TableCell>
                    <Typography variant="body1" fontWeight="medium">
                      {kb.name}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="text.secondary">
                      {kb.description || 'No description'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    {kb.createdAt && (
                      <Typography variant="body2">
                        {new Date(kb.createdAt).toLocaleDateString()}
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell align="right">
                    <IconButton
                      size="small"
                      onClick={() => handleEdit(kb)}
                      color="primary"
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => handleDelete(kb.id)}
                      color="error"
                    >
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <KnowledgeBaseDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSubmit={handleSubmit}
        knowledgeBase={selectedKB}
        loading={createMutation.isPending || updateMutation.isPending}
      />
    </Box>
  )
}
