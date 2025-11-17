import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  Box,
  Button,
  Typography,
  IconButton,
  CircularProgress,
  Alert,
  TextField,
} from '@mui/material'
import { DataGrid, GridColDef } from '@mui/x-data-grid'
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
  const [searchText, setSearchText] = useState('')

  const { data: knowledgeBases, isLoading, error } = useKnowledgeBases()

  const filteredKnowledgeBases = useMemo(() => {
    if (!knowledgeBases || !searchText) return knowledgeBases || []

    const lowerSearch = searchText.toLowerCase()
    return knowledgeBases.filter((kb) =>
      kb.name?.toLowerCase().includes(lowerSearch) ||
      kb.description?.toLowerCase().includes(lowerSearch)
    )
  }, [knowledgeBases, searchText])
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

  const columns: GridColDef[] = [
    {
      field: 'name',
      headerName: 'Name',
      flex: 1,
      renderCell: (params) => (
        <Link
          to={`/knowledge-bases/${params.row.id}`}
          style={{ textDecoration: 'none', color: 'inherit' }}
        >
          <Typography
            variant="body1"
            fontWeight="medium"
            sx={{
              '&:hover': { color: 'primary.main', textDecoration: 'underline' },
              cursor: 'pointer',
            }}
          >
            {params.value}
          </Typography>
        </Link>
      ),
    },
    {
      field: 'description',
      headerName: 'Description',
      flex: 2,
      renderCell: (params) => (
        <Typography variant="body2" color="text.secondary">
          {params.value || 'No description'}
        </Typography>
      ),
    },
    {
      field: 'dataSources',
      headerName: 'Data Sources',
      flex: 1,
      renderCell: (params) => (
        <Typography variant="body2">
          {params.value && params.value.length > 0
            ? params.value.length
            : 'No data sources'}
        </Typography>
      ),
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
        <Box sx={{ height: 600, width: '100%' }}>
          <Box sx={{ py: 2, borderBottom: 1, borderColor: 'divider' }}>
            <TextField
              fullWidth
              placeholder="Search knowledge bases..."
              variant="outlined"
              size="small"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
            />
          </Box>
          <DataGrid
            rows={filteredKnowledgeBases}
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
