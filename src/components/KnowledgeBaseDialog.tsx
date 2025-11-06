import { useEffect } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
} from '@mui/material'
import { useForm } from './useForm'
import type { KnowledgeBase, CreateKnowledgeBaseRequest } from '../types'

interface KnowledgeBaseDialogProps {
  open: boolean
  onClose: () => void
  onSubmit: (data: CreateKnowledgeBaseRequest) => void
  knowledgeBase?: KnowledgeBase | null
  loading?: boolean
}

export default function KnowledgeBaseDialog({
  open,
  onClose,
  onSubmit,
  knowledgeBase,
  loading = false,
}: KnowledgeBaseDialogProps) {
  const { values, errors, handleChange, handleSubmit, reset, setValues } = useForm<CreateKnowledgeBaseRequest>(
    {
      name: '',
      description: '',
    },
    (data) => {
      onSubmit(data)
    }
  )

  useEffect(() => {
    if (knowledgeBase) {
      setValues({
        name: knowledgeBase.name,
        description: knowledgeBase.description || '',
      })
    } else {
      reset()
    }
  }, [knowledgeBase, reset, setValues])

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <form onSubmit={handleSubmit}>
        <DialogTitle>
          {knowledgeBase ? 'Edit Knowledge Base' : 'Create Knowledge Base'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <TextField
              name="name"
              label="Name"
              value={values.name}
              onChange={handleChange}
              error={!!errors.name}
              helperText={errors.name}
              required
              fullWidth
              autoFocus
            />
            <TextField
              name="description"
              label="Description"
              value={values.description}
              onChange={handleChange}
              multiline
              rows={3}
              fullWidth
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" variant="contained" disabled={loading}>
            {knowledgeBase ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  )
}
