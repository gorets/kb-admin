import { useEffect } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  MenuItem,
} from '@mui/material'
import { useForm } from './useForm'
import type { Document, CreateDocumentRequest } from '../types'
import { useKnowledgeBases } from '../hooks/useKnowledgeBases'
import { useDataSources } from '../hooks/useDataSources'

interface DocumentDialogProps {
  open: boolean
  onClose: () => void
  onSubmit: (data: CreateDocumentRequest) => void
  document?: Document | null
  loading?: boolean
}

export default function DocumentDialog({
  open,
  onClose,
  onSubmit,
  document,
  loading = false,
}: DocumentDialogProps) {
  const { data: knowledgeBases } = useKnowledgeBases()
  const { data: dataSources } = useDataSources()

  const { values, errors, handleChange, handleSubmit, reset, setValues } = useForm<CreateDocumentRequest>(
    {
      knowledgeBaseId: '',
      dataSourceId: '',
      title: '',
      content: '',
    },
    (data) => {
      onSubmit(data)
    }
  )

  useEffect(() => {
    if (document) {
      setValues({
        knowledgeBaseId: document.knowledgeBaseId,
        dataSourceId: document.dataSourceId,
        title: document.title,
        content: document.content,
        metadata: document.metadata,
      })
    } else {
      reset()
    }
  }, [document, reset, setValues])

  // Filter data sources by selected knowledge base
  const filteredDataSources = dataSources?.filter(
    (ds) => ds.knowledgeBaseId === values.knowledgeBaseId
  )

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <form onSubmit={handleSubmit}>
        <DialogTitle>
          {document ? 'Edit Document' : 'Create Document'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <TextField
              select
              name="knowledgeBaseId"
              label="Knowledge Base"
              value={values.knowledgeBaseId}
              onChange={handleChange}
              error={!!errors.knowledgeBaseId}
              helperText={errors.knowledgeBaseId}
              required
              fullWidth
            >
              {knowledgeBases?.map((kb) => (
                <MenuItem key={kb.id} value={kb.id}>
                  {kb.name}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              select
              name="dataSourceId"
              label="Data Source"
              value={values.dataSourceId}
              onChange={handleChange}
              error={!!errors.dataSourceId}
              helperText={errors.dataSourceId}
              required
              fullWidth
              disabled={!values.knowledgeBaseId}
            >
              {filteredDataSources?.map((ds) => (
                <MenuItem key={ds.id} value={ds.id}>
                  {ds.name}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              name="title"
              label="Title"
              value={values.title}
              onChange={handleChange}
              error={!!errors.title}
              helperText={errors.title}
              required
              fullWidth
            />
            <TextField
              name="content"
              label="Content"
              value={values.content}
              onChange={handleChange}
              error={!!errors.content}
              helperText={errors.content}
              required
              multiline
              rows={8}
              fullWidth
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" variant="contained" disabled={loading}>
            {document ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  )
}
