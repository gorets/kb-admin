import { useEffect, useMemo, useCallback } from 'react'
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
import { useDataSources } from '../hooks/useDataSources'
import { useCreateDocument, useUpdateDocument } from '../hooks/useDocuments'

interface DocumentDialogProps {
  open: boolean
  onClose: () => void
  onSubmit?: (data: CreateDocumentRequest) => void
  document?: Document | null
  loading?: boolean
  preselectedDataSourceId?: string
}

export default function DocumentDialog({
  open,
  onClose,
  onSubmit,
  document,
  loading = false,
  preselectedDataSourceId,
}: DocumentDialogProps) {
  const { data: dataSources } = useDataSources()
  const createMutation = useCreateDocument()
  const updateMutation = useUpdateDocument()

  const initialValues = useMemo<CreateDocumentRequest>(() => ({
    dataSourceId: preselectedDataSourceId || '',
    title: '',
    url: '',
    content: '',
    originalFormat: '',
    originalName: '',
    originalId: undefined,
  }), [preselectedDataSourceId])

  const handleSubmitCallback = useCallback(async (data: CreateDocumentRequest) => {
    try {
      if (document) {
        await updateMutation.mutateAsync({ 
          id: document.id, 
          data: { ...data, documentId: document.id } 
        })
      } else {
        await createMutation.mutateAsync(data)
      }
      if (onSubmit) {
        onSubmit(data)
      }
      onClose()
    } catch (error) {
      console.error('Error saving document:', error)
    }
  }, [document, updateMutation, createMutation, onSubmit, onClose])

  const { values, errors, handleChange, handleSubmit, reset, setValues } = useForm<CreateDocumentRequest>(
    initialValues,
    handleSubmitCallback
  )

  useEffect(() => {
    if (!open) return
    
    if (document) {
      setValues({
        dataSourceId: document.dataSourceId,
        title: document.title,
        url: document.url || '',
        content: document.content || '',
        originalFormat: document.originalFormat,
        originalName: document.originalName,
        originalId: document.originalId,
      })
    } else {
      reset()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, document?.id, preselectedDataSourceId])

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
              name="dataSourceId"
              label="Data Source"
              value={values.dataSourceId}
              onChange={handleChange}
              error={!!errors.dataSourceId}
              helperText={errors.dataSourceId}
              required
              fullWidth
              disabled={!!preselectedDataSourceId}
            >
              {dataSources?.map((ds) => (
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
              name="url"
              label="URL"
              value={values.url || ''}
              onChange={handleChange}
              fullWidth
            />
            <TextField
              name="content"
              label="Content"
              value={values.content || ''}
              onChange={handleChange}
              multiline
              rows={8}
              fullWidth
            />
            <TextField
              name="originalFormat"
              label="Original Format"
              value={values.originalFormat}
              onChange={handleChange}
              required
              fullWidth
            />
            <TextField
              name="originalName"
              label="Original Name"
              value={values.originalName}
              onChange={handleChange}
              required
              fullWidth
            />
            <TextField
              name="originalId"
              label="Original ID"
              value={values.originalId || ''}
              onChange={handleChange}
              fullWidth
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={onClose}
            disabled={loading || createMutation.isPending || updateMutation.isPending}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={loading || createMutation.isPending || updateMutation.isPending}
          >
            {document ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  )
}
